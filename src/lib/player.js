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

const BANDWIDTH_ALPHA = 0.3;
const FILL_THRESHOLD_SECONDS = 30;
const WATCH_HISTORY_UPDATE_INTERVAL = 3000;
const BUFFER_GAP_TOLERANCE = 0.3;
const STALL_DETECTION_INTERVAL = 500;
const MAX_BUFFER_SIZE = 60;
const MIN_BUFFER_FOR_SWITCH = 5;

function getBufferInfo(video) {
	if (!video?.buffered?.length) return { ahead: 0, total: 0, ranges: [] };

	const currentTime = video.currentTime;
	const ranges = [];
	let totalBuffered = 0;
	let bufferAhead = 0;

	for (let i = 0; i < video.buffered.length; i++) {
		const start = video.buffered.start(i);
		const end = video.buffered.end(i);
		ranges.push({ start, end });
		totalBuffered += end - start;

		if (start <= currentTime && end > currentTime) {
			bufferAhead = end - currentTime;
		} else if (
			start > currentTime &&
			start - currentTime < BUFFER_GAP_TOLERANCE
		) {
			bufferAhead = Math.max(bufferAhead, end - currentTime);
		}
	}

	return { ahead: bufferAhead, total: totalBuffered, ranges };
}

function waitForUpdateEnd(sb, timeout = 5000) {
	return new Promise((resolve, reject) => {
		if (!sb.updating) return resolve();

		const timer = setTimeout(() => {
			sb.removeEventListener("updateend", onUpdate);
			reject(new Error("SourceBuffer update timeout"));
		}, timeout);

		const onUpdate = () => {
			clearTimeout(timer);
			resolve();
		};

		sb.addEventListener("updateend", onUpdate, { once: true });
	});
}

class BandwidthEstimator {
	constructor() {
		this.samples = [];
		this.maxSamples = 10;
		this.fastAlpha = 0.5;
		this.slowAlpha = 0.1;
	}

	addSample(bytes, durationMs) {
		const bandwidth = (bytes * 8) / (durationMs / 1000) / 1024 / 1024;
		this.samples.push({ bandwidth, timestamp: Date.now() });

		if (this.samples.length > this.maxSamples) {
			this.samples.shift();
		}
	}

	getEstimate() {
		if (!this.samples.length) return null;

		let weightedSum = 0;
		let totalWeight = 0;
		const now = Date.now();

		this.samples.forEach((sample) => {
			const age = (now - sample.timestamp) / 1000;
			const weight = Math.exp(-age / 10);
			weightedSum += sample.bandwidth * weight;
			totalWeight += weight;
		});

		return totalWeight > 0
			? weightedSum / totalWeight
			: this.samples[this.samples.length - 1].bandwidth;
	}

	getFastEstimate() {
		if (this.samples.length < 3) return this.getEstimate();

		const recent = this.samples.slice(-3);
		return recent.reduce((sum, s) => sum + s.bandwidth, 0) / recent.length;
	}
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

	let destroyPlayback = () => {};

	const mediaSource = new MediaSource();
	videoElement.src = URL.createObjectURL(mediaSource);
	const onSourceOpen = async () => {
		try {
			const sourceBuffer = mediaSource.addSourceBuffer(
				'video/mp4; codecs="avc1.42E01E, mp4a.40.2"',
			);
			// DO NOT set mediaSource.duration yet; we add intro first and then total.

			const initialPlaceholder = await getPlaceholderBuffer(
				videoId,
				resolutionList,
				segmentList,
			);
			const startupRes = initialPlaceholder.startupResolution;
			onResolutionChange?.(startupRes);

			const initPromise = getInitFile(videoId, startupRes);
			const firstSegPromise = getVideoSegment(
				videoId,
				startupRes,
				segmentList[0].name,
			);

			const introInfo = await playIntro(sourceBuffer, startupRes);
			const introEnd =
				sourceBuffer.buffered.length > 0
					? sourceBuffer.buffered.end(0)
					: introInfo.duration;

			// Set combined duration (intro + main) with a tiny epsilon to avoid rounding issues.
			try {
				mediaSource.duration = introEnd + videoDuration + 0.01;
			} catch (e) {
				console.warn("Unable to set combined mediaSource.duration", e);
			}

			destroyPlayback = await startMainPlayback(
				sourceBuffer,
				videoElement,
				videoId,
				segmentList,
				resolutionList,
				initialPlaceholder,
				startupRes,
				mediaSource,
				ws,
				startTime,
				selectedResolution,
				introEnd,
				initPromise,
				firstSegPromise,
				onResolutionChange,
				videoDuration,
			);
		} catch (err) {
			console.error("🔥 Stream initialization error:", err);
		}
	};

	mediaSource.addEventListener("sourceopen", onSourceOpen, { once: true });

	return {
		destroy: () => {
			destroyPlayback?.();
			if (mediaSource.readyState === "open") {
				try {
					mediaSource.endOfStream();
				} catch (e) {
					console.warn("EndOfStream error:", e);
				}
			}
			if (videoElement?.src) {
				URL.revokeObjectURL(videoElement.src);
				videoElement.removeAttribute("src");
			}
		},
	};
}

async function playIntro(sourceBuffer, resolution) {
	const [introInit, introManifestText] = await Promise.all([
		getIntroInit(resolution),
		getIntroManifest(resolution),
	]);

	const introSegments = parseManifest(introManifestText);

	await waitForUpdateEnd(sourceBuffer);
	sourceBuffer.appendBuffer(introInit);
	await waitForUpdateEnd(sourceBuffer);

	const segmentPromises = introSegments.map((segment) =>
		getIntroVideo(resolution, segment.name),
	);

	const segmentDataArray = await Promise.all(segmentPromises);

	for (let i = 0; i < segmentDataArray.length; i++) {
		const segmentData = segmentDataArray[i];
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
	ws,
	startTime = 0,
	manualResolution = "Auto",
	introDuration,
	prefetchInitPromise,
	prefetchSeg0Promise,
	onResolutionChange,
	mainVideoDuration,
) {
	let segmentIndex = 0;
	let lastSelectedResolution = startupRes;
	let isSeeking = false;
	let watchHistoryUpdateTimeout = null;
	let currentPlaceholder = initialPlaceholder;
	let isDestroyed = false;
	let appendTimeout = null;
	let stallCheckInterval = null;
	let nextSegmentPromise = null;
	let endedStream = false;

	const bandwidthEstimator = new BandwidthEstimator();
	const totalDuration = segmentList.reduce((acc, seg) => acc + seg.duration, 0);
	const typicalSegmentDuration = segmentList[0]?.duration || 5;

	const initFileCache = new Map();

	function finalizePlayback() {
		if (endedStream || isDestroyed) return;
		endedStream = true;

		try {
			if (mediaSource.readyState === "open") {
				mediaSource.endOfStream();
			}
		} catch (e) {
			console.warn("endOfStream error:", e);
		}

		// Robust fallback to ensure the video ends
		setTimeout(() => {
			if (videoElement && !videoElement.ended) {
				const duration = videoElement.duration || 0;
				const currentTime = videoElement.currentTime;
				const diff = duration - currentTime;

				// If we are within 1.5 seconds of the end, force it
				if (diff < 1.5) {
					// 1. Force time to end
					videoElement.currentTime = duration;

					// 2. Dispatch synthetic ended event immediately
					videoElement.dispatchEvent(new Event("ended"));
				}
			}
		}, 250);
	}

	async function selectOptimalResolution(segment, isUrgent = false) {
		if (manualResolution !== "Auto") return manualResolution;

		const bandwidth = isUrgent
			? bandwidthEstimator.getFastEstimate()
			: bandwidthEstimator.getEstimate();

		if (!bandwidth) return lastSelectedResolution;

		const selectedRes = await BOLA(
			videoId,
			videoElement,
			segment,
			resolutionList,
			totalDuration,
			lastSelectedResolution,
			bandwidth,
			currentPlaceholder,
			typicalSegmentDuration,
		);

		return typeof selectedRes === "string"
			? selectedRes
			: lastSelectedResolution;
	}

	async function preloadNextSegments() {
		if (segmentIndex + 1 < segmentList.length && !nextSegmentPromise) {
			const nextSegment = segmentList[segmentIndex + 1];
			const predictedResolution = await selectOptimalResolution(nextSegment);

			if (predictedResolution && typeof predictedResolution === "string") {
				nextSegmentPromise = getVideoSegment(
					videoId,
					predictedResolution,
					nextSegment.name,
				)
					.then((data) => ({
						data,
						resolution: predictedResolution,
						segment: nextSegment,
					}))
					.catch((err) => {
						console.warn("Preload failed:", err);
						return null;
					});
			}
		}
	}

	function manageBuffer() {
		const bufferInfo = getBufferInfo(videoElement);

		if (bufferInfo.total > MAX_BUFFER_SIZE) {
			const currentTime = videoElement.currentTime;
			const removeEnd = Math.max(0, currentTime - 30);

			if (removeEnd > 0) {
				try {
					sourceBuffer.remove(0, removeEnd);
				} catch (e) {
					console.warn("Buffer removal failed:", e);
				}
			}
		}
	}

	const startStallDetector = () => {
		clearInterval(stallCheckInterval);
		stallCheckInterval = setInterval(() => {
			if (isDestroyed || videoElement.paused || isSeeking) return;

			const bufferInfo = getBufferInfo(videoElement);

			if (bufferInfo.ahead < 0.1 && videoElement.readyState < 3) {
				const nextRange = bufferInfo.ranges.find(
					(range) =>
						range.start > videoElement.currentTime &&
						range.start - videoElement.currentTime < 2,
				);

				if (nextRange) {
					videoElement.currentTime = nextRange.start + 0.1;
					videoElement.play().catch(() => {});
				}
			}

			manageBuffer();
		}, STALL_DETECTION_INTERVAL);
	};

	async function appendNextSegment() {
		if (isDestroyed || isSeeking || segmentIndex >= segmentList.length) {
			if (
				!isDestroyed &&
				segmentIndex >= segmentList.length &&
				mediaSource.readyState === "open"
			) {
				finalizePlayback();
			}
			return;
		}

		const bufferInfo = getBufferInfo(videoElement);

		const bandwidth = bandwidthEstimator.getEstimate();
		const adaptiveThreshold =
			bandwidth > 5 ? FILL_THRESHOLD_SECONDS : FILL_THRESHOLD_SECONDS / 2;

		if (bufferInfo.ahead >= adaptiveThreshold) {
			appendTimeout = setTimeout(appendNextSegment, 300);
			return;
		}

		try {
			const segment = segmentList[segmentIndex];
			let selectedResolution = await selectOptimalResolution(segment);
			let segmentData;

			if (!selectedResolution || typeof selectedResolution !== "string") {
				selectedResolution = lastSelectedResolution || resolutionList[0];
			}

			if (nextSegmentPromise && segmentIndex > 0) {
				const preloaded = await nextSegmentPromise;
				nextSegmentPromise = null;

				if (
					preloaded?.resolution === selectedResolution &&
					preloaded.segment.name === segment.name
				) {
					segmentData = preloaded.data;
				}
			}

			if (selectedResolution !== lastSelectedResolution) {
				const switchAllowed =
					bufferInfo.ahead > MIN_BUFFER_FOR_SWITCH || segmentIndex === 0;

				if (switchAllowed) {
					await performResolutionSwitch(
						selectedResolution,
						sourceBuffer,
						segmentIndex,
					);
					lastSelectedResolution = selectedResolution;
					onResolutionChange?.(selectedResolution);
				} else {
					selectedResolution = lastSelectedResolution;
				}
			}

			if (!segmentData) {
				const downloadStart = performance.now();

				if (!selectedResolution || typeof selectedResolution !== "string") {
					selectedResolution = lastSelectedResolution || resolutionList[0];
				}

				segmentData = await getVideoSegment(
					videoId,
					selectedResolution,
					segment.name,
				);
				const downloadTime = performance.now() - downloadStart;

				if (segmentData) {
					bandwidthEstimator.addSample(segmentData.byteLength, downloadTime);
				}
			}

			if (isDestroyed || !segmentData) {
				segmentIndex++;
				if (segmentIndex >= segmentList.length) {
					finalizePlayback();
					return;
				}
				appendTimeout = setTimeout(appendNextSegment, 100);
				return;
			}

			await waitForUpdateEnd(sourceBuffer);
			sourceBuffer.appendBuffer(segmentData);
			await waitForUpdateEnd(sourceBuffer);

			if (videoElement.currentTime > introDuration) {
				clearTimeout(watchHistoryUpdateTimeout);
				watchHistoryUpdateTimeout = setTimeout(() => {
					axios
						.post("/history/update", {
							videoId,
							currentTime: videoElement.currentTime - introDuration,
						})
						.catch(() => {});
				}, 1000);
			}

			segmentIndex++;

			if (segmentIndex >= segmentList.length) {
				finalizePlayback();
				return;
			}

			preloadNextSegments();
			appendNextSegment();
		} catch (err) {
			if (isDestroyed) return;

			console.warn("Segment append error:", err);

			if (err.name === "QuotaExceededError") {
				manageBuffer();
				appendTimeout = setTimeout(appendNextSegment, 1000);
			} else {
				segmentIndex++;
				if (segmentIndex >= segmentList.length) {
					finalizePlayback();
					return;
				}
				appendTimeout = setTimeout(appendNextSegment, 100);
			}
		}
	}

	async function performResolutionSwitch(
		newResolution,
		sourceBuffer,
		fromSegmentIndex,
	) {
		try {
			let initData = initFileCache.get(newResolution);
			if (!initData) {
				initData = await getInitFile(videoId, newResolution);
				initFileCache.set(newResolution, initData);
			}

			const segmentStartTime = segmentList
				.slice(0, fromSegmentIndex)
				.reduce((sum, seg) => sum + seg.duration, introDuration);

			if (sourceBuffer.buffered.length > 0) {
				const lastBufferEnd = sourceBuffer.buffered.end(
					sourceBuffer.buffered.length - 1,
				);
				if (lastBufferEnd > segmentStartTime + 0.5) {
					sourceBuffer.remove(segmentStartTime + 0.1, mediaSource.duration);
					await waitForUpdateEnd(sourceBuffer);
				}
			}

			await waitForUpdateEnd(sourceBuffer);
			sourceBuffer.appendBuffer(initData);
			await waitForUpdateEnd(sourceBuffer);
		} catch (err) {
			console.error("Resolution switch failed:", err);
			throw err;
		}
	}

	async function handleSeek() {
		if (isDestroyed || mediaSource.readyState !== "open" || isSeeking) return;

		const seekTime = videoElement.currentTime;
		const bufferInfo = getBufferInfo(videoElement);

		const isBuffered = bufferInfo.ranges.some(
			(range) => seekTime >= range.start + 0.1 && seekTime < range.end - 0.1,
		);

		if (isBuffered) return;

		isSeeking = true;
		clearTimeout(watchHistoryUpdateTimeout);
		clearTimeout(appendTimeout);
		nextSegmentPromise = null;

		try {
			await waitForUpdateEnd(sourceBuffer);
			sourceBuffer.abort();
			await waitForUpdateEnd(sourceBuffer);

			if (sourceBuffer.buffered.length > 0) {
				sourceBuffer.remove(0, mediaSource.duration);
				await waitForUpdateEnd(sourceBuffer);
			}

			sourceBuffer.timestampOffset = 0;
			await playIntro(sourceBuffer, lastSelectedResolution);

			const newIntroEnd =
				sourceBuffer.buffered.length > 0
					? sourceBuffer.buffered.end(0)
					: introDuration;
			sourceBuffer.timestampOffset = newIntroEnd;

			const targetTime = Math.max(0, seekTime - newIntroEnd);
			segmentIndex = findSegmentIndexForTime(targetTime, segmentList);

			const urgentResolution = await selectOptimalResolution(
				segmentList[segmentIndex],
				true,
			);
			if (
				urgentResolution !== lastSelectedResolution &&
				typeof urgentResolution === "string"
			) {
				lastSelectedResolution = urgentResolution;
				onResolutionChange?.(lastSelectedResolution);
			}

			let initData = initFileCache.get(lastSelectedResolution);
			if (!initData) {
				initData = await getInitFile(videoId, lastSelectedResolution);
				initFileCache.set(lastSelectedResolution, initData);
			}

			sourceBuffer.appendBuffer(initData);
			await waitForUpdateEnd(sourceBuffer);
		} catch (err) {
			console.error("Seek handling error:", err);
		} finally {
			isSeeking = false;
			appendNextSegment();
		}
	}

	sourceBuffer.timestampOffset = introDuration;

	try {
		const initSegment = await prefetchInitPromise;
		initFileCache.set(startupRes, initSegment);
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
			if (firstSegData && !isDestroyed) {
				await waitForUpdateEnd(sourceBuffer);
				sourceBuffer.appendBuffer(firstSegData);
				await waitForUpdateEnd(sourceBuffer);
				segmentIndex = 1;
			}
		}
	} catch (err) {
		console.error("Playback initialization error:", err);
	}

	appendNextSegment();
	startStallDetector();
	preloadNextSegments();

	videoElement.addEventListener("seeking", handleSeek);

	return () => {
		isDestroyed = true;
		clearTimeout(appendTimeout);
		clearTimeout(watchHistoryUpdateTimeout);
		clearInterval(stallCheckInterval);
		videoElement.removeEventListener("seeking", handleSeek);
		initFileCache.clear();
		nextSegmentPromise = null;
	};
}

function findSegmentIndexForTime(targetTime, segments) {
	let accumulated = 0;
	for (let i = 0; i < segments.length; i++) {
		if (targetTime < accumulated + segments[i].duration) return i;
		accumulated += segments[i].duration;
	}
	return Math.max(0, segments.length - 1);
}
