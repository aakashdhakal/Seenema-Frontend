import {
	getInitFile,
	getVideoSegment,
	getIntroInit,
	getIntroManifest,
	getIntroVideo,
	parseManifest,
} from "./utils";

import BOLA from "./bola";
import { getPlaceholderBuffer } from "./bola";

const BANDWIDTH_ALPHA = 0.5; // Smoothing factor for bandwidth estimation
const REBUFFER_PENALTY = 5;
const MAX_BUFFER_CAPACITY_SECONDS = 20;
const FILL_THRESHOLD_SEGMENTS = 4;

function getCurrentBufferLevel(videoElement) {
	if (
		!videoElement ||
		!videoElement.buffered ||
		videoElement.buffered.length === 0
	) {
		return 0;
	}
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
	console.log("🎥 Initializing video stream for ID:", videoId);
	if (videoElement.src) {
		URL.revokeObjectURL(videoElement.src);
		videoElement.removeAttribute("src");
		videoElement.load();
	}

	const mediaSource = new MediaSource();
	videoElement.src = URL.createObjectURL(mediaSource);

	mediaSource.addEventListener("sourceopen", async () => {
		try {
			const sourceBuffer = mediaSource.addSourceBuffer(
				'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
			);

			// Wait until sourceBuffer is not updating before setting duration
			const setDurationWhenReady = () => {
				if (!sourceBuffer.updating) {
					mediaSource.duration = videoDuration;
				} else {
					sourceBuffer.addEventListener(
						"updateend",
						() => {
							mediaSource.duration = videoDuration;
						},
						{ once: true },
					);
				}
			};
			setDurationWhenReady();
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
	let isSeeking = false;

	const introManifestText = await getIntroManifest(startupRes);
	const introSegments = parseManifest(introManifestText);
	const introDuration = introSegments.reduce(
		(acc, seg) => acc + seg.duration,
		0,
	);
	sourceBuffer.timestampOffset = introDuration;

	const totalDuration = segmentList.reduce((acc, seg) => acc + seg.duration, 0);
	const typicalSegmentDuration = segmentList[0]?.duration || 5;

	const appendNextSegment = async () => {
		if (isSeeking || segmentIndex >= segmentList.length) {
			if (
				segmentIndex >= segmentList.length &&
				mediaSource.readyState === "open"
			) {
				console.log("✅ All segments appended.");
				mediaSource.endOfStream();
			}
			return;
		}

		const currentBufferLevelSeconds = getCurrentBufferLevel(videoElement);
		if (
			currentBufferLevelSeconds >=
			FILL_THRESHOLD_SEGMENTS * typicalSegmentDuration
		) {
			await new Promise((resolve) => {
				const checkBuffer = () => {
					if (
						getCurrentBufferLevel(videoElement) <
						FILL_THRESHOLD_SEGMENTS * typicalSegmentDuration
					) {
						resolve();
					} else {
						setTimeout(checkBuffer, 500);
					}
				};
				checkBuffer();
			});
		}

		try {
			const segment = segmentList[segmentIndex];

			const selectedResolution = await BOLA(
				videoId,
				videoElement,
				segment,
				resolutionList,
				totalDuration,
				lastSelectedResolution,
				lastBandwidth,
				null,
				typicalSegmentDuration,
			);

			console.log(
				`📽️ Segment ${segmentIndex} - Chosen resolution: ${selectedResolution}`,
			);

			// update resolution early
			const previousResolution = lastSelectedResolution;
			lastSelectedResolution = selectedResolution;

			const downloadStart = performance.now();
			const segmentData = await getVideoSegment(
				videoId,
				selectedResolution,
				segment.name,
			);
			const downloadEnd = performance.now();

			if (!segmentData) {
				console.warn("❌ Segment data is null, skipping...");
				segmentIndex++;
				appendNextSegment();
				return;
			}

			const sizeMB = segmentData.byteLength / (1024 * 1024);
			const downloadTime = Math.max((downloadEnd - downloadStart) / 1000, 0.05);
			const measuredBandwidth = sizeMB / downloadTime;
			lastBandwidth =
				lastBandwidth === null
					? measuredBandwidth
					: BANDWIDTH_ALPHA * measuredBandwidth +
					  (1 - BANDWIDTH_ALPHA) * lastBandwidth;

			console.log(`📡 Bandwidth: ${lastBandwidth.toFixed(2)} MBps`);

			if (selectedResolution !== previousResolution) {
				const newInit = await getInitFile(videoId, selectedResolution);
				await new Promise((resolve) => {
					sourceBuffer.addEventListener("updateend", resolve, { once: true });
					sourceBuffer.appendBuffer(newInit);
				});
			}

			await new Promise((resolve) => {
				sourceBuffer.addEventListener("updateend", resolve, { once: true });
				sourceBuffer.appendBuffer(segmentData);
			});

			segmentIndex++;
			appendNextSegment();
		} catch (err) {
			console.error("❌ Segment fetch error:", err);
			segmentIndex++;
			appendNextSegment();
		}
	};

	const handleSeek = async () => {
		if (isSeeking || sourceBuffer.updating) return;
		const seekTime = videoElement.currentTime;
		console.log(`⚡ Seek to ${seekTime.toFixed(2)}s`);

		if (seekTime < introDuration) {
			console.log("⏩ Seek within intro, ignoring.");
			return;
		}

		for (let i = 0; i < videoElement.buffered.length; i++) {
			if (
				seekTime >= videoElement.buffered.start(i) &&
				seekTime < videoElement.buffered.end(i)
			) {
				console.log("Seeked time already buffered.");
				return;
			}
		}

		isSeeking = true;
		const targetTime = seekTime - introDuration;
		const newSegmentIndex = findSegmentIndexForTime(targetTime, segmentList);
		segmentIndex = newSegmentIndex;

		let placeholderBuffer = await getPlaceholderBuffer(
			videoId,
			resolutionList,
			segmentList,
		);

		sourceBuffer.remove(introDuration, mediaSource.duration);
		await new Promise((resolve) =>
			sourceBuffer.addEventListener("updateend", resolve, { once: true }),
		);

		const initSeg = await getInitFile(
			videoId,
			placeholderBuffer.startupResolution,
		);
		await new Promise((resolve) => {
			sourceBuffer.addEventListener("updateend", resolve, { once: true });
			sourceBuffer.appendBuffer(initSeg);
		});

		isSeeking = false;
		appendNextSegment();
	};

	videoElement.addEventListener("seeking", handleSeek);

	// Start playback
	sourceBuffer.addEventListener("updateend", appendNextSegment, { once: true });
	sourceBuffer.appendBuffer(initSegment);
}

function findSegmentIndexForTime(targetTime, segments) {
	let accumulated = 0;
	for (let i = 0; i < segments.length; i++) {
		accumulated += segments[i].duration;
		if (targetTime < accumulated) return i;
	}
	return segments.length - 1;
}
