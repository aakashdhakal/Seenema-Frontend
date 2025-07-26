import {
	getInitFile,
	getVideoSegment,
	getIntroInit,
	getIntroManifest,
	getIntroVideo,
	parseManifest,
} from "./utils";
import BOLA, { getPlaceholderBuffer } from "./bola";
import axios from "@/lib/axios";

const BANDWIDTH_ALPHA = 0.5;
const FILL_THRESHOLD_SECONDS = 40;
const WATCH_HISTORY_UPDATE_INTERVAL = 5000;

// --- ENHANCED UTILITY FUNCTIONS ---
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

// FIXED: More robust waitForUpdateEnd with timeout
function waitForUpdateEnd(sb, timeoutMs = 10000) {
	return new Promise((resolve, reject) => {
		if (!sb.updating) {
			resolve();
			return;
		}

		let timeoutId;
		const onUpdateEnd = () => {
			clearTimeout(timeoutId);
			sb.removeEventListener("updateend", onUpdateEnd);
			sb.removeEventListener("error", onError);
			resolve();
		};
		const onError = (ev) => {
			clearTimeout(timeoutId);
			sb.removeEventListener("updateend", onUpdateEnd);
			sb.removeEventListener("error", onError);
			reject(new Error(`SourceBuffer error: ${ev.type}`));
		};

		sb.addEventListener("updateend", onUpdateEnd);
		sb.addEventListener("error", onError);

		// Add timeout to prevent hanging
		timeoutId = setTimeout(() => {
			sb.removeEventListener("updateend", onUpdateEnd);
			sb.removeEventListener("error", onError);
			reject(new Error("SourceBuffer operation timeout"));
		}, timeoutMs);
	});
}

function findSegmentIndexForTime(targetTime, segments) {
	let accumulated = 0;
	for (let i = 0; i < segments.length; i++) {
		accumulated += segments[i].duration;
		if (targetTime < accumulated) return i;
	}
	return segments.length - 1;
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
	try {
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
	} catch (error) {
		console.error("Error playing intro:", error);
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
	let isAppending = false; // NEW: Track append state
	let watchHistoryInterval = null;
	let currentPlaceholder = initialPlaceholder;
	let isDestroyed = false;
	let appendTimeout = null;
	let seekTimeout = null; // NEW: Debounce seeks

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
		if (
			isDestroyed ||
			isSeeking ||
			isAppending ||
			sourceBuffer.updating ||
			segmentIndex >= segmentList.length
		) {
			return;
		}

		if (getBufferAhead(videoElement) >= FILL_THRESHOLD_SECONDS) {
			appendTimeout = setTimeout(appendNextSegment, 500);
			return;
		}

		isAppending = true; // Set append lock

		try {
			const segment = segmentList[segmentIndex];
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

			if (isDestroyed || !segmentData) return;

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
		} catch (err) {
			if (isDestroyed) return;
			if (err.name === "QuotaExceededError") {
				console.warn("💣 Quota exceeded. Clearing old buffer and retrying.");
				try {
					const clearTime = Math.max(0, videoElement.currentTime - 30);
					await waitForUpdateEnd(sourceBuffer);
					sourceBuffer.remove(0, clearTime);
					await waitForUpdateEnd(sourceBuffer);
				} catch (removeErr) {
					console.error("Error clearing buffer:", removeErr);
				}
				appendTimeout = setTimeout(appendNextSegment, 1000);
			} else {
				console.error("⚠️ Segment append error", err);
				segmentIndex++; // Skip faulty segment
				appendTimeout = setTimeout(appendNextSegment, 50);
			}
		} finally {
			isAppending = false; // Release append lock
			if (!isDestroyed && !isSeeking) {
				appendTimeout = setTimeout(appendNextSegment, 10);
			}
		}
	}

	// COMPLETELY REWRITTEN: Robust seek handler with proper debouncing
	async function handleSeek() {
		// Debounce seeks - only process if no recent seek
		clearTimeout(seekTimeout);
		seekTimeout = setTimeout(async () => {
			await performSeek();
		}, 100); // 100ms debounce
	}

	async function performSeek() {
		if (isDestroyed || mediaSource.readyState !== "open" || isSeeking) return;

		console.log("🎯 Starting seek operation");
		isSeeking = true;
		stopWatchHistory();
		clearTimeout(appendTimeout);

		try {
			// 1. Wait for any current operations to complete
			await waitForUpdateEnd(sourceBuffer, 5000);

			// 2. Abort current operations safely
			if (sourceBuffer.updating) {
				sourceBuffer.abort();
				await waitForUpdateEnd(sourceBuffer, 3000);
			}

			// 3. Clear the entire buffer - safest approach
			if (sourceBuffer.buffered.length > 0) {
				const bufferedEnd = sourceBuffer.buffered.end(
					sourceBuffer.buffered.length - 1,
				);
				sourceBuffer.remove(0, bufferedEnd);
				await waitForUpdateEnd(sourceBuffer, 5000);
			}

			// 4. Reset timestamp and replay intro
			sourceBuffer.timestampOffset = 0;
			await playIntro(sourceBuffer, lastSelectedResolution);
			sourceBuffer.timestampOffset = introDuration;

			// 5. Calculate new segment index
			const seekTime = videoElement.currentTime;
			const targetTime = Math.max(0, seekTime - introDuration);
			segmentIndex = findSegmentIndexForTime(targetTime, segmentList);

			// 6. Append init segment for continuity
			const initSeg = await getInitFile(videoId, lastSelectedResolution);
			await waitForUpdateEnd(sourceBuffer);
			sourceBuffer.appendBuffer(initSeg);
			await waitForUpdateEnd(sourceBuffer);

			console.log(`✅ Seek completed - jumped to segment ${segmentIndex}`);
		} catch (error) {
			console.error("❌ Critical seek error:", error);
			// Last resort: reload the entire player
			try {
				if (videoElement && !isDestroyed) {
					videoElement.load();
				}
			} catch (reloadError) {
				console.error("Failed to reload video element:", reloadError);
			}
		} finally {
			// Always release the seek lock and restart
			isSeeking = false;
			startWatchHistory();
			// Give a small delay before starting append loop
			setTimeout(() => {
				if (!isDestroyed) {
					appendNextSegment();
				}
			}, 200);
		}
	}

	// --- EVENT LISTENERS ---
	videoElement.addEventListener("play", startWatchHistory);
	videoElement.addEventListener("pause", stopWatchHistory);
	videoElement.addEventListener("ended", stopWatchHistory);
	videoElement.addEventListener("seeking", handleSeek);
	videoElement.addEventListener("play", unmuteOnPlay, { once: true });

	// --- INITIAL START ---
	sourceBuffer.timestampOffset = introDuration;
	const initSegment = await getInitFile(videoId, startupRes);
	await waitForUpdateEnd(sourceBuffer);
	sourceBuffer.appendBuffer(initSegment);
	await waitForUpdateEnd(sourceBuffer);

	if (startTime > 0 && videoElement) {
		videoElement.currentTime = startTime + introDuration;
	}

	appendNextSegment();

	// --- CLEANUP ---
	return () => {
		isDestroyed = true;
		clearTimeout(appendTimeout);
		clearTimeout(seekTimeout);
		stopWatchHistory();
		videoElement.removeEventListener("play", startWatchHistory);
		videoElement.removeEventListener("pause", stopWatchHistory);
		videoElement.removeEventListener("ended", stopWatchHistory);
		videoElement.removeEventListener("seeking", handleSeek);
		videoElement.removeEventListener("play", unmuteOnPlay);
	};
}
