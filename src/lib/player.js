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

const BANDWIDTH_ALPHA = 0.5;
const FILL_THRESHOLD_SECONDS = 40;
const WATCH_HISTORY_UPDATE_INTERVAL = 5000;

function getBufferAhead(videoElement) {
	const currentTime = videoElement.currentTime;
	const buffered = videoElement.buffered;
	if (buffered.length === 0) return 0;
	for (let i = 0; i < buffered.length; i++) {
		if (buffered.start(i) <= currentTime && buffered.end(i) >= currentTime) {
			return buffered.end(i) - currentTime;
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

			const initialPlaceholder = await getPlaceholderBuffer(
				videoId,
				resolutionList,
				segmentList,
			);
			const startupRes = initialPlaceholder.startupResolution;
			const lastBandwidth = initialPlaceholder.startupBandwidth || null;

			await playIntro(sourceBuffer, startupRes);

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

	const introManifestText = await getIntroManifest(startupRes);
	const introSegments = parseManifest(introManifestText);
	const introDuration = introSegments.reduce(
		(acc, seg) => acc + seg.duration,
		0,
	);
	const totalDuration = segmentList.reduce((acc, seg) => acc + seg.duration, 0);
	const typicalSegmentDuration = segmentList[0]?.duration || 5;

	const startWatchHistory = () => {
		if (isDestroyed) return;
		clearInterval(watchHistoryInterval);
		watchHistoryInterval = setInterval(() => {
			if (!videoElement.paused && !isSeeking) {
				axios.post("/updateWatchHistory", {
					videoId,
					currentTime: videoElement.currentTime,
				});
			}
		}, WATCH_HISTORY_UPDATE_INTERVAL);
	};

	const stopWatchHistory = () => clearInterval(watchHistoryInterval);

	const unmuteOnPlay = () => {
		if (videoElement.volume > 0) videoElement.muted = false;
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
		if (bufferAhead >= FILL_THRESHOLD_SECONDS) {
			appendTimeout = setTimeout(appendNextSegment, 500);
			return;
		}

		try {
			const segment = segmentList[segmentIndex];
			const previousResolution = lastSelectedResolution;
			let selectedResolution;

			if (manualResolution === "Auto") {
				selectedResolution = await BOLA(
					videoId,
					videoElement,
					segment,
					resolutionList,
					totalDuration,
					lastSelectedResolution,
					lastBandwidth,
					currentPlaceholder,
					typicalSegmentDuration,
				);
			} else {
				selectedResolution = manualResolution;
			}

			if (selectedResolution !== lastSelectedResolution) {
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
		for (let i = 0; i < buffered.length; i++) {
			if (
				seekTime >= buffered.start(i) + 0.1 &&
				seekTime < buffered.end(i) - 0.1
			) {
				return; // Already buffered, no need to seek
			}
		}

		isSeeking = true;
		stopWatchHistory();
		clearTimeout(appendTimeout); // Stop any pending appends

		await waitForUpdateEnd(sourceBuffer);
		sourceBuffer.abort();
		await waitForUpdateEnd(sourceBuffer);
		sourceBuffer.remove(0, mediaSource.duration);
		await waitForUpdateEnd(sourceBuffer);

		// Re-append intro and set timestamp offset
		sourceBuffer.timestampOffset = 0;
		await playIntro(sourceBuffer, lastSelectedResolution);
		sourceBuffer.timestampOffset = introDuration;

		const targetTime = Math.max(0, seekTime - introDuration);
		segmentIndex = findSegmentIndexForTime(targetTime, segmentList);

		if (manualResolution === "Auto") {
			const seekPlaceholder = await getPlaceholderBuffer(
				videoId,
				resolutionList,
				segmentList,
			);
			currentPlaceholder = seekPlaceholder;
			lastSelectedResolution = seekPlaceholder.startupResolution;
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

	videoElement.addEventListener("play", startWatchHistory);
	videoElement.addEventListener("pause", stopWatchHistory);
	videoElement.addEventListener("ended", stopWatchHistory);
	videoElement.addEventListener("seeking", handleSeek);
	videoElement.addEventListener("play", unmuteOnPlay, { once: true });

	sourceBuffer.timestampOffset = introDuration;
	const initSegment = await getInitFile(videoId, startupRes);
	sourceBuffer.appendBuffer(initSegment);
	await waitForUpdateEnd(sourceBuffer);

	if (startTime > 0 && videoElement) {
		videoElement.currentTime = startTime + introDuration;
	}

	appendNextSegment();

	return () => {
		isDestroyed = true;
		clearTimeout(appendTimeout);
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
