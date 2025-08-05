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
import axios from "@/lib/axios";

const BANDWIDTH_ALPHA = 0.2;
const FILL_THRESHOLD_SECONDS = 30;
const MIN_BUFFER_AHEAD = 5;
const WATCH_HISTORY_UPDATE_INTERVAL = 5000;

function getBufferAhead(videoElement) {
	const currentTime = videoElement.currentTime;
	const buffered = videoElement.buffered;
	if (buffered.length === 0) return 0;

	for (let i = 0; i < buffered.length; i++) {
		const start = buffered.start(i);
		const end = buffered.end(i);
		if (start <= currentTime && end > currentTime) {
			return end - currentTime;
		}
	}
	return 0;
}

function waitForUpdateEnd(sb) {
	return new Promise((resolve) =>
		sb.updating
			? sb.addEventListener("updateend", resolve, { once: true })
			: resolve(),
	);
}

export async function initializeVideoStream(
	videoElement,
	videoId,
	segmentList,
	resolutionList,
	videoDuration,
	ws,
	startTime = 0,
	selectedResolution = "Auto",
) {
	if (!videoElement || !videoId || segmentList.length === 0)
		return { destroy: () => {} };

	if (videoElement.src) {
		URL.revokeObjectURL(videoElement.src);
		videoElement.removeAttribute("src");
		videoElement.load();
	}

	const mediaSource = new MediaSource();
	videoElement.src = URL.createObjectURL(mediaSource);

	let destroyPlayback = () => {};

	const onSourceOpen = async () => {
		try {
			const sourceBuffer = mediaSource.addSourceBuffer(
				'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
			);
			mediaSource.duration = videoDuration;

			// Initial resolution and placeholder buffer info
			const initialPlaceholder = await getPlaceholderBuffer(
				videoId,
				resolutionList,
				segmentList,
			);
			const startupRes = initialPlaceholder.startupResolution;
			let lastBandwidth = initialPlaceholder.startupBandwidth || null;

			// Play intro only once globally for this playback
			await playIntro(sourceBuffer, startupRes);

			// Start main playback after intro
			destroyPlayback = await startMainPlayback(
				sourceBuffer,
				videoElement,
				videoId,
				segmentList,
				resolutionList,
				initialPlaceholder,
				startupRes,
				mediaSource,
				lastBandwidth,
				ws,
				startTime,
				selectedResolution,
			);
		} catch (err) {
			console.error("🔥 Error during stream initialization:", err);
		}
	};

	mediaSource.addEventListener("sourceopen", onSourceOpen, { once: true });

	return {
		destroy: () => {
			if (destroyPlayback) destroyPlayback();
			if (mediaSource.readyState === "open") {
				try {
					mediaSource.endOfStream();
				} catch (e) {
					console.warn("Could not end MediaSource stream:", e);
				}
			}
			if (videoElement?.src) URL.revokeObjectURL(videoElement.src);
		},
	};
}

let introAppended = false;

async function playIntro(sourceBuffer, resolution) {
	if (introAppended) return; // Play intro only once per player lifecycle

	const introInit = await getIntroInit(resolution);
	const introManifestText = await getIntroManifest(resolution);
	const introSegments = parseManifest(introManifestText);

	await waitForUpdateEnd(sourceBuffer);
	sourceBuffer.timestampOffset = 0;
	sourceBuffer.appendBuffer(introInit);
	await waitForUpdateEnd(sourceBuffer);

	for (const segment of introSegments) {
		const segmentData = await getIntroVideo(resolution, segment.name);
		if (segmentData) {
			await waitForUpdateEnd(sourceBuffer);
			sourceBuffer.appendBuffer(segmentData);
			await waitForUpdateEnd(sourceBuffer);
		}
	}

	introAppended = true;
}

async function startMainPlayback(
	sourceBuffer,
	videoElement,
	videoId,
	segmentList,
	resolutionList,
	initialPlaceholder,
	startupRes,
	mediaSource,
	lastBandwidth,
	ws,
	startTime = 0,
	manualResolution = "Auto",
) {
	let segmentIndex = 0;
	let lastSelectedResolution = startupRes;
	let isSeeking = false;
	let watchHistoryInterval = null;
	let currentPlaceholder = initialPlaceholder;
	let isDestroyed = false;
	let appendTimeout = null;
	let isWaiting = false;

	const introManifestText = await getIntroManifest(startupRes);
	const introSegments = parseManifest(introManifestText);
	const introDuration = introSegments.reduce(
		(acc, seg) => acc + seg.duration,
		0,
	);
	const totalDuration = segmentList.reduce((acc, seg) => acc + seg.duration, 0);
	const typicalSegmentDuration = segmentList[0]?.duration || 5;

	// Start watch history
	const startWatchHistory = () => {
		if (isDestroyed) return;
		clearInterval(watchHistoryInterval);
		watchHistoryInterval = setInterval(() => {
			if (!videoElement.paused && !isSeeking) {
				axios.post("/history/update", {
					videoId,
					currentTime: videoElement.currentTime,
				});
			}
		}, WATCH_HISTORY_UPDATE_INTERVAL);
	};
	const stopWatchHistory = () => clearInterval(watchHistoryInterval);

	const handleWaiting = () => {
		if (isDestroyed || isSeeking) return;
		console.log("📺 Video is waiting for data, triggering buffer fill");
		isWaiting = true;
		clearTimeout(appendTimeout);
		appendNextSegment();
	};
	const handlePlaying = () => {
		if (isWaiting) {
			console.log("▶️ Video resumed playing");
			isWaiting = false;
		}
	};

	async function appendNextSegment() {
		if (isDestroyed || isSeeking || segmentIndex >= segmentList.length) {
			if (
				!isDestroyed &&
				segmentIndex >= segmentList.length &&
				mediaSource.readyState === "open"
			) {
				try {
					mediaSource.endOfStream();
				} catch (e) {
					console.warn("Could not end MediaSource stream:", e);
				}
			}
			return;
		}

		const bufferAhead = getBufferAhead(videoElement);
		if (bufferAhead >= FILL_THRESHOLD_SECONDS && !isWaiting) {
			appendTimeout = setTimeout(appendNextSegment, 500);
			return;
		}

		try {
			const segment = segmentList[segmentIndex];
			let selectedResolution =
				manualResolution === "Auto"
					? await BOLA(
							videoId,
							videoElement,
							segment,
							resolutionList,
							totalDuration,
							lastSelectedResolution,
							lastBandwidth,
							currentPlaceholder,
							typicalSegmentDuration,
					  )
					: manualResolution;

			if (selectedResolution !== lastSelectedResolution) {
				// Append init segment on resolution change to avoid artifacts
				const newInit = await getInitFile(videoId, selectedResolution);
				await waitForUpdateEnd(sourceBuffer);
				sourceBuffer.appendBuffer(newInit);
				await waitForUpdateEnd(sourceBuffer);
				lastSelectedResolution = selectedResolution;
			}

			const downloadStart = performance.now();
			const segmentData = await getVideoSegment(
				videoId,
				lastSelectedResolution,
				segment.name,
			);
			const downloadEnd = performance.now();

			if (isDestroyed || !segmentData) {
				segmentIndex++;
				appendTimeout = setTimeout(appendNextSegment, 50);
				return;
			}

			const sizeMB = segmentData.byteLength / (1024 * 1024);
			const downloadTime = Math.max((downloadEnd - downloadStart) / 1000, 0.05);
			const measuredBandwidth = sizeMB / downloadTime;
			lastBandwidth =
				lastBandwidth == null
					? measuredBandwidth
					: BANDWIDTH_ALPHA * measuredBandwidth +
					  (1 - BANDWIDTH_ALPHA) * lastBandwidth;

			await waitForUpdateEnd(sourceBuffer);
			sourceBuffer.appendBuffer(segmentData);
			await waitForUpdateEnd(sourceBuffer);

			console.log(
				`✅ Appended segment ${segmentIndex}, res: ${lastSelectedResolution}, buffer: ${getBufferAhead(
					videoElement,
				)}s`,
			);

			segmentIndex++;
			appendTimeout = setTimeout(appendNextSegment, isWaiting ? 10 : 0);
		} catch (err) {
			if (isDestroyed) return;
			if (err.name === "QuotaExceededError") {
				console.warn("💣 Quota exceeded. Retrying in 2s");
				appendTimeout = setTimeout(appendNextSegment, 2000);
			} else {
				console.error("⚠️ Segment append error", err);
				segmentIndex++;
				appendTimeout = setTimeout(appendNextSegment, 50);
			}
		}
	}

	async function handleSeek() {
		if (isDestroyed || mediaSource.readyState !== "open" || isSeeking) return;

		const seekTime = videoElement.currentTime;
		const buffered = videoElement.buffered;

		// Check if seek position is already buffered (allow small margin)
		for (let i = 0; i < buffered.length; i++) {
			if (
				seekTime >= buffered.start(i) + 0.1 &&
				seekTime < buffered.end(i) - 0.1
			) {
				console.log(
					"⏩ Seeked to already buffered segment, no re-fetch needed.",
				);
				return; // Skip re-fetch, playback will continue
			}
		}

		isSeeking = true;
		isWaiting = false;
		stopWatchHistory();
		clearTimeout(appendTimeout);

		// Remove only future buffer after seekTime, keep past buffer intact
		const removeStart = seekTime;
		const removeEnd = mediaSource.duration;

		await waitForUpdateEnd(sourceBuffer);
		sourceBuffer.abort();
		await waitForUpdateEnd(sourceBuffer);
		sourceBuffer.remove(removeStart, removeEnd);
		await waitForUpdateEnd(sourceBuffer);

		// Reset timestamp offset for main video (no intro replay on seek)
		sourceBuffer.timestampOffset = introDuration;

		// Append init segment for new position
		const initSeg = await getInitFile(videoId, lastSelectedResolution);
		await waitForUpdateEnd(sourceBuffer);
		sourceBuffer.appendBuffer(initSeg);
		await waitForUpdateEnd(sourceBuffer);

		// Find segment index for new seek position (adjusted for intro offset)
		segmentIndex = findSegmentIndexForTime(
			seekTime - introDuration,
			segmentList,
		);

		appendNextSegment();

		isSeeking = false;
		startWatchHistory();
	}

	sourceBuffer.timestampOffset = introDuration;

	// Append initial init segment after intro
	const initSegment = await getInitFile(videoId, startupRes);
	await waitForUpdateEnd(sourceBuffer);
	sourceBuffer.appendBuffer(initSegment);
	await waitForUpdateEnd(sourceBuffer);

	// If startTime > 0, seek after intro duration
	if (startTime > 0) {
		videoElement.addEventListener("timeupdate", function jumpAfterIntro() {
			if (videoElement.currentTime >= introDuration - 0.1) {
				videoElement.currentTime = startTime + introDuration;
				videoElement.removeEventListener("timeupdate", jumpAfterIntro);
			}
		});
	}

	videoElement.addEventListener("play", startWatchHistory);
	videoElement.addEventListener("pause", stopWatchHistory);
	videoElement.addEventListener("ended", stopWatchHistory);
	videoElement.addEventListener("seeking", handleSeek);
	videoElement.addEventListener("waiting", handleWaiting);
	videoElement.addEventListener("playing", handlePlaying);

	appendNextSegment();

	return () => {
		isDestroyed = true;
		clearTimeout(appendTimeout);
		stopWatchHistory();
		videoElement.removeEventListener("play", startWatchHistory);
		videoElement.removeEventListener("pause", stopWatchHistory);
		videoElement.removeEventListener("ended", stopWatchHistory);
		videoElement.removeEventListener("seeking", handleSeek);
		videoElement.removeEventListener("waiting", handleWaiting);
		videoElement.removeEventListener("playing", handlePlaying);
	};
}

function findSegmentIndexForTime(targetTime, segments) {
	let accumulated = 0;
	for (let i = 0; i < segments.length; i++) {
		accumulated += segments[i].duration;
		if (targetTime < accumulated) return i;
	}
	return segments.length - 1;
}
