"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";

export default function PlayerPage() {
	const [isPlaying, setIsPlaying] = useState(false);
	const [progress, setProgress] = useState(0);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [volume, setVolume] = useState(0.75);
	const [isMuted, setIsMuted] = useState(false);
	const [isLiked, setIsLiked] = useState(false);
	const [showControls, setShowControls] = useState(true);
	const [showQualityMenu, setShowQualityMenu] = useState(false);
	const [currentQuality, setCurrentQuality] = useState("auto");
	const [networkSpeed, setNetworkSpeed] = useState(5); // Mbps
	const [bufferHealth, setBufferHealth] = useState(100); // percentage
	const [isBuffering, setIsBuffering] = useState(false);

	const videoRef = useRef(null);
	const progressRef = useRef(null);

	// Available video qualities
	const videoQualities = [
		{ label: "Auto", value: "auto", bitrate: "Variable" },
		{ label: "4K", value: "2160p", bitrate: "15 Mbps" },
		{ label: "1080p", value: "1080p", bitrate: "5 Mbps" },
		{ label: "720p", value: "720p", bitrate: "2.5 Mbps" },
		{ label: "480p", value: "480p", bitrate: "1 Mbps" },
		{ label: "360p", value: "360p", bitrate: "0.5 Mbps" },
	];

	// Sample video data
	const videoData = {
		title: "Amazing Nature Documentary",
		views: "1.4M views",
		uploadDate: "3 weeks ago",
		description:
			"Explore the wonders of nature in this captivating documentary showcasing Earth's most beautiful landscapes and wildlife.",
		channel: {
			name: "Nature Explorer",
			subscribers: "2.5M subscribers",
			avatar: "/placeholder-avatar.jpg",
		},
	};

	// Sample recommended videos
	const recommendedVideos = [
		{
			id: 1,
			title: "Deep Ocean Mysteries Revealed",
			thumbnail: "/thumbnail1.jpg",
			channel: "Ocean Explorers",
			views: "856K views",
			duration: "18:42",
		},
		{
			id: 2,
			title: "African Safari: Wildlife Up Close",
			thumbnail: "/thumbnail2.jpg",
			channel: "Wildlife Encounters",
			views: "1.2M views",
			duration: "24:15",
		},
		{
			id: 3,
			title: "Rainforest Canopies from Above",
			thumbnail: "/thumbnail3.jpg",
			channel: "Nature Explorer",
			views: "675K views",
			duration: "15:30",
		},
	];

	// ABR (Adaptive Bitrate Streaming) simulation
	useEffect(() => {
		if (currentQuality === "auto") {
			const intervalId = setInterval(() => {
				// Simulate fluctuating network conditions
				const newSpeed = 1 + Math.random() * 10; // Random speed between 1-11 Mbps
				setNetworkSpeed(parseFloat(newSpeed.toFixed(1)));

				// Adjust quality based on simulated network speed
				let newQuality;
				if (newSpeed >= 8) {
					newQuality = "2160p"; // 4K
					setBufferHealth(95 + Math.random() * 5);
				} else if (newSpeed >= 4) {
					newQuality = "1080p";
					setBufferHealth(85 + Math.random() * 10);
				} else if (newSpeed >= 2) {
					newQuality = "720p";
					setBufferHealth(75 + Math.random() * 15);
				} else if (newSpeed >= 1) {
					newQuality = "480p";
					setBufferHealth(60 + Math.random() * 20);
				} else {
					newQuality = "360p";
					setBufferHealth(30 + Math.random() * 30);
				}

				// Simulate buffering when network speed is low
				if (newSpeed < 1.5) {
					setIsBuffering(Math.random() > 0.7);
				} else {
					setIsBuffering(false);
				}

				// Update current auto-selected quality
				setCurrentQuality((prevQuality) =>
					prevQuality === "auto" ? newQuality : prevQuality,
				);
			}, 5000);

			return () => clearInterval(intervalId);
		}
	}, [currentQuality]);

	const handlePlayPause = () => {
		if (isPlaying) {
			videoRef.current.pause();
		} else {
			videoRef.current.play();
		}
		setIsPlaying(!isPlaying);
	};

	const handleTimeUpdate = () => {
		const currentTime = videoRef.current.currentTime;
		const duration = videoRef.current.duration;
		const progressPercent = (currentTime / duration) * 100;
		setProgress(progressPercent);
		setCurrentTime(currentTime);
	};

	const handleVolumeChange = (e) => {
		const value = e.target.value;
		setVolume(value);
		videoRef.current.volume = value;
		if (value > 0 && isMuted) {
			setIsMuted(false);
			videoRef.current.muted = false;
		}
	};

	const handleMuteToggle = () => {
		setIsMuted(!isMuted);
		videoRef.current.muted = !isMuted;
	};

	const handleProgressClick = (e) => {
		const progressBar = progressRef.current;
		const position =
			(e.pageX - progressBar.getBoundingClientRect().left) /
			progressBar.offsetWidth;
		const newTime = position * videoRef.current.duration;
		videoRef.current.currentTime = newTime;
		setProgress(position * 100);
	};

	const handleLoadedMetadata = () => {
		setDuration(videoRef.current.duration);
	};

	const handleFullscreen = () => {
		if (videoRef.current) {
			if (videoRef.current.requestFullscreen) {
				videoRef.current.requestFullscreen();
			} else if (videoRef.current.webkitRequestFullscreen) {
				videoRef.current.webkitRequestFullscreen();
			} else if (videoRef.current.msRequestFullscreen) {
				videoRef.current.msRequestFullscreen();
			}
		}
	};

	const formatTime = (seconds) => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs < 10 ? "0" + secs : secs}`;
	};

	const handleQualityChange = (quality) => {
		setCurrentQuality(quality);
		setShowQualityMenu(false);

		// In a real implementation, you would switch the video source here
		// For this example, we're just updating the state
	};

	// Hide controls after inactivity
	useEffect(() => {
		let timeout;
		const handleMouseMove = () => {
			setShowControls(true);
			clearTimeout(timeout);
			timeout = setTimeout(() => {
				if (isPlaying) {
					setShowControls(false);
				}
			}, 3000);
		};

		document.addEventListener("mousemove", handleMouseMove);
		return () => {
			document.removeEventListener("mousemove", handleMouseMove);
			clearTimeout(timeout);
		};
	}, [isPlaying]);

	return (
		<div className="min-h-screen bg-black text-white">
			{/* Player Section */}
			<div className="relative w-full aspect-video max-h-[85vh] bg-black">
				<div
					className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
					onClick={handlePlayPause}>
					<video
						ref={videoRef}
						className="w-full h-full"
						onTimeUpdate={handleTimeUpdate}
						onLoadedMetadata={handleLoadedMetadata}
						onEnded={() => setIsPlaying(false)}
						src="/sample-video.mp4"
					/>

					{/* Big play button overlay */}
					{!isPlaying && (
						<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
							<button
								className="w-20 h-20 rounded-full bg-red-600 bg-opacity-80 flex items-center justify-center transform transition-transform hover:scale-110"
								onClick={handlePlayPause}>
								<Icon icon="mdi:play" className="text-white text-4xl ml-1" />
							</button>
						</div>
					)}

					{/* Buffering indicator */}
					{isBuffering && (
						<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60">
							<div className="flex flex-col items-center space-y-4">
								<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
								<div className="text-sm">
									Buffering... ({networkSpeed.toFixed(1)} Mbps)
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Netflix-style Video Controls */}
				<div
					className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent pt-20 pb-6 px-6 transition-opacity duration-300 ${
						showControls ? "opacity-100" : "opacity-0"
					}`}>
					{/* Progress Bar */}
					<div
						ref={progressRef}
						className="w-full h-1.5 bg-gray-600 rounded-full cursor-pointer mb-4 group relative"
						onClick={handleProgressClick}>
						<div
							className="h-full bg-red-600 rounded-full"
							style={{ width: `${progress}%` }}
						/>
						<div
							className="absolute h-3.5 w-3.5 bg-red-600 rounded-full -mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
							style={{ left: `${progress}%`, transform: "translateX(-50%)" }}
						/>
					</div>

					<div className="flex items-center justify-between">
						<div className="flex items-center space-x-4">
							<button
								onClick={handlePlayPause}
								className="text-white focus:outline-none">
								<Icon
									icon={isPlaying ? "mdi:pause" : "mdi:play"}
									className="text-2xl"
								/>
							</button>

							<button className="text-white focus:outline-none hidden md:block">
								<Icon icon="mdi:skip-previous" className="text-xl" />
							</button>

							<button className="text-white focus:outline-none hidden md:block">
								<Icon icon="mdi:skip-next" className="text-xl" />
							</button>

							<div className="flex items-center space-x-2">
								<button
									onClick={handleMuteToggle}
									className="text-white focus:outline-none">
									<Icon
										icon={
											isMuted
												? "mdi:volume-off"
												: volume < 0.3
												? "mdi:volume-low"
												: volume < 0.7
												? "mdi:volume-medium"
												: "mdi:volume-high"
										}
										className="text-xl"
									/>
								</button>
								<input
									type="range"
									min="0"
									max="1"
									step="0.01"
									value={volume}
									onChange={handleVolumeChange}
									className="w-20 h-1 bg-gray-600 rounded-full appearance-none cursor-pointer"
								/>
							</div>

							<span className="text-sm text-gray-300">
								{formatTime(currentTime)} / {formatTime(duration)}
							</span>
						</div>

						<div className="flex items-center space-x-4">
							{/* Quality selector */}
							<div className="relative">
								<button
									className="flex items-center text-sm text-gray-300 hover:text-white"
									onClick={() => setShowQualityMenu(!showQualityMenu)}>
									<span className="hidden sm:inline-block mr-1">
										{currentQuality === "auto" ? "Auto" : currentQuality}
									</span>
									<Icon icon="mdi:quality-high" className="text-xl" />
									{networkSpeed.toFixed(1)} Mbps
								</button>

								{showQualityMenu && (
									<div className="absolute bottom-full right-0 mb-2 bg-gray-900 rounded shadow-lg py-2 w-40 z-50">
										{videoQualities.map((quality) => (
											<button
												key={quality.value}
												onClick={() => handleQualityChange(quality.value)}
												className={`w-full text-left px-4 py-1.5 hover:bg-gray-800 text-sm flex items-center justify-between ${
													currentQuality === quality.value ||
													(currentQuality !== "auto" &&
														quality.value === currentQuality)
														? "text-red-600"
														: "text-white"
												}`}>
												<span>{quality.label}</span>
												<span className="text-xs text-gray-400">
													{quality.bitrate}
												</span>
											</button>
										))}
									</div>
								)}
							</div>

							{/* Buffer health indicator */}
							<div className="hidden md:flex items-center bg-gray-800 rounded px-2 py-0.5">
								<div className="w-16 h-1.5 bg-gray-600 rounded-full mr-1">
									<div
										className={`h-full rounded-full ${
											bufferHealth > 75
												? "bg-green-500"
												: bufferHealth > 40
												? "bg-yellow-500"
												: "bg-red-500"
										}`}
										style={{ width: `${bufferHealth}%` }}
									/>
								</div>
								<span className="text-xs">{Math.round(bufferHealth)}%</span>
							</div>

							<button
								onClick={handleFullscreen}
								className="text-white focus:outline-none">
								<Icon icon="mdi:fullscreen" className="text-xl" />
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* Video Info and Actions */}
			<div className="max-w-7xl mx-auto px-4 py-8">
				<div className="flex flex-col md:flex-row">
					{/* Main Content */}
					<div className="md:w-2/3 md:pr-8">
						<h1 className="text-3xl font-bold mb-3">{videoData.title}</h1>
						<div className="flex items-center justify-between py-3 border-b border-zinc-800">
							<div className="text-zinc-400 text-sm">
								{videoData.views} • {videoData.uploadDate}
							</div>
							<div className="flex items-center space-x-8">
								<button
									onClick={() => setIsLiked(!isLiked)}
									className="flex items-center space-x-2 focus:outline-none group">
									<Icon
										icon={isLiked ? "mdi:thumb-up" : "mdi:thumb-up-outline"}
										className={`text-2xl transition-colors ${
											isLiked
												? "text-red-600"
												: "text-white group-hover:text-gray-300"
										}`}
									/>
									<span className="hidden sm:inline">Like</span>
								</button>
								<button className="flex items-center space-x-2 focus:outline-none group">
									<Icon
										icon="mdi:share-variant"
										className="text-2xl text-white group-hover:text-gray-300"
									/>
									<span className="hidden sm:inline">Share</span>
								</button>
								<button className="flex items-center space-x-2 focus:outline-none group">
									<Icon
										icon="mdi:playlist-plus"
										className="text-2xl text-white group-hover:text-gray-300"
									/>
									<span className="hidden sm:inline">Save</span>
								</button>
							</div>
						</div>

						{/* Channel Info */}
						<div className="flex items-center justify-between py-5 border-b border-zinc-800">
							<div className="flex items-center space-x-4">
								<div className="w-12 h-12 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
									<div className="w-full h-full bg-gray-700 flex items-center justify-center">
										<span className="text-lg font-bold">
											{videoData.channel.name.charAt(0)}
										</span>
									</div>
								</div>
								<div>
									<h3 className="font-medium text-lg">
										{videoData.channel.name}
									</h3>
									<p className="text-sm text-zinc-400">
										{videoData.channel.subscribers}
									</p>
								</div>
							</div>
							<button className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-sm font-medium transition-colors">
								Subscribe
							</button>
						</div>

						{/* Video Description */}
						<div className="py-5 text-sm text-zinc-300 border-b border-zinc-800">
							<p className="line-clamp-3">{videoData.description}</p>
							<button className="mt-2 text-zinc-400 hover:text-white transition-colors font-medium">
								Read more
							</button>
						</div>

						{/* Comments Section */}
						<div className="mt-6">
							<h3 className="text-xl font-bold mb-5 flex items-center">
								<Icon icon="mdi:comment-multiple" className="mr-2" />
								Comments
							</h3>
							<div className="flex items-start space-x-3">
								<div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex-shrink-0">
									<div className="w-full h-full bg-gray-700"></div>
								</div>
								<div className="flex-1">
									<input
										type="text"
										placeholder="Add a comment..."
										className="w-full bg-transparent border-b border-zinc-700 pb-2 focus:outline-none focus:border-red-500 transition-colors"
									/>
								</div>
							</div>
						</div>
					</div>

					{/* Sidebar / Recommended */}
					<div className="md:w-1/3 mt-8 md:mt-0 md:border-l md:border-zinc-800 md:pl-6">
						<h3 className="text-xl font-bold mb-5 flex items-center">
							<Icon icon="mdi:movie-open-play" className="mr-2" />
							Recommended
						</h3>
						<div className="space-y-4">
							{recommendedVideos.map((video) => (
								<div
									key={video.id}
									className="flex space-x-3 cursor-pointer hover:bg-zinc-900 p-2 rounded transition-colors">
									<div className="w-40 h-24 relative bg-zinc-800 rounded overflow-hidden flex-shrink-0">
										<div className="absolute inset-0 flex items-center justify-center">
											<Icon
												icon="mdi:play-circle"
												className="text-4xl text-white opacity-0 group-hover:opacity-100 transition-opacity"
											/>
										</div>
										<div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 text-xs rounded">
											{video.duration}
										</div>
									</div>
									<div className="flex-1">
										<h4 className="font-medium text-sm line-clamp-2 mb-1">
											{video.title}
										</h4>
										<p className="text-zinc-400 text-xs mb-1">
											{video.channel}
										</p>
										<p className="text-zinc-400 text-xs flex items-center">
											<Icon icon="mdi:eye" className="mr-1 text-sm" />
											{video.views}
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
