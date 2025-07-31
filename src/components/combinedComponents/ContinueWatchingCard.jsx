"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { removeFromContinueWatching } from "@/lib/helper";
import { toast } from "sonner";

const ContinueWatchingCard = ({ video, onClick, onRemoveFromHistory }) => {
	const [isHovered, setIsHovered] = useState(false);
	const [imageLoaded, setImageLoaded] = useState(false);
	const [removeLoading, setRemoveLoading] = useState(false);

	// Handle remove click
	const handleRemove = async (e) => {
		e.stopPropagation(); // Prevent triggering the card onClick
		setRemoveLoading(true);
		try {
			const res = await removeFromContinueWatching(video.id);
			if (res.status === 200) {
				toast.success("Removed from continue watching");
				if (onRemoveFromHistory) {
					onRemoveFromHistory(video.id);
				}
				// Optionally, you can show a success message or toast here
			} else {
				console.error("Failed to remove from watchlist:", res.message);
			}
		} catch {
			console.error("Failed to remove from watchlist");
		}
		setRemoveLoading(false);
	};

	return (
		<div className={`group cursor-pointer w-80 flex-shrink-0`}>
			<Card
				className="bg-transparent border-none shadow-none overflow-hidden transition-all duration-300 transform group-hover:scale-[1.02]"
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
				onClick={onClick}>
				<CardContent className="p-0 relative">
					{/* Main Card Container */}
					<div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
						{/* Background Image */}
						<Image
							src={video.backdrop}
							alt={video.title}
							fill
							sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
							className={`object-cover transition-all duration-500 ${
								imageLoaded ? "opacity-100" : "opacity-0"
							} ${isHovered ? "scale-110" : "scale-100"}`}
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

						{/* Gradient Overlay */}
						<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

						{/* Remove button - top right */}
						{onRemoveFromHistory && (
							<div
								className={`absolute top-3 right-3 z-20 transition-all duration-300 ${
									isHovered ? "opacity-100 scale-100" : "opacity-0 scale-75"
								}`}>
								<Button
									size="sm"
									variant="destructive"
									onClick={handleRemove}
									disabled={removeLoading}
									className="w-8 h-8 p-0 rounded-full bg-red-600/90 hover:bg-red-600 backdrop-blur-sm border border-white/20"
									isLoading={removeLoading}
									loadingText={
										<Icon
											icon="eos-icons:bubble-loading"
											className="w-4 h-4 text-white"
										/>
									}>
									<Icon icon="ic:round-delete" width="4em" height="4em" />
								</Button>
							</div>
						)}

						{/* Play button - center */}
						<div
							className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
								isHovered ? "opacity-100" : "opacity-0"
							}`}>
							<Icon icon="solar:play-bold" className="w-8 h-8 text-primary" />
						</div>

						{/* Progress bar */}
						<div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/50">
							<div
								className="h-full bg-primary transition-all duration-300"
								style={{ width: `${video.progress || 0}%` }}
							/>
						</div>

						{/* Content overlay - bottom section */}
						<div className="absolute bottom-0 left-0 right-0 p-4 text-white h-full flex flex-col justify-between">
							{/* Title */}
							<h2 className="text-lg font-bold mb-2 line-clamp-2 leading-tight drop-shadow-lg">
								{video.title}
							</h2>

							{/* Time left */}
							{video.timeLeft && video.timeLeft !== "Finished" && (
								<div className="text-sm text-white/80">{video.timeLeft}</div>
							)}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default ContinueWatchingCard;
