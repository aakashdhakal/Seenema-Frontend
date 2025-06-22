import { getInitFile, getSegmentSizes, getVideoSegment } from "@/lib/utils";

const BANDWIDTH_ALPHA = 0.4;
const REBUFFER_PENALTY = 0.2;
const MAX_BUFFER_CAPACITY = 10;

function getCurrentBufferLevel(videoElement) {
	if (
		!videoElement ||
		!videoElement.buffered ||
		videoElement.buffered.length === 0
	)
		return 0;
	return videoElement.buffered.end(0) - videoElement.currentTime;
}

export async function initializeVideoStream(
	videoElement,
	videoId,
	segmentList,
	resolutionList,
) {
	if (!videoElement || !videoId || segmentList.length === 0) {
		console.error("🚫 Missing required video info.");
		return;
	}

	const mediaSource = new MediaSource();
	videoElement.src = URL.createObjectURL(mediaSource);
	videoElement.preload = "auto";

	const placeholderBuffer = await getPlaceholderBuffer(
		videoId,
		resolutionList,
		segmentList,
	);
	const startupRes = placeholderBuffer.startupResolution;
	let placeHolderBuffer = placeholderBuffer.buffer;

	mediaSource.addEventListener("sourceopen", async () => {
		const sourceBuffer = mediaSource.addSourceBuffer(
			`video/mp4; codecs=\"avc1.42E01E, mp4a.40.2\"`,
		);
		let lastSelectedResolution = startupRes;
		let lastBandwidth = null;
		let totalDuration = segmentList.reduce(
			(acc, seg) => acc + (seg.duration || 2),
			0,
		);
		let segmentIndex = 0;

		while (segmentIndex < segmentList.length) {
			const bufferLevel = getCurrentBufferLevel(videoElement);
			if (bufferLevel >= MAX_BUFFER_CAPACITY) {
				await new Promise((resolve) => setTimeout(resolve, 500));
				continue;
			}

			const segment = segmentList[segmentIndex];
			const selectedRes = await BOLA(
				videoId,
				videoElement,
				segment,
				resolutionList,
				totalDuration,
				lastSelectedResolution,
				lastBandwidth,
				placeHolderBuffer,
			);

			lastSelectedResolution = selectedRes;
			const start = performance.now();
			const segmentBuffer = await getVideoSegment(
				videoId,
				selectedRes,
				segment.name,
			);
			const end = performance.now();

			lastBandwidth =
				((segmentBuffer.byteLength / (end - start)) * 1000) / (1024 * 1024);
			sourceBuffer.appendBuffer(segmentBuffer);
			segmentIndex++;
		}

		mediaSource.endOfStream();
	});
}

async function getPlaceholderBuffer(videoId, resolutionList, segmentList) {
	const testRes = resolutionList[1] || resolutionList[0];
	const segment = await getVideoSegment(videoId, testRes, segmentList[0].name);
	const sizeMB = segment.byteLength / (1024 * 1024);
	const timeSec =
		(performance.now() - performance.timing.navigationStart) / 1000;
	const bandwidthMBps = sizeMB / timeSec;
	const estimatedKbps = bandwidthMBps * 8 * 1024;

	const bitrateTable = {
		"144p": 150,
		"240p": 400,
		"360p": 800,
		"480p": 1200,
		"720p": 2500,
		"1080p": 4500,
	};

	let selected = "144p";
	for (let res of resolutionList) {
		if (bitrateTable[res] <= estimatedKbps) selected = res;
	}

	return { startupResolution: selected, buffer: segment };
}

export default async function BOLA(
	videoId,
	videoElement,
	segment,
	resolutionList,
	totalDuration,
	lastSelectedResolution = null,
	lastBandwidth = null,
	placeHolderBuffer,
) {
	const currentTime = videoElement.currentTime;
	const segmentDuration = segment.duration;
	const t = Math.min(currentTime, totalDuration - currentTime);
	const t_prime = Math.max(t / 2, 3 * segmentDuration);
	const QD_max = Math.min(MAX_BUFFER_CAPACITY, t_prime / segmentDuration);

	let segmentSizes;
	try {
		segmentSizes = await getSegmentSizes(segment.name, videoId);
	} catch (error) {
		console.error("Error fetching segment sizes for BOLA:", error);
		return resolutionList[0];
	}

	const U_m = calculateUtility(segmentSizes.sizes, resolutionList);
	const U_max = Math.max(...U_m);
	const V_D = (QD_max - 1) / (U_max + REBUFFER_PENALTY * segmentDuration);
	const Q = placeHolderBuffer
		? placeHolderBuffer.buffer
		: getCurrentBufferLevel(videoElement);
	let score = [];

	for (let i = 0; i < resolutionList.length; i++) {
		const res = resolutionList[i];
		const S_m = segmentSizes.sizes[res];
		const S_m_MB = S_m / 1048576;
		score.push(
			(V_D * U_m[i] + V_D * REBUFFER_PENALTY * segmentDuration - Q) / S_m_MB,
		);
	}

	let bestResIndex = score.indexOf(Math.max(...score));
	if (bestResIndex === -1) bestResIndex = 0;
	let m_star = resolutionList[bestResIndex];

	if (
		lastSelectedResolution &&
		resolutionList.indexOf(m_star) <
			resolutionList.indexOf(lastSelectedResolution)
	) {
		const r = lastBandwidth || 0;
		const lastSizeMB =
			(segmentSizes.sizes[lastSelectedResolution] || 0) / (1024 * 1024);
		const maxR = Math.max(r, lastSizeMB / segmentDuration);
		let m0 = resolutionList[0];
		for (let res of resolutionList) {
			const S_m = (segmentSizes.sizes[res] || 0) / (1024 * 1024);
			if (S_m / segmentDuration <= maxR) {
				m0 = res;
				break;
			}
		}
		const m0Index = resolutionList.indexOf(m0);
		const mPrevIndex = resolutionList.indexOf(lastSelectedResolution);
		const mStarIndex = bestResIndex;
		if (m0Index <= mStarIndex) {
			bestResIndex = mStarIndex;
		} else if (m0Index > mPrevIndex) {
			bestResIndex = mPrevIndex;
		} else {
			const m0_S = segmentSizes.sizes[resolutionList[m0Index]] / (1024 * 1024);
			const m0_U = U_m[m0Index];
			const m0m1Index = Math.max(0, m0Index - 1);
			const m0m1_S =
				segmentSizes.sizes[resolutionList[m0m1Index]] / (1024 * 1024);
			const m0m1_U = U_m[m0m1Index];
			const score_m0 = (V_D * m0_U - Q) / m0_S;
			const score_m0m1 = (V_D * m0m1_U - Q) / m0m1_S;
			if (score_m0 >= score_m0m1) {
				const pauseTime =
					Math.max(0, segmentDuration * (Q - QD_max + 1)) * 1000;
				await new Promise((resolve) => setTimeout(resolve, pauseTime));
				bestResIndex = m0Index;
			} else {
				bestResIndex = Math.max(0, m0Index - 1);
			}
		}
	}

	const pauseTime = Math.max(0, segmentDuration * (Q - QD_max + 1));
	await new Promise((resolve) => setTimeout(resolve, pauseTime));
	return resolutionList[bestResIndex];
}

function calculateUtility(segmentSizes, resolutionList) {
	const S_min = calculateMinSegmentSize(segmentSizes);
	return resolutionList.map((res) => {
		const S_m = segmentSizes[res];
		return S_m > 0 && S_min > 0 ? Math.log(S_m / S_min) : 0;
	});
}

function calculateMinSegmentSize(sizes) {
	const validSizes = Object.values(sizes).filter((size) => size > 0);
	return validSizes.length === 0 ? 1 : Math.min(...validSizes);
}
