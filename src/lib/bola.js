import {
	getInitFile,
	getSegmentSizes,
	getVideoSegment,
	getIntroInit,
	getIntroManifest,
	getIntroVideo,
	parseManifest,
} from "./utils";

const BANDWIDTH_ALPHA = 0.6; // Lower alpha (e.g., 0.1 to 0.3) for more smoothing, higher for faster reaction. 0.1 is very conservative, adjust as needed (e.g., 0.2-0.5).
const REBUFFER_PENALTY = 10; // 4 seconds penalty for rebuffering, adjust as needed
const MAX_BUFFER_CAPACITY = 15; // 10 seconds buffer, adjust as needed

function getCurrentBufferLevel(videoElement) {
	if (
		!videoElement ||
		!videoElement.buffered ||
		videoElement.buffered.length === 0
	) {
		return 0;
	}
	// buffered.end(0) gives the end time of the first (and usually only) buffered range
	return videoElement.buffered.end(0) - videoElement.currentTime;
}

export async function initializeVideoStream(
	videoElement,
	videoId,
	segmentList,
	resolutionList,
	videoDuration,
) {
	if (!videoElement || !videoId || segmentList.length === 0) {
		console.error("Missing videoElement, videoId, or segmentList.");
		return;
	}

	const mediaSource = new MediaSource();
	videoElement.src = URL.createObjectURL(mediaSource);

	mediaSource.addEventListener("sourceopen", async () => {
		mediaSource.duration = videoDuration;
		const sourceBuffer = mediaSource.addSourceBuffer(
			'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
		);

		try {
			const placeholderBuffer = await getPlaceholderBuffer(
				videoId,
				resolutionList,
				segmentList,
			);
			const startupRes = placeholderBuffer.startupResolution;

			await playIntro(sourceBuffer, startupRes);
			await startMainPlayback(
				sourceBuffer,
				videoElement,
				videoId,
				segmentList,
				resolutionList,
				placeholderBuffer,
				startupRes,
				mediaSource,
			);
		} catch (err) {
			console.error("🔥 Error during stream initialization:", err);
		}
	});
}

async function playIntro(sourceBuffer, resolution) {
	const introInit = await getIntroInit(resolution);
	const introManifestText = await getIntroManifest(resolution);
	const introSegments = parseManifest(introManifestText);

	console.log("🎬 Appending intro init...");
	sourceBuffer.appendBuffer(introInit);

	await new Promise((resolve) => {
		sourceBuffer.addEventListener(
			"updateend",
			function onIntroInitEnd() {
				sourceBuffer.removeEventListener("updateend", onIntroInitEnd);

				let introIndex = 0;

				const appendNextIntroSegment = async () => {
					if (introIndex >= introSegments.length) {
						console.log("✅ Intro finished.");
						return resolve();
					}

					const segmentData = await getIntroVideo(resolution);

					if (!segmentData) {
						console.warn("Intro segment missing, skipping...");
						introIndex++;
						appendNextIntroSegment();
						return;
					}

					sourceBuffer.addEventListener(
						"updateend",
						function onIntroSegmentEnd() {
							sourceBuffer.removeEventListener("updateend", onIntroSegmentEnd);
							introIndex++;
							appendNextIntroSegment();
						},
						{ once: true },
					);
					sourceBuffer.appendBuffer(segmentData);
				};

				appendNextIntroSegment();
			},
			{ once: true },
		);
	});
}

async function startMainPlayback(
	sourceBuffer,
	videoElement,
	videoId,
	segmentList,
	resolutionList,
	placeholderBuffer,
	startupRes,
	mediaSource,
) {
	const initSegment = await getInitFile(videoId, startupRes);
	if (!initSegment) throw new Error("Failed to fetch init segment");

	let segmentIndex = 0;
	let lastSelectedResolution = startupRes;
	let lastBandwidth = null;

	const introManifestText = await getIntroManifest(startupRes);
	const introSegments = parseManifest(introManifestText);
	const introDuration = introSegments.reduce(
		(acc, seg) => acc + seg.duration,
		0,
	);
	sourceBuffer.timestampOffset = introDuration;

	const totalDuration = segmentList.reduce((acc, seg) => acc + seg.duration, 0);

	const appendNextSegment = async () => {
		if (segmentIndex >= segmentList.length) {
			console.log("✅ All segments appended.");
			if (mediaSource.readyState === "open") {
				mediaSource.endOfStream();
			}
			return;
		}

		const segment = segmentList[segmentIndex];

		try {
			const selectedResolution = await BOLA(
				videoId,
				videoElement,
				segment,
				resolutionList,
				totalDuration,
				lastSelectedResolution,
				lastBandwidth,
				segmentIndex === 0 ? placeholderBuffer.buffer : null,
			);

			const downloadStart = performance.now();
			const segmentData = await getVideoSegment(
				videoId,
				selectedResolution,
				segment.name,
			);
			const downloadEnd = performance.now();

			if (!segmentData) {
				console.warn(`❌ Segment ${segment.name} not found.`);
				segmentIndex++;
				appendNextSegment();
				return;
			}

			const sizeMB = segmentData.byteLength / (1024 * 1024);
			const downloadTime = Math.max((downloadEnd - downloadStart) / 1000, 0.05);

			const currentInstantaneousBandwidth = sizeMB / downloadTime;
			if (lastBandwidth === null) {
				lastBandwidth = currentInstantaneousBandwidth;
			} else {
				lastBandwidth =
					BANDWIDTH_ALPHA * currentInstantaneousBandwidth +
					(1 - BANDWIDTH_ALPHA) * lastBandwidth;
			}

			sourceBuffer.addEventListener(
				"updateend",
				function onUpdateEnd() {
					sourceBuffer.removeEventListener("updateend", onUpdateEnd);
					lastSelectedResolution = selectedResolution;
					segmentIndex++;
					appendNextSegment();
				},
				{ once: true },
			);

			if (selectedResolution !== lastSelectedResolution) {
				const newInit = await getInitFile(videoId, selectedResolution);
				sourceBuffer.addEventListener(
					"updateend",
					function onInitAppended() {
						sourceBuffer.removeEventListener("updateend", onInitAppended);
						sourceBuffer.appendBuffer(segmentData);
					},
					{ once: true },
				);
				sourceBuffer.appendBuffer(newInit);
			} else {
				sourceBuffer.appendBuffer(segmentData);
			}
		} catch (err) {
			console.error("❌ Error fetching segment:", err);
			segmentIndex++;
			appendNextSegment();
		}
	};

	sourceBuffer.addEventListener(
		"updateend",
		function onMainInitReady() {
			sourceBuffer.removeEventListener("updateend", onMainInitReady);
			appendNextSegment();
		},
		{ once: true },
	);

	sourceBuffer.appendBuffer(initSegment);

	const waitUntilBuffered = () => {
		const bufferLevel = getCurrentBufferLevel(videoElement);
		if (bufferLevel >= 4) {
			videoElement
				.play()
				.then(() => {
					console.log("Autoplay worked with mute, trying to unmute...");
					videoElement.muted = false;
				})
				.catch((err) => {
					console.warn("Autoplay failed even with mute:", err);
				});
		} else {
			setTimeout(waitUntilBuffered, 500);
		}
	};

	waitUntilBuffered();
}

async function getPlaceholderBuffer(videoId, resolutionList, segmentList) {
	const start = performance.now();
	console.log(resolutionList);

	const initialTestResolution =
		resolutionList[resolutionList.length - 1] || resolutionList[0]; // Try 240p, fallback to 144p

	const initSegment = await getVideoSegment(
		videoId,
		initialTestResolution,
		segmentList[0].name,
	);
	const end = performance.now();

	const initDuration = (end - start) / 1000;
	const initSizeMB = initSegment.byteLength / (1024 * 1024);
	const measuredBandwidthMBps = initSizeMB / initDuration;

	const bitrateTable = {
		"144p": 150,
		"240p": 400,
		"360p": 800,
		"480p": 1200,
		"720p": 2500,
		"1080p": 4500,
	}; // in kbps

	const estimatedBitrateKbps = measuredBandwidthMBps * 8 * 1024;
	let startupResolution = "144p";
	for (let res of resolutionList) {
		if (bitrateTable[res] && bitrateTable[res] <= estimatedBitrateKbps) {
			startupResolution = res;
		}
	}

	const placeHolderBuffer = Math.min(
		4,
		(bitrateTable[startupResolution] * 5) / estimatedBitrateKbps,
	); // 4s segment

	return {
		startupResolution,
		buffer: placeHolderBuffer,
	};
}

// BOLA (Buffer Occupancy Based Lyapunov Algorithm)
export default async function BOLA(
	videoId,
	videoElement,
	segment,
	resolutionList,
	totalDuration,
	lastSelectedResolution = null,
	lastBandwidth = null, // This is the smoothed bandwidth from initializeVideoStream
	placeHolderBuffer,
) {
	const currentTime = videoElement.currentTime;
	const segmentDuration = segment.duration;

	// Step 2: t ← min[currentTime, totalDuration - currentTime]
	const t = Math.min(currentTime, totalDuration - currentTime);

	// Step 3: t' ← max[t/2, 3p] (where p is segmentDuration)
	const t_prime = Math.max(t / 2, 3 * segmentDuration);

	// Step 4: QD_max ← min[maxBufferCapacity, t'/p]
	const QD_max = Math.min(MAX_BUFFER_CAPACITY, t_prime / segmentDuration);

	let segmentSizes; // in bytes, direct object { "360p": 12345, ... }
	try {
		segmentSizes = await getSegmentSizes(segment.name, videoId);
	} catch (error) {
		console.error("Error fetching segment sizes for BOLA:", error);
		// Fallback to a default or handle error appropriately, e.g., choose lowest resolution
		return resolutionList[0];
	}

	const U_m = calculateUtility(segmentSizes.sizes, resolutionList); // Utility for each resolution
	const U_max = Math.max(...U_m); // Max utility across resolutions

	// Step 5: V_D ← (QD_max - 1) / (max utility + γp)
	const V_D = (QD_max - 1) / (U_max + REBUFFER_PENALTY * segmentDuration);

	const Q =
		placeHolderBuffer !== null
			? placeHolderBuffer
			: getCurrentBufferLevel(videoElement);

	let score = [];

	// --- NEW LOGGING ADDED HERE ---
	console.log("--- BOLA Calculation Details ---");
	console.log(`Segment: ${segment.name}, Time: ${currentTime.toFixed(2)}s`);
	console.log(
		`Last Smoothed Bandwidth (MBps): ${
			lastBandwidth ? lastBandwidth.toFixed(2) : "N/A"
		}`,
	);
	console.log(`Current Buffer Level (Q): ${Q.toFixed(2)}s`);
	console.log(`Desired Buffer Level (QD_max): ${QD_max.toFixed(2)}s`);
	console.log(`Lyapunov Parameter (V_D): ${V_D.toFixed(2)}`);
	console.log(`Rebuffer Penalty (γ): ${REBUFFER_PENALTY}`);
	// --- END NEW LOGGING ---

	// Step 6: m*[n] ← arg maxm (V_D * U_m + V_Dγp - Q) / S_m
	for (let i = 0; i < resolutionList.length; i++) {
		const res = resolutionList[i];
		const S_m = segmentSizes.sizes[res]; // in bytes
		const S_m_MB = S_m / (1024 * 1024); // convert to MB

		const resolutionScore =
			(V_D * U_m[i] + V_D * REBUFFER_PENALTY * segmentDuration - Q) / S_m_MB;
		score.push(resolutionScore);
	}
	let bestResIndex = score.indexOf(Math.max(...score));
	// Fallback in case all scores are -Infinity (e.g., all segment sizes were 0)
	if (bestResIndex === -1) {
		bestResIndex = 0; // Default to lowest resolution
	}
	let m_star = resolutionList[bestResIndex];

	// Step 7: if m*[n] < m*[n−1] → quality dropped
	if (
		lastSelectedResolution !== null &&
		resolutionList.indexOf(m_star) <
			resolutionList.indexOf(lastSelectedResolution)
	) {
		// Step 8: r ← measured bandwidth of last segment
		const r = lastBandwidth || 0; // MBps, default to 0 if no bandwidth measured yet
		const lastSizeMB =
			(segmentSizes.sizes[lastSelectedResolution] || 0) / (1024 * 1024); // MB
		const maxR = Math.max(r, lastSizeMB / segmentDuration); // MBps

		// Step 9: m0 ← min m such that S_m / p ≤ maxR
		let m0 = resolutionList[0]; // Default to lowest resolution
		for (let res of resolutionList) {
			const S_m = (segmentSizes.sizes[res] || 0) / (1024 * 1024); // MB
			if (S_m / segmentDuration <= maxR) {
				m0 = res;
				break;
			}
		}

		const m0Index = resolutionList.indexOf(m0);
		const mPrevIndex = resolutionList.indexOf(lastSelectedResolution);
		const mStarIndex = bestResIndex;

		// Step 10: if m0 ≤ m∗[n] then
		if (m0Index <= mStarIndex) {
			// Step 11: m0 ← m*[n]
			bestResIndex = mStarIndex;
			// Step 12: else if m0 > m*[n] then
		} else if (m0Index > mPrevIndex) {
			// Step 13: m0 ← m*[n-1]
			bestResIndex = mPrevIndex;
		} else {
			// Step 14: else if some utility sacrificed for fewer oscillations then
			const m0_S = segmentSizes.sizes[resolutionList[m0Index]] / (1024 * 1024); // MB
			const m0_U = U_m[m0Index];

			const m0m1Index = Math.max(0, m0Index - 1);
			const m0m1_S =
				segmentSizes.sizes[resolutionList[m0m1Index]] / (1024 * 1024); // MB
			const m0m1_U = U_m[m0m1Index];

			// New lines (corrected):
			const score_m0 = (V_D * m0_U - Q) / m0_S;
			const score_m0m1 = (V_D * m0m1_U - Q) / m0m1_S;

			// Step 15: pause until (VD*υm0 + VD*γp − Q)/Sm0 ≥(VDυm0−1 + VDγp − Q)/Sm0−1
			if (score_m0 >= score_m0m1) {
				console.log(
					"🧠 BOLA-O: Utility drop not worth it. Pausing before switching.",
				);
				const pauseTime =
					Math.max(0, segmentDuration * (Q - QD_max + 1)) * 1000; // ms
				await new Promise((resolve) => setTimeout(resolve, pauseTime));
				bestResIndex = m0Index;
				// Step 16: else m0 ← m0 − 1
			} else {
				console.log("🧹 BOLA-U: Dropping one level to reduce oscillation.");
				bestResIndex = Math.max(0, m0Index - 1);
			}
		}
	}
	console.table(
		resolutionList.map((res, i) => ({
			resolution: res,
			utility: U_m[i].toFixed(2),
			segmentSizeMB: (segmentSizes.sizes[res] / (1024 * 1024)).toFixed(2),
			score: score[i].toFixed(2),
		})),
	);
	// Step 17: pause for max[p · (Q − QD_max + 1), 0]
	const pauseTime = Math.max(0, segmentDuration * (Q - QD_max + 1));
	await new Promise((resolve) => setTimeout(resolve, pauseTime));
	return resolutionList[bestResIndex];
}

function calculateUtility(segmentSizes, resolutionList) {
	const S_min = calculateMinSegmentSize(segmentSizes);

	const utility = [];
	resolutionList.forEach((res) => {
		const S_m = segmentSizes[res];
		if (S_m > 0 && S_min > 0) {
			const utilityValue = Math.log(S_m / S_min);
			utility.push(utilityValue);
		} else {
			utility.push(0); // If size is 0 or S_min is 0, utility is 0
		}
	});
	return utility;
}

function calculateMinSegmentSize(sizes) {
	const validSizes = Object.values(sizes).filter((size) => size > 0);
	if (validSizes.length === 0) {
		return 1; // Prevent division by zero if all sizes are zero, use a small positive number
	}
	return Math.min(...validSizes);
}
