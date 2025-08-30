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
const WATCH_HISTORY_UPDATE_INTERVAL = 5000;
const BUFFER_GAP_TOLERANCE = 0.5;
const STALL_DETECTION_INTERVAL = 1000;

function getBufferAhead(video) {
	if (!video || !video.buffered || !video.buffered.length) return 0;
	const t = video.currentTime;
	for (let i = 0; i < video.buffered.length; i++) {
		if (video.buffered.start(i) <= t && video.buffered.end(i) >= t) {
			return video.buffered.end(i) - t;
		}
	}
	for (let i = 0; i < video.buffered.length; i++) {
		if (
			video.buffered.start(i) > t &&
			video.buffered.start(i) - t < BUFFER_GAP_TOLERANCE
		) {
			return video.buffered.end(i) - t;
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
	onResolutionChange,
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

			const initialPlaceholder = await getPlaceholderBuffer(
				videoId,
				resolutionList,
				segmentList,
			);
			const startupRes = initialPlaceholder.startupResolution;
			const initialBW = initialPlaceholder.startupBandwidth || null;
			onResolutionChange?.(startupRes);

			let prefetchInitPromise = getInitFile(videoId, startupRes);
			let prefetchFirstSegPromise = getVideoSegment(
				videoId,
				startupRes,
				segmentList[0].name,
			);

			const introInfo = await playIntro(sourceBuffer, startupRes);
			const introEnd =
				sourceBuffer.buffered.length > 0
					? sourceBuffer.buffered.end(0)
					: introInfo.duration;

			destroyPlayback = await startMainPlayback(
				sourceBuffer,
				videoElement,
				videoId,
				segmentList,
				resolutionList,
				initialPlaceholder,
				startupRes,
				mediaSource,
				initialBW,
				ws,
				startTime,
				selectedResolution,
				introEnd,
				prefetchInitPromise,
				prefetchFirstSegPromise,
				onResolutionChange,
			);
		} catch (err) {
			console.error("🔥 Error during stream initialization:", err);
		}
	};

	mediaSource.addEventListener("sourceopen", onSourceOpen, { once: true });

	return {
		destroy: () => {
			destroyPlayback?.();
			if (mediaSource.readyState === "open") {
				try {
					mediaSource.endOfStream();
				} catch {
					// Ignore errors on endOfStream
				}
			}
			if (videoElement?.src) URL.revokeObjectURL(videoElement.src);
		},
	};
}

async function playIntro(sourceBuffer, resolution) {
	const introInit = await getIntroInit(resolution);
	const introManifestText = await getIntroManifest(resolution);
	const introSegments = parseManifest(introManifestText);

	await waitForUpdateEnd(sourceBuffer);
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
	return {
		duration: introSegments.reduce((acc, seg) => acc + seg.duration, 0),
	};
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
	introDuration,
	prefetchInitPromise,
	prefetchSeg0Promise,
	onResolutionChange,
) {
	let segmentIndex = 0;
	let lastSelectedResolution = startupRes;
	let isSeeking = false;
	let watchHistoryInterval = null;
	let currentPlaceholder = initialPlaceholder;
	let isDestroyed = false;
	let appendTimeout = null;
	let stallCheckInterval = null;

	const totalDuration = segmentList.reduce((acc, seg) => acc + seg.duration, 0);
	const typicalSegmentDuration = segmentList[0]?.duration || 5;

	const startWatchHistory = () => {
		if (isDestroyed) return;
		clearInterval(watchHistoryInterval);
		watchHistoryInterval = setInterval(() => {
			if (
				!videoElement.paused &&
				!isSeeking &&
				videoElement.currentTime > introDuration
			) {
				axios
					.post("/history/update", {
						videoId,
						currentTime: videoElement.currentTime - introDuration,
					})
					.catch(() => {});
			}
		}, WATCH_HISTORY_UPDATE_INTERVAL);
	};

	const stopWatchHistory = () => clearInterval(watchHistoryInterval);
	const unmuteOnPlay = () => {
		if (videoElement.volume > 0) videoElement.muted = false;
	};

	const startStallDetector = () => {
		clearInterval(stallCheckInterval);
		stallCheckInterval = setInterval(() => {
			if (isDestroyed || videoElement.paused || isSeeking) return;
			const buffer = getBufferAhead(videoElement);
			if (buffer < 0.1 && videoElement.readyState < 3) {
				for (let i = 0; i < videoElement.buffered.length; i++) {
					if (
						videoElement.buffered.start(i) > videoElement.currentTime &&
						videoElement.buffered.start(i) - videoElement.currentTime < 1
					) {
						videoElement.currentTime = videoElement.buffered.start(i) + 0.1;
						videoElement.play().catch(() => {});
						return;
					}
				}
			}
		}, STALL_DETECTION_INTERVAL);
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
				} catch {
					// Ignore errors on endOfStream
				}
			}
			return;
		}

		const bufferAhead = getBufferAhead(videoElement);
		if (bufferAhead >= FILL_THRESHOLD_SECONDS) {
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
				onResolutionChange?.(selectedResolution);
				const currentSegmentTime = segmentList
					.slice(0, segmentIndex)
					.reduce((sum, seg) => sum + seg.duration, introDuration);
				if (sourceBuffer.buffered.length > 0) {
					const removeStart = currentSegmentTime + 0.1;
					if (
						sourceBuffer.buffered.end(sourceBuffer.buffered.length - 1) >
						removeStart
					) {
						sourceBuffer.remove(removeStart, mediaSource.duration);
						await waitForUpdateEnd(sourceBuffer);
					}
				}
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

			segmentIndex++;
			appendNextSegment();
		} catch (err) {
			if (isDestroyed) return;
			if (err.name === "QuotaExceededError") {
				appendTimeout = setTimeout(appendNextSegment, 2000);
			} else {
				segmentIndex++;
				appendTimeout = setTimeout(appendNextSegment, 50);
			}
		}
	}

	async function handleSeek() {
		if (isDestroyed || mediaSource.readyState !== "open" || isSeeking) return;
		const seekTime = videoElement.currentTime;
		const buffered = videoElement.buffered;
		for (let i = 0; i < buffered.length; i++) {
			if (
				seekTime >= buffered.start(i) + 0.1 &&
				seekTime < buffered.end(i) - 0.1
			)
				return;
		}

		isSeeking = true;
		stopWatchHistory();
		clearTimeout(appendTimeout);

		await waitForUpdateEnd(sourceBuffer);
		sourceBuffer.abort();
		await waitForUpdateEnd(sourceBuffer);
		sourceBuffer.remove(0, mediaSource.duration);
		await waitForUpdateEnd(sourceBuffer);

		sourceBuffer.timestampOffset = 0;
		await playIntro(sourceBuffer, lastSelectedResolution);
		const newIntroEnd =
			sourceBuffer.buffered.length > 0
				? sourceBuffer.buffered.end(0)
				: introDuration;
		sourceBuffer.timestampOffset = newIntroEnd;

		const targetTime = Math.max(0, seekTime - newIntroEnd);
		segmentIndex = findSegmentIndexForTime(targetTime, segmentList);

		if (manualResolution === "Auto") {
			const seekPlaceholder = await getPlaceholderBuffer(
				videoId,
				resolutionList,
				segmentList,
			);
			currentPlaceholder = seekPlaceholder;
			lastSelectedResolution = seekPlaceholder.startupResolution;
			onResolutionChange?.(lastSelectedResolution);
			if (seekPlaceholder.startupBandwidth > 0.1)
				lastBandwidth = seekPlaceholder.startupBandwidth;
		} else {
			lastSelectedResolution = manualResolution;
		}

		const initSeg = await getInitFile(videoId, lastSelectedResolution);
		sourceBuffer.appendBuffer(initSeg);
		await waitForUpdateEnd(sourceBuffer);

		isSeeking = false;
		startWatchHistory();
		appendNextSegment();
	}

	sourceBuffer.timestampOffset = introDuration;
	const initSegment = await prefetchInitPromise;
	sourceBuffer.appendBuffer(initSegment);
	await waitForUpdateEnd(sourceBuffer);

	if (startTime > 0) {
		const seekTo = introDuration + startTime;
		if (
			videoElement.seekable.length > 0 &&
			seekTo < videoElement.seekable.end(0)
		) {
			videoElement.currentTime = seekTo;
		}
		segmentIndex = findSegmentIndexForTime(startTime, segmentList);
	}

	if (segmentIndex === 0) {
		const firstSegData = await prefetchSeg0Promise;
		if (firstSegData) {
			await waitForUpdateEnd(sourceBuffer);
			sourceBuffer.appendBuffer(firstSegData);
			await waitForUpdateEnd(sourceBuffer);
			segmentIndex = 1;
		}
	}

	appendNextSegment();
	startStallDetector();

	videoElement.addEventListener("play", startWatchHistory);
	videoElement.addEventListener("pause", stopWatchHistory);
	videoElement.addEventListener("ended", stopWatchHistory);
	videoElement.addEventListener("seeking", handleSeek);
	videoElement.addEventListener("play", unmuteOnPlay, { once: true });

	return () => {
		isDestroyed = true;
		clearTimeout(appendTimeout);
		clearInterval(stallCheckInterval);
		stopWatchHistory();
		videoElement.removeEventListener("play", startWatchHistory);
		videoElement.removeEventListener("pause", stopWatchHistory);
		videoElement.removeEventListener("ended", stopWatchHistory);
		videoElement.removeEventListener("seeking", handleSeek);
		videoElement.removeEventListener("play", unmuteOnPlay);
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
