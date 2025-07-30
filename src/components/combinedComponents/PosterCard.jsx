"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useRouter, usePathname } from "next/navigation";
import { addToWatchList, removeFromWatchList } from "@/lib/helper";
import { toast } from "sonner";

export default function PosterCard({ video, onClick, onRemoveFromWatchlist }) {
	const [isHovered, setIsHovered] = useState(false);
	const [isImageLoading, setIsImageLoading] = useState(true);
	const [isWatchlisted, setIsWatchlisted] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const { theme } = useTheme();
	const router = useRouter();
	const pathname = usePathname();

	useEffect(() => {
		// Check if video exists in watchlist
		if (video.exists_in_watchlist) {
			setIsWatchlisted(true);
		}
	}, [video.exists_in_watchlist]);

	const handleWatchlistToggle = async (e) => {
		e.preventDefault();
		e.stopPropagation();
		setIsLoading(true);
		try {
			if (isWatchlisted) {
				// Remove from watchlist
				await removeFromWatchList(video.id);
				setIsWatchlisted(false);
				toast.success("Removed from watchlist");
				console.log("Removed from watchlist:", pathname);
				if (onRemoveFromWatchlist) {
					onRemoveFromWatchlist(video.id);
				}
			} else {
				// Add to watchlist
				await addToWatchList(video.id);
				setIsWatchlisted(true);
				toast.success("Added to watchlist");
			}
		} catch (error) {
			console.error("Error toggling watchlist:", error);
			toast.error("Failed to update watchlist");
		}

		setIsLoading(false);
	};

	const handlePlay = (e) => {
		e.preventDefault();
		e.stopPropagation();
		router.push(`/video/watch/${video.id}`);
	};

	// Handle card click - only navigate to info page when clicking on non-interactive areas
	const handleCardClick = (e) => {
		// Check if the click target is a button or inside a button
		const target = e.target;
		const isButton = target.closest("button");

		if (!isButton) {
			// Only call onClick if it's not a button click
			if (onClick) {
				onClick(video);
			} else {
				// Default behavior - navigate to info page
				router.push(`/video/${video.slug}`);
			}
		}
	};

	return (
		<div
			className="group flex-shrink-0 cursor-pointer transition-all duration-500 hover:scale-105"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			onClick={handleCardClick}>
			<div className="relative w-52 h-80 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500">
				{/* Loading Skeleton */}
				{isImageLoading && (
					<div
						className={`absolute inset-0 animate-pulse ${
							theme === "dark" ? "bg-slate-800" : "bg-gray-200"
						}`}>
						<div className="flex items-center justify-center h-full">
							<Icon
								icon="solar:video-library-bold-duotone"
								className="w-12 h-12 text-muted-foreground"
							/>
						</div>
					</div>
				)}

				{/* Poster Image */}
				<Image
					src={video.poster || "/placeholder.png"}
					alt={video.title || "Video Poster"}
					fill
					className={`object-cover transition-transform duration-500 group-hover:scale-110 ${
						isImageLoading ? "opacity-0" : "opacity-100"
					}`}
					onLoad={() => setIsImageLoading(false)}
					sizes="208px"
				/>

				{/* Top Badges */}
				<div className="absolute top-3 left-3 flex flex-col gap-2 pointer-events-none">
					{video.isNew && (
						<Badge className="bg-red-600 text-white text-xs px-2 py-1 font-semibold">
							NEW
						</Badge>
					)}
					{video.resolutions && (
						<Badge className="bg-black/60 text-white text-xs px-2 py-1 backdrop-blur-sm">
							{video.resolutions[video.resolutions.length - 1]}
						</Badge>
					)}
				</div>

				{/* Gradient Overlay */}
				<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

				{/* Hover Content */}
				<div className="absolute inset-0 flex flex-col-reverse justify-between p-4 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none group-hover:pointer-events-auto">
					{/* Bottom Content */}
					<div className="space-y-3">
						{/* Title */}
						<h3 className="text-white font-bold text-lg leading-tight line-clamp-2 pointer-events-none">
							{video.title}
						</h3>

						{/* Action Buttons */}
						<div className="flex gap-2 pointer-events-auto">
							<Button
								size="sm"
								className="bg-gradient-to-r from-primary to-green-600 hover:from-primary/90 hover:to-green-600/90 text-white px-4 py-2 rounded-full flex-1"
								onClick={handlePlay}>
								<Icon icon="solar:play-bold" className="w-4 h-4 mr-1" />
								Play
							</Button>

							<Button
								size="sm"
								variant="outline"
								onClick={handleWatchlistToggle}
								isLoading={isLoading}
								loadingText={
									<Icon
										icon="eos-icons:bubble-loading"
										width="2em"
										height="2em"
									/>
								}>
								{isWatchlisted === true ? (
									<Icon icon="solar:bookmark-bold" className="w-4 h-4" />
								) : (
									<Icon
										icon="hugeicons:bookmark-add-02"
										width="4em"
										height="4em"
									/>
								)}
							</Button>
						</div>
					</div>
				</div>

				{/* Glow Effect */}
				<div className="absolute inset-0 rounded-xl ring-0 group-hover:ring-2 group-hover:ring-primary/50 transition-all duration-300 pointer-events-none" />
			</div>
		</div>
	);
}
