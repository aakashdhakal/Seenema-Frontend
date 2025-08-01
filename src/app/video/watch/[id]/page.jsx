"use client";

import { initializeVideoStream } from "@/lib/player";
import { useEffect, useRef, useState } from "react";
import {
	getMainManifest,
	getManifestByResolution,
	getVideoData,
	parseManifest,
	getAvailableResolutions,
	updateWatchHistory,
} from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import CustomDropdown from "@/components/singleComponents/CustomDropdown";
import { Icon } from "@iconify/react";
import { useSearchParams, useParams } from "next/navigation";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatDuration } from "@/lib/utils";

export default function VideoPage() {
	const videoRef = useRef(null);
	const params = useParams();
	const { id: videoId } = params;
	const searchParams = useSearchParams();
	const router = useRouter();

	// State for video data and streaming
	const [videoData, setVideoData] = useState({});
	const [resolutionList, setResolutionList] = useState([]);
	const [resolution, setResolution] = useState("Auto");
	const [segmentList, setSegmentList] = useState([]);
	const [initialSeekTime, setInitialSeekTime] = useState(0);

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

	const controlsTimeout = useRef(null);
	const wasPlayingRef = useRef(false);

	// Effect to fetch initial video metadata and manifest
	useEffect(() => {
		if (!videoId) return;

		const startTime = parseFloat(searchParams.get("t"));
		if (!isNaN(startTime) && startTime > 0) {
			setInitialSeekTime(startTime);
		}

		const fetchVideoData = async () => {
			try {
				const video = await getVideoData(videoId);
				if (!video) throw new Error("Failed to fetch video data");
				setVideoData(video);
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
	}, [videoId, searchParams]);

	// Effect to fetch segment list for timing info
	useEffect(() => {
		if (!videoId) return;
		const fetchSegmentList = async () => {
			try {
				const manifest = await getManifestByResolution(videoId, "144p");
				if (!manifest)
					throw new Error("Failed to fetch manifest by resolution");
				const segments = parseManifest(manifest);
				setSegmentList(segments);
			} catch (err) {
				console.error("Error fetching segment list:", err);
			}
		};
		fetchSegmentList();
	}, [videoId]);

	// Effect to initialize or re-initialize the video stream
	useEffect(() => {
		let stream;
		if (
			videoRef.current &&
			segmentList.length > 0 &&
			resolutionList.length > 0 &&
			videoData?.duration
		) {
			const startStream = async () => {
				wasPlayingRef.current = videoRef.current && !videoRef.current.paused;
				setIsLoading(true);

				const timeToSeek =
					videoRef.current.currentTime > 0 &&
					!isNaN(videoRef.current.currentTime)
						? videoRef.current.currentTime
						: initialSeekTime;

				stream = await initializeVideoStream(
					videoRef.current,
					videoId,
					segmentList,
					resolutionList,
					videoData.duration,
					null,
					timeToSeek,
					resolution,
				).catch((err) => {
					console.error("Error initializing video stream:", err);
				});
			};
			startStream();
		}

		return () => {
			if (stream && stream.destroy) {
				stream.destroy();
			}
		};
	}, [
		segmentList,
		videoId,
		resolution,
		resolutionList,
		videoData.duration,
		initialSeekTime,
	]);

	// Effect for keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e) => {
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
			if (
				currentTime >= video.buffered.start(i) &&
				currentTime <= video.buffered.end(i)
			) {
				maxBufferedEnd = video.buffered.end(i);
				break;
			}
		}
		const bufferedTime = Math.max(0, maxBufferedEnd - currentTime);
		const bufferedPercentage = Math.min(
			((currentTime + bufferedTime) / duration) * 100,
			100,
		);
		setBufferInfo({ bufferedTime, bufferedPercentage });
	};

	// Control functions
	const togglePlayPause = () => {
		const video = videoRef.current;
		if (!video) return;
		if (isPlaying) video.pause();
		else video.play();
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
		if (volumeValue > 0 && isMuted) video.muted = false;
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

	// Custom seekbar click handler
	const handleSeekbarClick = (e) => {
		const video = videoRef.current;
		if (!video || !duration) return;

		const rect = e.currentTarget.getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const percentage = clickX / rect.width;
		const newTime = percentage * duration;

		video.currentTime = Math.max(0, Math.min(duration, newTime));
		setCurrentTime(newTime);
		resetControlsTimeout();
	};

	const toggleFullscreen = () => {
		if (!document.fullscreenElement) {
			document.documentElement
				.requestFullscreen()
				.then(() => setIsFullscreen(true));
		} else {
			document.exitFullscreen().then(() => setIsFullscreen(false));
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

	const resetControlsTimeout = () => {
		setShowControls(true);
		if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
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

	const progressPercentage = duration
		? Math.min((currentTime / duration) * 100, 100)
		: 0;

	return (
		<div
			className="fixed inset-0 w-screen h-screen bg-black"
			onMouseMove={resetControlsTimeout}
			onMouseLeave={() => isPlaying && setShowControls(false)}>
			{/* Video Element */}
			<video
				ref={videoRef}
				id="video"
				muted
				autoPlay
				className="w-full h-full md:object-cover sm:object-contain"
				onTimeUpdate={() => {
					const video = videoRef.current;
					if (video && !isLoading) {
						setCurrentTime(video.currentTime);
						updateBufferInfo();
					}
				}}
				onDurationChange={() => setDuration(videoRef.current?.duration || 0)}
				onProgress={updateBufferInfo}
				onPlay={() => setIsPlaying(true)}
				onPause={() => {
					setIsPlaying(false);
					updateWatchHistory(videoId, currentTime);
				}}
				onVolumeChange={() => {
					const video = videoRef.current;
					setVolume((video?.volume || 0) * 100);
					setIsMuted(video?.muted ?? true);
				}}
				onLoadedData={() => {
					setIsLoading(false);
					updateBufferInfo();
					if (wasPlayingRef.current) {
						videoRef.current.play().catch((e) => console.warn(e.message));
					}
				}}
				onCanPlay={() => {
					setIsLoading(false);
					updateBufferInfo();
				}}
				onWaiting={() => setIsLoading(true)}
				onError={(e) => console.error("Video error", e.target.error)}
				onEnded={() => {
					setIsPlaying(false);
					updateWatchHistory(videoId, currentTime);
					router.push(`/video/${videoData.slug}`);
				}}
				poster={videoData.backdrop_path || ""}
			/>

			{/* Loading State */}
			{isLoading && (
				<div className="absolute inset-0 flex items-center justify-center bg-black/50 pointer-events-none">
					<div className="animate-pulse">
						<Image
							src={"/4.png"}
							alt="Loading"
							width={100}
							height={100}
							className="w-12 h-12 xs:w-16 xs:h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain opacity-80"
						/>
					</div>
				</div>
			)}

			{/* Play/Pause Center Button */}
			<div
				className="absolute inset-0 flex items-center justify-center cursor-pointer"
				onClick={togglePlayPause}>
				{!isPlaying && !isLoading && (
					<div className="bg-black/60 rounded-full p-2 xs:p-3 sm:p-4 md:p-6 transition-all duration-300 hover:bg-black/80">
						<Icon
							icon="solar:play-bold"
							className="w-8 h-8 xs:w-10 xs:h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 text-primary"
						/>
					</div>
				)}
			</div>

			{/* Video Controls */}
			<div
				className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-all duration-300 ${
					showControls
						? "opacity-100 translate-y-0"
						: "opacity-0 translate-y-2 pointer-events-none"
				}`}>
				{/* Custom Seekbar */}
				<div className="px-2 xs:px-3 sm:px-4 pb-1 xs:pb-2">
					<div
						className="relative w-full h-6 xs:h-8 sm:h-10 flex items-center cursor-pointer group"
						onClick={handleSeekbarClick}>
						{/* Background Track */}
						<div className="absolute w-full h-1 xs:h-1.5 sm:h-2 bg-white/30 rounded-full">
							{/* Buffer Progress */}
							<div
								className="h-full bg-white/50 rounded-full transition-all duration-300"
								style={{
									width: `${Math.min(bufferInfo.bufferedPercentage, 100)}%`,
								}}
							/>
							{/* Play Progress */}
							<div
								className="h-full bg-primary rounded-full absolute top-0 left-0 transition-all duration-100"
								style={{ width: `${Math.min(progressPercentage, 100)}%` }}
							/>
						</div>

						{/* Invisible clickable area for better touch targets */}
						<div className="absolute inset-0 z-10" />
					</div>
				</div>

				{/* Control Buttons */}
				<div className="flex items-center justify-between px-2 xs:px-3 sm:px-4 pb-2 xs:pb-3 sm:pb-4 gap-1 xs:gap-2">
					{/* Left Controls */}
					<div className="flex items-center gap-1 xs:gap-2 sm:gap-3 flex-1 min-w-0">
						<Button
							variant="ghost"
							size="sm"
							onClick={togglePlayPause}
							className="text-white hover:text-primary hover:bg-white/20 p-1 xs:p-1.5 sm:p-2 shrink-0">
							<Icon
								icon={isPlaying ? "solar:pause-bold" : "solar:play-bold"}
								className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6"
							/>
						</Button>

						{/* Skip buttons - Hidden on very small screens */}
						<Button
							variant="ghost"
							size="sm"
							onClick={() => skipTime(-10)}
							className="text-white hover:text-primary hover:bg-white/20 p-1 xs:p-1.5 sm:p-2 shrink-0 hidden xs:flex">
							<Icon
								icon="solar:rewind-10-seconds-back-bold"
								className="w-4 h-4 sm:w-5 sm:h-5"
							/>
						</Button>

						<Button
							variant="ghost"
							size="sm"
							onClick={() => skipTime(10)}
							className="text-white hover:text-primary hover:bg-white/20 p-1 xs:p-1.5 sm:p-2 shrink-0 hidden xs:flex">
							<Icon
								icon="solar:rewind-10-seconds-forward-bold"
								className="w-4 h-4 sm:w-5 sm:h-5"
							/>
						</Button>

						{/* Volume Controls */}
						<div className="flex items-center gap-1 xs:gap-2 shrink-0">
							<Button
								variant="ghost"
								size="sm"
								onClick={toggleMute}
								className="text-white hover:text-primary hover:bg-white/20 p-1 xs:p-1.5 sm:p-2">
								<Icon
									icon={
										isMuted || volume === 0
											? "solar:volume-cross-bold"
											: volume < 50
											? "solar:volume-small-bold"
											: "solar:volume-loud-bold"
									}
									className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6"
								/>
							</Button>

							{/* Volume Slider - Hidden on mobile */}
							<div className="w-12 sm:w-16 md:w-20 hidden sm:block">
								<Slider
									value={[isMuted ? 0 : volume]}
									max={100}
									step={1}
									onValueChange={handleVolumeChange}
									className="cursor-pointer [&_[role=slider]]:hidden [&_[role=slider]]:w-0 [&_[role=slider]]:h-0"
								/>
							</div>
						</div>

						{/* Time Display */}
						<div className="text-white text-xs xs:text-sm sm:text-base whitespace-nowrap min-w-0 overflow-hidden">
							<span className="hidden sm:inline">
								{formatDuration(currentTime)} / {formatDuration(duration || 0)}
							</span>
							<span className="sm:hidden">{formatTime(currentTime)}</span>
						</div>
					</div>

					{/* Right Controls */}
					<div className="flex items-center gap-1 xs:gap-2 sm:gap-3 shrink-0">
						{/* Playback Rate - Hidden on small screens */}
						<div className="hidden lg:block">
							<CustomDropdown
								options={[0.5, 1, 1.5, 2]}
								selectedOption={playbackRate + "X"}
								onSelect={handlePlaybackRateChange}
							/>
						</div>

						{/* Resolution - Hidden on very small screens */}
						<div className="hidden md:block">
							<CustomDropdown
								options={["Auto", ...resolutionList]}
								selectedOption={resolution}
								onSelect={(res) => {
									if (res !== resolution) setResolution(res);
								}}
							/>
						</div>

						{/* Picture in Picture - Hidden on mobile */}
						<Button
							variant="ghost"
							size="sm"
							onClick={() => videoRef.current?.requestPictureInPicture?.()}
							className="text-white hover:text-primary hover:bg-white/20 p-1 xs:p-1.5 sm:p-2 hidden sm:flex">
							<Icon icon="solar:pip-bold" className="w-4 h-4 sm:w-5 sm:h-5" />
						</Button>

						{/* Fullscreen */}
						<Button
							variant="ghost"
							size="sm"
							onClick={toggleFullscreen}
							className="text-white hover:text-primary hover:bg-white/20 p-1 xs:p-1.5 sm:p-2">
							<Icon
								icon={
									isFullscreen
										? "solar:quit-full-screen-bold"
										: "solar:full-screen-bold"
								}
								className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6"
							/>
						</Button>
					</div>
				</div>
			</div>

			{/* Video Title */}
			{videoData.title && showControls && (
				<div className="absolute top-2 xs:top-3 sm:top-4 left-2 xs:left-3 sm:left-4 right-2 xs:right-3 sm:right-4 pointer-events-none z-10">
					<div className="bg-black/40 backdrop-blur-sm rounded-lg p-2 xs:p-3 sm:p-4 max-w-max overflow-hidden">
						<h1 className="text-white text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-bold truncate">
							{videoData.title}
							{videoData.release_year && (
								<span className="text-white/80 text-xs xs:text-sm sm:text-base md:text-lg font-normal ml-1 sm:ml-2">
									({videoData.release_year})
								</span>
							)}
						</h1>
					</div>
				</div>
			)}

			{/* Mobile Touch Zones for Skip */}
			<div className="block sm:hidden">
				{/* Left skip zone */}
				<div
					className="absolute left-0 top-0 w-1/3 h-full flex items-center justify-start pl-4"
					onDoubleClick={() => skipTime(-10)}>
					{/* Visual feedback could go here */}
				</div>

				{/* Right skip zone */}
				<div
					className="absolute right-0 top-0 w-1/3 h-full flex items-center justify-end pr-4"
					onDoubleClick={() => skipTime(10)}>
					{/* Visual feedback could go here */}
				</div>
			</div>
		</div>
	);
}
