import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
	return twMerge(clsx(inputs));
}

export async function getMainManifest(videoId) {
	try {
		const res = await fetch(`http://localhost:8000/api/manifest/${videoId}`);
		if (!res.ok) throw new Error("Failed to fetch main manifest");
		const text = await res.text();
		return text;
	} catch (err) {
		console.error("Error fetching main manifest:", err);
		return null;
	}
}

export async function getManifestByResolution(videoId, resolution) {
	try {
		const res = await fetch(
			`http://localhost:8000/api/manifest/${videoId}/${resolution}`,
		);
		if (!res.ok) throw new Error("Failed to fetch manifest by resolution");
		const text = await res.text();
		return text;
	} catch (err) {
		console.error("Error fetching manifest by resolution:", err);
		return null;
	}
}

export async function getManifestBySegment(videoId, segmentName) {
	try {
		const res = await fetch(
			`http://localhost:8000/api/manifest/${videoId}/${segmentName}`,
		);
		if (!res.ok) throw new Error("Failed to fetch manifest by segment");
		const text = await res.text();
		return text;
	} catch (err) {
		console.error("Error fetching manifest by segment:", err);
		return null;
	}
}

export async function getVideoSegment(videoId, resolution, segmentName) {
	try {
		const res = await fetch(
			`http://localhost:8000/api/segment/${videoId}/${resolution}/${segmentName}`,
		);
		if (!res.ok) throw new Error("Failed to fetch video segment");
		const segment = await res.arrayBuffer();
		return segment;
	} catch (err) {
		console.error("Error fetching video segment:", err);
		return null;
	}
}

export function getCurrentBufferLevel(videoElement) {
	const buffered = videoElement.buffered;
	if (buffered.length === 0) return 0;

	const lastBuffered = buffered.end(buffered.length - 1);
	const currentTime = videoElement.currentTime;
	if (currentTime < lastBuffered) {
		return lastBuffered - currentTime;
	} else {
		return 0; // No buffer left
	}
}

export function parseManifest(manifestText) {
	const segments = [];
	const lines = manifestText.split("\n");
	let currentDuration = null;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();
		if (line.startsWith("#EXTINF:")) {
			currentDuration = parseFloat(line.split(":")[1]);
		} else if (
			line &&
			!line.startsWith("#") &&
			(line.endsWith(".m4s") || line.endsWith(".ts") || line.endsWith(".mp4"))
		) {
			// Add segment with duration, size will be filled after
			segments.push({
				name: line,
				duration: currentDuration,
				size: null,
			});
			currentDuration = null;
		} else if (line.startsWith("#EXT-X-SEGMENT-SIZE:")) {
			const size = parseInt(line.split(":")[1], 10);
			if (segments.length > 0) {
				segments[segments.length - 1].size = size;
			}
		}
	}
	return segments;
}

export function getAvailableResolutions(manifestText) {
	const resolutions = new Set();
	const lines = manifestText.split("\n");

	for (let line of lines) {
		line = line.trim();
		if (line.startsWith("#EXT-X-STREAM-INF:")) {
			const resolutionMatch = line.match(/RESOLUTION=(\d+)x(\d+)/);
			if (resolutionMatch) {
				// Format as "1080p", "720p", etc.
				const height = resolutionMatch[2];
				resolutions.add(`${height}p`);
			}
		}
	}
	return Array.from(resolutions);
}

export async function getVideoData(videoId) {
	try {
		const res = await fetch(`http://localhost:8000/api/video/${videoId}`);
		if (!res.ok) throw new Error("Failed to fetch video data");
		const data = await res.json();
		return data;
	} catch (err) {
		console.error("Error fetching video data:", err);
	}
}

export async function getSegmentSizes(videoId, segment) {
	try {
		const res = await fetch(
			`http://localhost:8000/api/getSegmentSizes/${videoId}/${segment}`,
		);
		if (!res.ok) throw new Error("Failed to fetch segment sizes");
		const sizes = await res.json();
		return sizes;
	} catch (err) {
		console.error("Error fetching segment sizes:", err);
		return [];
	}
}

export async function getInitFile(videoId, resolution) {
	try {
		const res = await fetch(
			`http://localhost:8000/api/init/${videoId}/${resolution}`,
		);
		if (!res.ok) throw new Error("Failed to fetch init file");
		const initFile = await res.arrayBuffer();
		return initFile;
	} catch (err) {
		console.error("Error fetching init file:", err);
		return null;
	}
}

export async function getIntroVideo(resolution) {
	try {
		const res = await fetch(
			"http://localhost:8000/api/getIntroVideo/" + resolution,
		);
		if (!res.ok) throw new Error("Failed to fetch intro video");
		const video = await res.arrayBuffer();
		return video;
	} catch (err) {
		console.error("Error fetching intro video:", err);
		return null;
	}
}

export async function getIntroInit(resolution) {
	try {
		const res = await fetch(
			"http://localhost:8000/api/getIntroInit/" + resolution,
		);
		if (!res.ok) throw new Error("Failed to fetch intro init file");
		const initFile = await res.arrayBuffer();
		return initFile;
	} catch (err) {
		console.error("Error fetching intro init file:", err);
		return null;
	}
}

export async function getIntroManifest(resolution) {
	try {
		const res = await fetch(
			"http://localhost:8000/api/getIntroManifest/" + resolution,
		);
		if (!res.ok) throw new Error("Failed to fetch intro manifest");
		const manifest = await res.text();
		return manifest;
	} catch (err) {
		console.error("Error fetching intro manifest:", err);
		return null;
	}
}

// ONLY THIS FUNCTION NEEDS TO BE CHANGED
export function calculateUtility(segmentSizes, resolutionList) {
	// FIX: Pass segmentSizes to calculateMinSegmentSize
	const S_min = calculateMinSegmentSize(segmentSizes);

	const utility = [];
	resolutionList.forEach((res) => {
		const S_m = segmentSizes[res];
		if (S_m > 0 && S_min > 0) {
			const utilityValue = Math.log(S_m / S_min);
			utility.push(utilityValue);
		} else {
			utility.push(0); // If size is 0 or S_min is 0, utility is 0
		}
	});
	return utility;
}

export function calculateMinSegmentSize(sizes) {
	const validSizes = Object.values(sizes).filter((size) => size > 0);
	if (validSizes.length === 0) {
		return 1; // Prevent division by zero if all sizes are zero, use a small positive number
	}
	return Math.min(...validSizes);
}
