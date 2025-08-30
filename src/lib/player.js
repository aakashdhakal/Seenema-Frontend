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

// Optimized constants
const BANDWIDTH_ALPHA = 0.3; // Faster adaptation
const FILL_THRESHOLD_SECONDS = 20; // Reduced for faster response
const WATCH_HISTORY_UPDATE_INTERVAL = 3000; // More frequent updates
const BUFFER_GAP_TOLERANCE = 0.3; // Tighter tolerance
const STALL_DETECTION_INTERVAL = 500; // More frequent checks
const MAX_BUFFER_SIZE = 60; // Prevent excessive buffering
const MIN_BUFFER_FOR_SWITCH = 5; // Minimum buffer before switching

// Enhanced buffer analysis
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

		// Find buffer ahead of current time
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

// Optimized wait function with timeout
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

// Enhanced bandwidth estimator
class BandwidthEstimator {
	constructor() {
		this.samples = [];
		this.maxSamples = 10;
		this.fastAlpha = 0.5; // For recent samples
		this.slowAlpha = 0.1; // For stable estimation
	}

	addSample(bytes, durationMs) {
		const bandwidth = (bytes * 8) / (durationMs / 1000) / 1024 / 1024; // Mbps
		this.samples.push({ bandwidth, timestamp: Date.now() });

		if (this.samples.length > this.maxSamples) {
			this.samples.shift();
		}
	}

	getEstimate() {
		if (!this.samples.length) return null;

		// Weight recent samples more heavily
		let weightedSum = 0;
		let totalWeight = 0;
		const now = Date.now();

		this.samples.forEach((sample) => {
			const age = (now - sample.timestamp) / 1000; // seconds
			const weight = Math.exp(-age / 10); // Exponential decay
			weightedSum += sample.bandwidth * weight;
			totalWeight += weight;
		});

		return totalWeight > 0
			? weightedSum / totalWeight
			: this.samples[this.samples.length - 1].bandwidth;
	}

	getFastEstimate() {
		if (this.samples.length < 3) return this.getEstimate();
		// Use only last 3 samples for quick adaptation
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

	// Clean up existing stream
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
			onResolutionChange?.(startupRes);

			// Prefetch critical segments
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

	// Parallel intro segment loading
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
) {
	let segmentIndex = 0;
	let lastSelectedResolution = startupRes;
	let isSeeking = false;
	let watchHistoryInterval = null;
	let currentPlaceholder = initialPlaceholder;
	let isDestroyed = false;
	let appendTimeout = null;
	let stallCheckInterval = null;
	let pendingResolutionSwitch = null;
	let nextSegmentPromise = null;

	const bandwidthEstimator = new BandwidthEstimator();
	const totalDuration = segmentList.reduce((acc, seg) => acc + seg.duration, 0);
	const typicalSegmentDuration = segmentList[0]?.duration || 5;

	// Cache for init files to avoid re-downloading
	const initFileCache = new Map();

	// Optimized resolution selection - ensure it returns string, not Promise
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

		// Ensure we return a valid string resolution
		return typeof selectedRes === "string"
			? selectedRes
			: lastSelectedResolution;
	}

	// Preload next segments for smoother playback
	async function preloadNextSegments() {
		if (segmentIndex + 1 < segmentList.length && !nextSegmentPromise) {
			const nextSegment = segmentList[segmentIndex + 1];
			const predictedResolution = await selectOptimalResolution(nextSegment);

			// Ensure resolution is valid before making request
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

	// Enhanced buffer management
	function manageBuffer() {
		const bufferInfo = getBufferInfo(videoElement);

		// Remove old buffer if too much is cached
		if (bufferInfo.total > MAX_BUFFER_SIZE) {
			const currentTime = videoElement.currentTime;
			const removeEnd = Math.max(0, currentTime - 30); // Keep 30s behind

			if (removeEnd > 0) {
				try {
					sourceBuffer.remove(0, removeEnd);
				} catch (e) {
					console.warn("Buffer removal failed:", e);
				}
			}
		}
	}

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

	// Enhanced stall detection and recovery
	const startStallDetector = () => {
		clearInterval(stallCheckInterval);
		stallCheckInterval = setInterval(() => {
			if (isDestroyed || videoElement.paused || isSeeking) return;

			const bufferInfo = getBufferInfo(videoElement);

			// Stall detection
			if (bufferInfo.ahead < 0.1 && videoElement.readyState < 3) {
				// Try to jump to next buffered range
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

	// Optimized segment appending with resolution switching
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
					console.warn("EndOfStream error:", e);
				}
			}
			return;
		}

		const bufferInfo = getBufferInfo(videoElement);

		// Dynamic threshold based on bandwidth
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

			// Validate resolution
			if (!selectedResolution || typeof selectedResolution !== "string") {
				selectedResolution = lastSelectedResolution || resolutionList[0];
			}

			// Use preloaded segment if resolution matches
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

			// Handle resolution switch
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
					selectedResolution = lastSelectedResolution; // Delay switch
				}
			}

			// Download segment if not preloaded
			if (!segmentData) {
				const downloadStart = performance.now();

				// Double-check resolution is valid before download
				if (!selectedResolution || typeof selectedResolution !== "string") {
					console.error(
						"Invalid resolution for segment download:",
						selectedResolution,
					);
					selectedResolution = lastSelectedResolution || resolutionList[0];
				}

				console.log(
					`Downloading segment ${segment.name} at resolution ${selectedResolution}`,
				);
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
				appendTimeout = setTimeout(appendNextSegment, 100);
				return;
			}

			// Append segment
			await waitForUpdateEnd(sourceBuffer);
			sourceBuffer.appendBuffer(segmentData);
			await waitForUpdateEnd(sourceBuffer);

			segmentIndex++;
			preloadNextSegments(); // Start preloading next segment
			appendNextSegment();
		} catch (err) {
			if (isDestroyed) return;

			console.warn("Segment append error:", err);

			if (err.name === "QuotaExceededError") {
				manageBuffer();
				appendTimeout = setTimeout(appendNextSegment, 1000);
			} else {
				segmentIndex++;
				appendTimeout = setTimeout(appendNextSegment, 100);
			}
		}
	}

	// Efficient resolution switching
	async function performResolutionSwitch(
		newResolution,
		sourceBuffer,
		fromSegmentIndex,
	) {
		try {
			// Get or cache init file
			let initData = initFileCache.get(newResolution);
			if (!initData) {
				initData = await getInitFile(videoId, newResolution);
				initFileCache.set(newResolution, initData);
			}

			// Remove future buffer to allow resolution change
			const currentTime = videoElement.currentTime;
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

			// Append new init segment
			await waitForUpdateEnd(sourceBuffer);
			sourceBuffer.appendBuffer(initData);
			await waitForUpdateEnd(sourceBuffer);
		} catch (err) {
			console.error("Resolution switch failed:", err);
			throw err;
		}
	}

	// Optimized seek handling
	async function handleSeek() {
		if (isDestroyed || mediaSource.readyState !== "open" || isSeeking) return;

		const seekTime = videoElement.currentTime;
		const bufferInfo = getBufferInfo(videoElement);

		// Check if seek target is already buffered
		const isBuffered = bufferInfo.ranges.some(
			(range) => seekTime >= range.start + 0.1 && seekTime < range.end - 0.1,
		);

		if (isBuffered) return;

		isSeeking = true;
		stopWatchHistory();
		clearTimeout(appendTimeout);
		nextSegmentPromise = null; // Cancel preloading

		try {
			await waitForUpdateEnd(sourceBuffer);
			sourceBuffer.abort();
			await waitForUpdateEnd(sourceBuffer);

			// Clear buffer
			if (sourceBuffer.buffered.length > 0) {
				sourceBuffer.remove(0, mediaSource.duration);
				await waitForUpdateEnd(sourceBuffer);
			}

			// Rebuild from seek point
			sourceBuffer.timestampOffset = 0;
			await playIntro(sourceBuffer, lastSelectedResolution);

			const newIntroEnd =
				sourceBuffer.buffered.length > 0
					? sourceBuffer.buffered.end(0)
					: introDuration;
			sourceBuffer.timestampOffset = newIntroEnd;

			const targetTime = Math.max(0, seekTime - newIntroEnd);
			segmentIndex = findSegmentIndexForTime(targetTime, segmentList);

			// Use fast bandwidth estimation for immediate response
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

			// Get cached or fresh init file
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
			startWatchHistory();
			appendNextSegment();
		}
	}

	// Initialize playback
	sourceBuffer.timestampOffset = introDuration;

	try {
		const initSegment = await prefetchInitPromise;
		initFileCache.set(startupRes, initSegment);
		sourceBuffer.appendBuffer(initSegment);
		await waitForUpdateEnd(sourceBuffer);

		// Handle start time
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

		// Load first segment
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

	// Start main processes
	appendNextSegment();
	startStallDetector();
	preloadNextSegments();

	// Event listeners
	const playHandler = () => {
		startWatchHistory();
		if (videoElement.volume > 0) videoElement.muted = false;
	};

	videoElement.addEventListener("play", playHandler);
	videoElement.addEventListener("pause", stopWatchHistory);
	videoElement.addEventListener("ended", stopWatchHistory);
	videoElement.addEventListener("seeking", handleSeek);

	// Cleanup function
	return () => {
		isDestroyed = true;
		clearTimeout(appendTimeout);
		clearInterval(stallCheckInterval);
		stopWatchHistory();

		videoElement.removeEventListener("play", playHandler);
		videoElement.removeEventListener("pause", stopWatchHistory);
		videoElement.removeEventListener("ended", stopWatchHistory);
		videoElement.removeEventListener("seeking", handleSeek);

		// Clear caches
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
