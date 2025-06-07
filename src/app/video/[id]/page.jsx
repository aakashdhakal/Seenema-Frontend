"use client";
import { useEffect, useRef, useState, use } from "react";

export default function VideoPage({ params }) {
	const videoRef = useRef(null);
	const { id: videoId } = use(params);
	const [videoData, setVideoData] = useState({});
	const [segmentList, setSegmentList] = useState([]);

	useEffect(() => {
		if (!videoId) return;

		// Fetch video metadata
		async function fetchVideoData() {
			try {
				const res = await fetch(`http://localhost:8000/api/video/${videoId}`);
				if (!res.ok) throw new Error("Failed to fetch video data");
				const data = await res.json();
				setVideoData(data);
			} catch (err) {
				console.error("Error fetching video data:", err);
			}
		}

		// Fetch segment list from manifest
		async function fetchManifest() {
			try {
				const res = await fetch(
					`http://localhost:8000/api/manifest/${videoId}`,
				);
				if (!res.ok) throw new Error("Failed to fetch manifest");
				const text = await res.text();
				const segments = text
					.split("\n")
					.filter((line) => line.trim() && !line.startsWith("#"));
				setSegmentList(segments);
			} catch (err) {
				console.error("Error fetching manifest:", err);
			}
		}

		fetchVideoData();
		fetchManifest();
	}, [videoId]);

	useEffect(() => {
		if (!videoId || !videoRef.current || segmentList.length === 0) return;

		const video = videoRef.current;
		const mediaSource = new MediaSource();
		video.src = URL.createObjectURL(mediaSource);

		mediaSource.addEventListener("sourceopen", async () => {
			const mime = 'video/mp4; codecs="avc1.640029, mp4a.40.2"';
			const sourceBuffer = mediaSource.addSourceBuffer(mime);

			try {
				// Load init.mp4
				const initResp = await fetch(
					`http://localhost:8000/api/init/${videoId}`,
				);
				const initSegment = await initResp.arrayBuffer();
				sourceBuffer.appendBuffer(initSegment);

				let index = 0;

				sourceBuffer.addEventListener("updateend", async () => {
					if (index < segmentList.length) {
						const segmentName = segmentList[index];
						const url = `http://localhost:8000/api/segment/${videoId}/${segmentName}`;
						const resp = await fetch(url);
						const segment = await resp.arrayBuffer();
						sourceBuffer.appendBuffer(segment);
						index++;
					} else {
						if (mediaSource.readyState === "open") {
							mediaSource.endOfStream();
						}
					}
				});
			} catch (err) {
				console.error("Error streaming video segments:", err);
			}
		});
	}, [videoId, segmentList]);

	return (
		<div>
			<h1>Video Page</h1>
			<p>Video ID: {videoId}</p>
			<p>Title: {videoData.title}</p>
			<p>Description: {videoData.description}</p>
			<p>Manifest Path: {videoData.manifest_path}</p>
			<p>Created: {videoData.created_at}</p>
			<p>Updated: {videoData.updated_at}</p>
			<p>Duration: {videoData.duration}</p>

			<video
				ref={videoRef}
				id="video"
				controls
				autoPlay
				muted
				width="720"
				onLoadedData={() => console.log("Video loaded")}
				onError={(e) => console.error("Video error", e)}
			/>
		</div>
	);
}
