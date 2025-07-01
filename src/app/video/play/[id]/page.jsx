"use client";
import { initializeVideoStream } from "@/lib/player";
import { useEffect, useRef, useState, use } from "react";
import {
	getMainManifest,
	getManifestByResolution,
	getManifestBySegment,
	getVideoData,
	parseManifest,
	getAvailableResolutions,
	getSegmentSizes,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import CustomDropdown from "@/components/singleComponents/CustomDropdown";
import { Icon } from "@iconify/react";

export default function VideoPage({ params }) {
	const videoRef = useRef(null);
	const { id: videoId } = use(params);
	const [videoData, setVideoData] = useState({});
	const [resolutionList, setResolutionList] = useState([]);
	const [resolution, setResolution] = useState(null);
	const [segmentList, setSegmentList] = useState({});

	// Video control states
	const [isPlaying, setIsPlaying] = useState(false);
	const [isMuted, setIsMuted] = useState(true);
	const [volume, setVolume] = useState(100);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [bufferInfo, setBufferInfo] = useState({
		bufferedTime: 0,
		bufferedPercentage: 0,
	});
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [showControls, setShowControls] = useState(true);
	const [playbackRate, setPlaybackRate] = useState(1);
	const [isLoading, setIsLoading] = useState(true);

	let controlsTimeout = useRef(null);

	useEffect(() => {
		if (!videoId) return;

		// Fetch video metadata
		const fetchVideoData = async () => {
			try {
				const video = await getVideoData(videoId);
				if (!video) throw new Error("Failed to fetch video data");
				setVideoData(video);
				console.log("Video data fetched:", video);
				document.title = video.title || "Seenema Video Player";
			} catch (err) {
				console.error("Error fetching video data:", err);
			}
		};

		const fetchMainManifest = async () => {
			try {
				const manifest = await getMainManifest(videoId);
				if (!manifest) throw new Error("Failed to fetch main manifest");
				const availableResolutions = getAvailableResolutions(manifest);
				setResolutionList(availableResolutions);
			} catch (err) {
				console.error("Error fetching main manifest:", err);
			}
		};
		fetchVideoData();
		fetchMainManifest();
	}, [videoId]);

	// Update resolution when resolutionList changes
	useEffect(() => {
		if (resolutionList.length > 0 && !resolution) {
			setResolution(resolutionList[0]);
		}
	}, [resolutionList]);

	// Update segment list when resolution changes
	useEffect(() => {
		if (!videoId || !resolution) {
			return;
		}
		const fetchSegmentList = async () => {
			try {
				const manifest = await getManifestByResolution(videoId, resolution);
				if (!manifest)
					throw new Error("Failed to fetch manifest by resolution");
				const segments = parseManifest(manifest);
				setSegmentList(segments);
			} catch (err) {
				console.error("Error fetching segment list:", err);
			}
		};
		fetchSegmentList();
	}, [resolution, videoId]);

	useEffect(() => {
		if (
			videoRef.current &&
			Object.keys(segmentList).length > 0 &&
			resolution &&
			videoData?.duration
		) {
			console.log("Initializing video stream with segments:", resolutionList);
			const startStream = async () => {
				setIsLoading(true);
				await initializeVideoStream(
					videoRef.current,
					videoId,
					segmentList,
					resolutionList,
					videoData.duration + 7, // or just videoData.duration
				).catch((err) => {
					console.error("Error initializing video stream:", err);
				});
				setIsLoading(false);
			};
			startStream();
		}
	}, [segmentList, videoId, resolution, resolutionList, videoData.duration]);

	useEffect(() => {
		const handleKeyDown = (e) => {
			// Prevent shortcuts when typing in an input/textarea
			if (
				document.activeElement.tagName === "INPUT" ||
				document.activeElement.tagName === "TEXTAREA" ||
				document.activeElement.isContentEditable
			) {
				return;
			}
			switch (e.key.toLowerCase()) {
				case " ":
				case "k":
					e.preventDefault();
					togglePlayPause();
					break;
				case "m":
					toggleMute();
					break;
				case "arrowright":
					skipTime(5);
					break;
				case "arrowleft":
					skipTime(-5);
					break;
				case "arrowup":
					handleVolumeChange([Math.min(volume + 10, 100)]);
					break;
				case "arrowdown":
					handleVolumeChange([Math.max(volume - 10, 0)]);
					break;
				case "f":
					toggleFullscreen();
					break;
				case ">":
					handlePlaybackRateChange(Math.min(playbackRate + 0.25, 2));
					break;
				case "<":
					handlePlaybackRateChange(Math.max(playbackRate - 0.25, 0.25));
					break;
				default:
					break;
			}
		};
		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [
		isPlaying,
		isMuted,
		volume,
		playbackRate,
		showControls,
		resolution,
		currentTime,
	]);

	const updateBufferInfo = () => {
		const video = videoRef.current;
		if (!video || !video.buffered || !video.buffered.length || !duration) {
			setBufferInfo({ bufferedTime: 0, bufferedPercentage: 0 });
			return;
		}

		let maxBufferedEnd = 0;
		const currentTime = video.currentTime;

		for (let i = 0; i < video.buffered.length; i++) {
			const start = video.buffered.start(i);
			const end = video.buffered.end(i);

			// Check if this range contains or is ahead of current time
			if (currentTime >= start && currentTime <= end) {
				maxBufferedEnd = end;
				break;
			}
		}

		const bufferedTime = Math.max(0, maxBufferedEnd - currentTime);
		const bufferedPercentage = Math.min(
			((currentTime + bufferedTime) / duration) * 100,
			100,
		);

		setBufferInfo({
			bufferedTime,
			bufferedPercentage,
		});
	};

	const seekedSegment = () => {};

	// Control functions
	const togglePlayPause = () => {
		const video = videoRef.current;
		if (!video) return;

		if (isPlaying) {
			video.pause();
		} else {
			video.play();
		}
	};

	const toggleMute = () => {
		const video = videoRef.current;
		if (!video) return;
		video.muted = !video.muted;
	};

	const handleVolumeChange = (newVolume) => {
		const video = videoRef.current;
		if (!video) return;
		const volumeValue = newVolume[0] / 100;
		video.volume = volumeValue;
		setVolume(newVolume[0]);
		if (volumeValue > 0 && isMuted) {
			video.muted = false;
		}
	};

	const handleSeek = (newTime) => {
		const video = videoRef.current;
		if (!video) return;
		const newTimeValue = newTime[0];
		if (newTimeValue < 0 || newTimeValue > video.duration) return;
		video.currentTime = newTimeValue;
		setCurrentTime(newTimeValue);
		resetControlsTimeout();
	};

	const toggleFullscreen = () => {
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen();
			setIsFullscreen(true);
		} else {
			document.exitFullscreen();
			setIsFullscreen(false);
		}
	};

	const skipTime = (seconds) => {
		const video = videoRef.current;
		if (!video) return;
		video.currentTime = Math.max(
			0,
			Math.min(video.duration, video.currentTime + seconds),
		);
	};

	const handlePlaybackRateChange = (rate) => {
		const video = videoRef.current;
		if (!video) return;
		video.playbackRate = rate;
		setPlaybackRate(rate);
	};

	// Auto-hide controls
	const resetControlsTimeout = () => {
		setShowControls(true);
		if (controlsTimeout.current) {
			clearTimeout(controlsTimeout.current);
		}
		controlsTimeout.current = setTimeout(() => {
			if (isPlaying) setShowControls(false);
		}, 5000);
	};

	const formatTime = (time) => {
		if (isNaN(time)) return "0:00";
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return `${minutes}:${seconds.toString().padStart(2, "0")}`;
	};

	// Calculate progress percentage
	const progressPercentage = duration
		? Math.min((currentTime / duration) * 100, 100)
		: 0;

	return (
		<div
			className="fixed inset-0 w-screen h-screen bg-black"
			onMouseMove={resetControlsTimeout}
			onMouseLeave={() => isPlaying && setShowControls(false)}>
			{/* Video Element - Fixed duplicate handlers */}
			<video
				ref={videoRef}
				id="video"
				autoPlay
				muted
				className="w-full h-full object-cover"
				onTimeUpdate={() => {
					const video = videoRef.current;
					if (video) {
						setCurrentTime(video.currentTime);
						updateBufferInfo();
					}
				}}
				onDurationChange={() => setDuration(videoRef.current?.duration || 0)}
				onProgress={updateBufferInfo}
				onPlay={() => setIsPlaying(true)}
				onPause={() => setIsPlaying(false)}
				onVolumeChange={() => {
					const video = videoRef.current;
					setVolume((video?.volume || 0) * 100);
					setIsMuted(video?.muted ?? true);
				}}
				onLoadedData={() => {
					setIsLoading(false);
					updateBufferInfo();
				}}
				onCanPlay={() => {
					setIsLoading(false);
					updateBufferInfo();
				}}
				onWaiting={() => setIsLoading(true)}
				onError={(e) => console.error("Video error", e.target.error)}
			/>

			{/* Loading Overlay */}
			{isLoading && (
				<div className="absolute inset-0 flex items-center justify-center bg-black/50">
					<div className="text-center">
						<div className="spinner w-12 h-12 mx-auto mb-4"></div>
					</div>
				</div>
			)}

			{/* Center Play/Pause Button */}
			<div
				className="absolute inset-0 flex items-center justify-center cursor-pointer"
				onClick={togglePlayPause}>
				{!isPlaying && !isLoading && (
					<div className="bg-black/50 rounded-full p-4 transition-opacity duration-300">
						<Icon icon="solar:play-bold" className="w-16 h-16 text-primary" />
					</div>
				)}
			</div>

			{/* Custom Controls */}
			<div
				className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${
					showControls ? "opacity-100" : "opacity-0"
				}`}>
				{/* Progress Bar */}
				<div className="px-4 pb-2">
					<div className="relative">
						{/* Buffer Progress (behind current progress) */}
						<div className="absolute top-1/2 transform -translate-y-1/2 w-full h-1 bg-white/20 rounded-full">
							<div
								className="h-full bg-white rounded-full transition-all duration-300"
								style={{
									width: `${Math.min(bufferInfo.bufferedPercentage, 100)}%`,
									opacity: 0.6,
								}}
							/>
						</div>
						{/* Current Progress (on top) */}
						<div className="absolute top-1/2 transform -translate-y-1/2 w-full h-1 bg-white/20 rounded-full">
							<div
								className="h-full  rounded-full transition-all duration-100"
								style={{ width: `${Math.min(progressPercentage, 100)}%` }}
							/>
						</div>
						{/* Seek Slider */}
						<Slider
							value={[currentTime]}
							max={duration + 7 || 100}
							step={0.1}
							onValueChange={handleSeek}
							className="w-full cursor-pointer relative z-10"
						/>
					</div>
				</div>

				{/* Control Bar */}
				<div className="flex items-center justify-between px-4 pb-4">
					{/* Left Controls */}
					<div className="flex items-center space-x-3">
						{/* Play/Pause */}
						<Button
							variant="ghost"
							size="sm"
							onClick={togglePlayPause}
							className="text-white hover:text-primary hover:bg-white/10">
							<Icon
								icon={isPlaying ? "solar:pause-bold" : "solar:play-bold"}
								className="w-6 h-6"
							/>
						</Button>

						{/* Skip Backward */}
						<Button
							variant="ghost"
							size="sm"
							onClick={() => skipTime(-10)}
							className="text-white hover:text-primary hover:bg-white/10">
							<Icon
								icon="solar:rewind-10-seconds-back-bold"
								className="w-5 h-5"
							/>
						</Button>

						{/* Skip Forward */}
						<Button
							variant="ghost"
							size="sm"
							onClick={() => skipTime(10)}
							className="text-white hover:text-primary hover:bg-white/10">
							<Icon
								icon="solar:rewind-10-seconds-forward-bold"
								className="w-5 h-5"
							/>
						</Button>

						{/* Volume Controls */}
						<div className="flex items-center space-x-2">
							<Button
								variant="ghost"
								size="sm"
								onClick={toggleMute}
								className="text-white hover:text-primary hover:bg-white/10">
								<Icon
									icon={
										isMuted || volume === 0
											? "solar:volume-cross-bold"
											: volume < 50
											? "solar:volume-small-bold"
											: "solar:volume-loud-bold"
									}
									className="w-5 h-5"
								/>
							</Button>
							<div className="w-20">
								<Slider
									value={[isMuted ? 0 : volume]}
									max={100}
									step={1}
									onValueChange={handleVolumeChange}
									className="cursor-pointer"
								/>
							</div>
						</div>

						{/* Time Display */}
						<div className="text-white text-sm">
							{formatTime(currentTime)} /{" "}
							{formatTime(videoData.duration + 7 || 0)}
						</div>
					</div>

					{/* Right Controls */}
					<div className="flex items-center space-x-3">
						{/* Playback Speed */}
						<CustomDropdown
							options={[0.5, 1, 1.5, 2]}
							selectedOption={playbackRate + "X"}
							onSelect={handlePlaybackRateChange}
						/>

						{/* Quality Selector */}
						<CustomDropdown
							options={resolutionList}
							selectedOption={resolution}
							onSelect={(res) => {
								setResolution(res);
								setSegmentList({});
							}}
						/>

						{/* Picture in Picture */}
						<Button
							variant="ghost"
							size="sm"
							onClick={() => videoRef.current?.requestPictureInPicture?.()}
							className="text-white hover:text-primary hover:bg-white/10">
							<Icon icon="solar:pip-bold" className="w-5 h-5" />
						</Button>

						{/* Fullscreen */}
						<Button
							variant="ghost"
							size="sm"
							onClick={toggleFullscreen}
							className="text-white hover:text-primary hover:bg-white/10">
							<Icon
								icon={
									isFullscreen
										? "solar:quit-full-screen-bold"
										: "solar:full-screen-bold"
								}
								className="w-5 h-5"
							/>
						</Button>
					</div>
				</div>
			</div>

			{/* Video Info Overlay */}
			{videoData.title && showControls && (
				<div className="absolute top-4 left-4 right-4 w-max">
					<div className="bg-black/30 rounded-lg p-2 backdrop-blur-sm">
						<h1 className="text-white text-xl font-bold mb-0">
							{videoData.title}
							{videoData.created_at && (
								<span className="text-white/70 text-lg font-normal ml-2">
									({videoData.created_at.split("T")[0].split("-")[0]})
								</span>
							)}
						</h1>
					</div>
				</div>
			)}
		</div>
	);
}
