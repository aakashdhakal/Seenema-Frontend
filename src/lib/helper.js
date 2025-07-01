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
const REBUFFER_PENALTY = 10; // Penalty (utility units) per segment of rebuffer.
const MAX_BUFFER_CAPACITY_SECONDS = 30; // Max desired buffer in seconds (e.g., 3 segments * 5s/segment)
const FILL_THRESHOLD_SEGMENTS = 6; // Download next segment when buffer drops to 2 segments (or 10s if typical is 5s)

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
	placeholderBuffer, // placeholderBuffer.buffer is in SECONDS
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

	// Define your buffer thresholds based on segment duration
	// Assuming segment durations are somewhat consistent, let's use the first segment's duration
	const typicalSegmentDuration = segmentList[0]?.duration || 5; // Default to 5s if unknown
	const MAX_BUFFER_SEGMENTS =
		MAX_BUFFER_CAPACITY_SECONDS / typicalSegmentDuration;

	const appendNextSegment = async () => {
		if (segmentIndex >= segmentList.length) {
			console.log("✅ All segments appended.");
			if (mediaSource.readyState === "open") {
				mediaSource.endOfStream();
			}
			return;
		}

		const segment = segmentList[segmentIndex];

		// --- NEW BUFFER MANAGEMENT LOGIC ---
		// Wait if the buffer is sufficiently full
		const currentBufferLevelSeconds = getCurrentBufferLevel(videoElement);
		// Only start waiting if we are not at the very beginning of main playback
		if (
			segmentIndex > 0 &&
			currentBufferLevelSeconds >=
				FILL_THRESHOLD_SEGMENTS * typicalSegmentDuration
		) {
			console.log(
				`⏸️ Buffer level (${currentBufferLevelSeconds.toFixed(
					2,
				)}s) is above threshold (${(
					FILL_THRESHOLD_SEGMENTS * typicalSegmentDuration
				).toFixed(2)}s). Waiting for playback to consume.`,
			);
			await new Promise((resolve) => {
				const checkBuffer = () => {
					const newBufferLevel = getCurrentBufferLevel(videoElement);
					if (
						newBufferLevel <
						FILL_THRESHOLD_SEGMENTS * typicalSegmentDuration
					) {
						console.log(
							`▶️ Resuming: Buffer dropped to ${newBufferLevel.toFixed(2)}s.`,
						);
						resolve();
					} else {
						setTimeout(checkBuffer, 500); // Check every 500ms
					}
				};
				checkBuffer();
			});
		}
		// --- END NEW BUFFER MANAGEMENT LOGIC ---

		try {
			const selectedResolution = await BOLA(
				videoId,
				videoElement,
				segment,
				resolutionList,
				totalDuration,
				lastSelectedResolution,
				lastBandwidth,
				segmentIndex === 0 ? placeholderBuffer.buffer : null, // placeholderBuffer.buffer is in SECONDS
				typicalSegmentDuration, // Pass typicalSegmentDuration to BOLA
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
					videoElement.muted = false; // Unmute for autoplay
					console.log("Autoplay worked with sound.");
				})
				.catch((err) => {
					console.warn("Autoplay with sound failed, retrying with mute:", err);
					videoElement.muted = false;
					videoElement.play();
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
		resolutionList[resolutionList.length - 1] || resolutionList[0]; // Try highest resolution, fallback to lowest

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
	let startupResolution = "1080p";
	for (let res of resolutionList) {
		if (bitrateTable[res] && bitrateTable[res] <= estimatedBitrateKbps) {
			startupResolution = res;
		}
	}

	// placeholderBuffer in seconds, to be passed to BOLA and converted there if needed
	const placeHolderBuffer = Math.min(
		10, // Ensure at least 4s buffer for initial play
		(bitrateTable[startupResolution] * 5) / estimatedBitrateKbps, // This 5 is segment duration in seconds
	);

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
	placeHolderBufferSeconds, // NOW this is explicitly in SECONDS
	typicalSegmentDuration, // Passed from startMainPlayback for unit consistency
) {
	const currentTime = videoElement.currentTime;
	const segmentDuration = segment.duration; // This is the actual segment duration

	// Use typicalSegmentDuration for calculations where a consistent segment duration is assumed
	// (e.g., converting seconds to segments)
	const effectiveSegmentDuration = typicalSegmentDuration;

	// Step 2: t ← min[currentTime, totalDuration - currentTime]
	const t = Math.min(currentTime, totalDuration - currentTime);

	// Step 3: t' ← max[t/2, 3p] (where p is effectiveSegmentDuration)
	const t_prime = Math.max(t / 2, 3 * effectiveSegmentDuration);

	// Step 4: QD_max ← min[MAX_BUFFER_CAPACITY_SEGMENTS, t'/p]
	// QD_max and Q must be in segments for BOLA formula
	const MAX_BUFFER_CAPACITY_SEGMENTS =
		MAX_BUFFER_CAPACITY_SECONDS / effectiveSegmentDuration;
	const QD_max = Math.min(
		MAX_BUFFER_CAPACITY_SEGMENTS,
		t_prime / effectiveSegmentDuration,
	); // QD_max in segments

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

	// Step 5: V_D ← (QD_max - 1) / (max utility + γ)
	// γ (REBUFFER_PENALTY) is now a penalty *per segment*
	const V_D = (QD_max - 1) / (U_max + REBUFFER_PENALTY);

	// Q must be in segments
	const Q =
		placeHolderBufferSeconds !== null
			? placeHolderBufferSeconds / effectiveSegmentDuration // Convert from seconds to segments
			: getCurrentBufferLevel(videoElement) / effectiveSegmentDuration; // Convert from seconds to segments

	let score = [];

	// Step 6: m*[n] ← arg maxm (V_D * U_m + V_Dγ - Q) / S_m
	for (let i = 0; i < resolutionList.length; i++) {
		const res = resolutionList[i];
		const S_m = segmentSizes.sizes[res]; // in bytes
		const S_m_MB = S_m / (1024 * 1024); // convert to MB

		// REBUFFER_PENALTY is already in "per segment" units, so no * segmentDuration here
		const resolutionScore =
			(V_D * U_m[i] + V_D * REBUFFER_PENALTY - Q) / S_m_MB;
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
		const maxR = Math.max(r, lastSizeMB / segmentDuration); // MBps (using actual segmentDuration for this rate)

		// Step 9: m0 ← min m such that S_m / p ≤ maxR
		let m0 = resolutionList[0]; // Default to lowest resolution
		for (let res of resolutionList) {
			const S_m = (segmentSizes.sizes[res] || 0) / (1024 * 1024); // MB
			if (S_m / effectiveSegmentDuration <= maxR) {
				// Use effectiveSegmentDuration for rate comparison
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

			// New lines (corrected): Scores should be calculated consistently
			const score_m0 = (V_D * m0_U + V_D * REBUFFER_PENALTY - Q) / m0_S;
			const score_m0m1 = (V_D * m0m1_U + V_D * REBUFFER_PENALTY - Q) / m0m1_S;

			// Step 15: pause until (VD*υm0 + VD*γp − Q)/Sm0 ≥(VDυm0−1 + VDγp − Q)/Sm0−1
			if (score_m0 >= score_m0m1) {
				const pauseTimeSeconds = Math.max(
					0,
					effectiveSegmentDuration * (Q - QD_max + 1),
				);
				await new Promise((resolve) =>
					setTimeout(resolve, pauseTimeSeconds * 1000),
				);
				bestResIndex = m0Index;
				// Step 16: else m0 ← m0 − 1
			} else {
				console.log("🧹 BOLA-U: Dropping one level to reduce oscillation.");
				bestResIndex = Math.max(0, m0Index - 1);
			}
		}
	}
	// Step 17: pause for max[p · (Q − QD_max + 1), 0]
	// Pause time in seconds, using Q and QD_max in segments
	const pauseTimeSeconds = Math.max(
		0,
		effectiveSegmentDuration * (Q - QD_max + 1),
	);
	await new Promise((resolve) => setTimeout(resolve, pauseTimeSeconds * 1000)); // Convert to milliseconds
	return resolutionList[bestResIndex];
}

// ONLY THIS FUNCTION NEEDS TO BE CHANGED
function calculateUtility(segmentSizes, resolutionList) {
	// FIX: Pass segmentSizes to calculateMinSegmentSize
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
