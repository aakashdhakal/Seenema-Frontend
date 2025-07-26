"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import Image from "next/image";

const ContinueWatchingCard = ({
	video,
	onClick,
	onRemove,
	className = "",
	...props
}) => {
	const [isHovered, setIsHovered] = useState(false);
	const [imageLoaded, setImageLoaded] = useState(false);

	// Format time remaining
	const formatTimeRemaining = (seconds) => {
		if (!seconds) return "Finished";
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);

		if (hours > 0) {
			return `${hours}h ${minutes}m left`;
		}
		return `${minutes}m left`;
	};

	// Format last watched date
	const formatLastWatched = (dateString) => {
		if (!dateString) return "Recently";
		const date = new Date(dateString);
		const now = new Date();
		const diffInHours = (now - date) / (1000 * 60 * 60);

		if (diffInHours < 1) {
			return "Just now";
		} else if (diffInHours < 24) {
			const hours = Math.floor(diffInHours);
			return `${hours}h ago`;
		} else if (diffInHours < 48) {
			return "Yesterday";
		} else {
			const days = Math.floor(diffInHours / 24);
			return `${days}d ago`;
		}
	};

	console.log("ContinueWatchingCard video:", video);

	return (
		<div
			className={`group cursor-pointer w-80 flex flex-col gap-4 m-0 p-0 h-full ${className}`}
			{...props}>
			<Card
				className="bg-transparent border-none shadow-none overflow-hidden transition-all p-0 duration-300 "
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				onClick={onClick}>
				<CardContent className="p-0">
					{/* Main Card Image */}
					<div className="relative aspect-video rounded-md overflow-hidden bg-muted">
						<Image
							src={video.backdrop}
							alt={video.title}
							fill
							className={`object-cover transition-all duration-500 ${
								(imageLoaded ? "opacity-100" : "opacity-0",
								isHovered ? "scale-110" : "scale-100")
							}`}
							onLoad={() => setImageLoaded(true)}
						/>

						{/* Loading placeholder */}
						{!imageLoaded && (
							<div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
								<Icon
									icon="solar:video-library-bold-duotone"
									className="w-12 h-12 text-muted-foreground"
								/>
							</div>
						)}

						{/* Progress bar at the bottom */}
						<div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/50">
							<div
								className="h-full bg-primary transition-all duration-300"
								style={{ width: `${video.progress || 0}%` }}
							/>
						</div>

						{/* Play icon overlay - shows on hover */}
						{isHovered && (
							<div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-all duration-300">
								<Icon icon="solar:play-bold" className="w-8 h-8 text-primary" />
							</div>
						)}
					</div>
				</CardContent>
			</Card>

			{/* Title below the card (always visible) */}
			<div className="flex flex-col gap-2">
				<h2 className="text-xl font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-200">
					{video.title}
				</h2>

				<div className="flex flex-col items-start justify-between mt-1 text-s text-muted-foreground">
					<span>{video.progress || 0}% watched</span>
					<span>{formatLastWatched(video.lastWatched)}</span>
				</div>
			</div>
		</div>
	);
};

export default ContinueWatchingCard;
