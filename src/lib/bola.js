import { getSegmentSizes, getVideoSegment } from "./utils";

const REBUFFER_PENALTY = 7.0;
const MAX_BUFFER_CAPACITY_SECONDS = 20;
function getCurrentBufferLevel(videoElement) {
	if (
		!videoElement ||
		!videoElement.buffered ||
		videoElement.buffered.length === 0
	) {
		return 0;
	}
	const currentTime = videoElement.currentTime;
	// Find the buffer range that contains the current time
	for (let i = 0; i < videoElement.buffered.length; i++) {
		if (
			videoElement.buffered.start(i) <= currentTime &&
			videoElement.buffered.end(i) >= currentTime
		) {
			return videoElement.buffered.end(i) - currentTime;
		}
	}
	return 0;
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
	typicalSegmentDuration,
) {
	const currentTime = videoElement.currentTime;
	const segmentDuration = segment.duration;
	const effectiveSegmentDuration = typicalSegmentDuration;

	const t = Math.min(currentTime, totalDuration - currentTime);
	const t_prime = Math.max(t / 2, 3 * effectiveSegmentDuration);

	const MAX_BUFFER_CAPACITY_SEGMENTS =
		MAX_BUFFER_CAPACITY_SECONDS / effectiveSegmentDuration;
	const QD_max = Math.min(
		MAX_BUFFER_CAPACITY_SEGMENTS,
		t_prime / effectiveSegmentDuration,
	);

	let segmentSizes;
	try {
		segmentSizes = await getSegmentSizes(segment.name, videoId);
	} catch (error) {
		console.error("Error fetching segment sizes for BOLA:", error);
		return resolutionList[0];
	}

	const U_m = calculateUtility(segmentSizes.sizes, resolutionList);
	const U_max = Math.max(...U_m);
	const V_D = (QD_max - 1) / (U_max + REBUFFER_PENALTY);

	const bufferInSeconds =
		segment.name === "segment_000.m4s" && placeHolderBuffer
			? placeHolderBuffer.buffer
			: getCurrentBufferLevel(videoElement);

	const Q = bufferInSeconds / effectiveSegmentDuration;

	let score = [];
	for (let i = 0; i < resolutionList.length; i++) {
		const res = resolutionList[i];
		const S_m_MB = (segmentSizes.sizes[res] || 0) / (1024 * 1024);

		let resolutionScore;
		if (!S_m_MB || S_m_MB === 0) {
			resolutionScore = -Infinity;
		} else {
			resolutionScore = (V_D * U_m[i] + V_D * REBUFFER_PENALTY - Q) / S_m_MB;
		}
		score.push(resolutionScore);
	}

	let bestResIndex = score.indexOf(Math.max(...score));
	if (bestResIndex === -1) {
		bestResIndex = 0;
	}
	let m_star = resolutionList[bestResIndex];

	if (
		lastSelectedResolution !== null &&
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
			if (S_m / effectiveSegmentDuration <= maxR) {
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
			const score_m0 = (V_D * m0_U + V_D * REBUFFER_PENALTY - Q) / m0_S;
			const score_m0m1 = (V_D * m0m1_U + V_D * REBUFFER_PENALTY - Q) / m0m1_S;

			if (score_m0 >= score_m0m1) {
				bestResIndex = m0Index;
			} else {
				bestResIndex = Math.max(0, m0Index - 1);
			}
		}
	}

	const logData = {
		"Buffer Level (s)": bufferInSeconds,
		"QD_max (segments)": QD_max,
		"Q (segments)": Q,
		V_D: V_D,
		"Final Resolution": resolutionList[bestResIndex],
	};
	console.table(logData);

	return resolutionList[bestResIndex];
}

function calculateUtility(segmentSizes, resolutionList) {
	const S_min = calculateMinSegmentSize(segmentSizes);
	const utility = [];
	resolutionList.forEach((res) => {
		const S_m = segmentSizes[res];
		if (S_m > 0 && S_min > 0) {
			utility.push(Math.log(S_m / S_min));
		} else {
			utility.push(0);
		}
	});
	return utility;
}

function calculateMinSegmentSize(sizes) {
	const validSizes = Object.values(sizes).filter((size) => size > 0);
	if (validSizes.length === 0) return 1;
	return Math.min(...validSizes);
}

export async function getPlaceholderBuffer(
	videoId,
	resolutionList,
	segmentList,
) {
	if (!segmentList || segmentList.length === 0) {
		return { startupResolution: "144p", startupBandwidth: 0.1, buffer: 0 };
	}
	const start = performance.now();
	const testResolution = resolutionList.includes("480p")
		? "480p"
		: resolutionList[0];
	const testSegment = await getVideoSegment(
		videoId,
		testResolution,
		segmentList[0].name,
	);
	const end = performance.now();
	if (!testSegment) {
		return { startupResolution: "144p", startupBandwidth: 0.1, buffer: 0 };
	}
	const downloadTimeSeconds = (end - start) / 1000;
	const segmentSizeMB = testSegment.byteLength / (1024 * 1024);
	const measuredBandwidth =
		downloadTimeSeconds > 0 ? segmentSizeMB / downloadTimeSeconds : 0;
	const bitrateTable = {
		"144p": 0.02,
		"240p": 0.05,
		"480p": 0.15,
		"720p": 0.3,
		"1080p": 0.55,
	};
	let startupResolution = resolutionList[0] || "144p";
	for (const res of resolutionList) {
		if (bitrateTable[res] && bitrateTable[res] < measuredBandwidth * 0.8) {
			startupResolution = res;
		} else {
			break;
		}
	}
	const placeholderBufferSeconds = Math.max(
		0,
		segmentList[0].duration - downloadTimeSeconds,
	);
	return {
		startupResolution,
		startupBandwidth: measuredBandwidth,
		buffer: placeholderBufferSeconds + 9,
	};
}
