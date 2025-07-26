"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import PosterCard from "./PosterCard";
import ContinueWatchingCard from "./ContinueWatchingCard";

export default function MovieRow({
	title,
	movies,
	onMovieClick,
	onRemove,
	type = "poster", // "poster" or "continue-watching"
	className = "",
}) {
	const scrollRef = useRef(null);

	// Scroll function
	const scrollContainer = (direction) => {
		if (scrollRef.current) {
			const scrollAmount = 400;
			const scrollLeft = direction === "left" ? -scrollAmount : scrollAmount;
			scrollRef.current.scrollBy({ left: scrollLeft, behavior: "smooth" });
		}
	};

	if (!movies || movies.length === 0) {
		return null;
	}

	return (
		<div className={`mb-16 ${className}`}>
			<div className="container mx-auto px-6 relative">
				<div className="flex items-center justify-between mb-8">
					<h2 className="text-3xl font-bold flex items-center gap-5 text-foreground">
						{title}
						<div className="w-12 h-1 bg-gradient-to-r from-primary to-primary/60 rounded-full"></div>
					</h2>
					{type !== "continue-watching" && (
						<div className="flex items-center gap-2 z-50">
							<Button
								variant="outline"
								size="sm"
								onClick={() => scrollContainer("left")}
								className=" absolute left-[-25] top-52">
								<Icon icon="solar:arrow-left-bold" className="w-4 h-4" />
							</Button>
							<Button
								variant="outline"
								size="sm"
								onClick={() => scrollContainer("right")}
								className="absolute right-[-25] top-52">
								<Icon icon="solar:arrow-right-bold" className="w-4 h-4" />
							</Button>
						</div>
					)}
					<Button
						variant="ghost"
						className="text-primary hover:text-primary/80 hover:bg-primary/10 ml-2">
						<span className="mr-2">View All</span>
						<Icon icon="solar:arrow-right-bold" className="w-4 h-4" />
					</Button>
				</div>

				<div
					ref={scrollRef}
					className="flex gap-6 overflow-x-auto scrollbar-hide pb-6"
					style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
					{movies.map((movie) => (
						<div key={movie.id}>
							{type === "continue-watching" ? (
								<ContinueWatchingCard
									video={movie}
									onClick={() => onMovieClick(movie)}
									onRemove={() => onRemove && onRemove(movie.watchHistoryId)}
								/>
							) : (
								<PosterCard video={movie} onClick={() => onMovieClick(movie)} />
							)}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
