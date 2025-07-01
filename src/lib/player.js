import {
	getInitFile,
	getVideoSegment,
	getIntroInit,
	getIntroManifest,
	getIntroVideo,
	parseManifest,
} from "./utils"; // Assuming utils.js is still separate

import BOLA_Algorithm from "./bola"; // Renamed the import to avoid conflict with function name
import { getPlaceholderBuffer } from "./bola";

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
			const selectedResolution = await BOLA_Algorithm(
				// Call the imported BOLA function
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
