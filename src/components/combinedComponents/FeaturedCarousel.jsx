"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import Link from "next/link";

const FEATURED_CONTENT = [
	{
		id: 1,
		title: "The Dark Knight",
		type: "Movie",
		year: 2008,
		rating: "9.0",
		duration: "152 min",
		genre: ["Action", "Crime", "Drama"],
		description:
			"When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.",
		poster:
			"https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=500&h=750&fit=crop",
		backdrop:
			"https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1920&h=1080&fit=crop",
		featured: true,
		watchTime: "2h 32m",
	},
	{
		id: 2,
		title: "Stranger Things",
		type: "Series",
		year: 2016,
		rating: "8.7",
		duration: "4 Seasons",
		genre: ["Drama", "Fantasy", "Horror"],
		description:
			"When a young boy disappears, his mother, a police chief and his friends must confront terrifying supernatural forces in order to get him back.",
		poster:
			"https://images.unsplash.com/photo-1489599328109-619b9c888e24?w=500&h=750&fit=crop",
		backdrop:
			"https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1920&h=1080&fit=crop",
		featured: true,
		watchTime: "42min episodes",
	},
	{
		id: 3,
		title: "Avengers: Endgame",
		type: "Movie",
		year: 2019,
		rating: "8.4",
		duration: "181 min",
		genre: ["Action", "Adventure", "Drama"],
		description:
			"After the devastating events of Infinity War, the Avengers assemble once more to reverse Thanos' actions and restore balance to the universe.",
		poster:
			"https://images.unsplash.com/photo-1635805737707-575885ab0820?w=500&h=750&fit=crop",
		backdrop:
			"https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=1920&h=1080&fit=crop",
		featured: true,
		watchTime: "3h 1m",
	},
	{
		id: 4,
		title: "Breaking Bad",
		type: "Series",
		year: 2008,
		rating: "9.5",
		duration: "5 Seasons",
		genre: ["Crime", "Drama", "Thriller"],
		description:
			"A high school chemistry teacher diagnosed with inoperable lung cancer turns to manufacturing and selling methamphetamine to secure his family's future.",
		poster:
			"https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=500&h=750&fit=crop",
		backdrop:
			"https://images.unsplash.com/photo-1516649105817-4fda04590fd5?w=1920&h=1080&fit=crop",
		featured: true,
		watchTime: "47min episodes",
	},
];

export default function FeaturedCarousel() {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isAutoPlaying, setIsAutoPlaying] = useState(true);
	const autoPlayRef = useRef();

	const currentItem = FEATURED_CONTENT[currentIndex];

	// Auto-play functionality
	useEffect(() => {
		if (isAutoPlaying) {
			autoPlayRef.current = setInterval(() => {
				setCurrentIndex((prev) => (prev + 1) % FEATURED_CONTENT.length);
			}, 6000);
		}

		return () => {
			if (autoPlayRef.current) {
				clearInterval(autoPlayRef.current);
			}
		};
	}, [isAutoPlaying]);

	const goToSlide = (index) => {
		setCurrentIndex(index);
		setIsAutoPlaying(false);
		setTimeout(() => setIsAutoPlaying(true), 10000); // Resume auto-play after 10s
	};

	const nextSlide = () => {
		setCurrentIndex((prev) => (prev + 1) % FEATURED_CONTENT.length);
		setIsAutoPlaying(false);
		setTimeout(() => setIsAutoPlaying(true), 10000);
	};

	const prevSlide = () => {
		setCurrentIndex(
			(prev) => (prev - 1 + FEATURED_CONTENT.length) % FEATURED_CONTENT.length,
		);
		setIsAutoPlaying(false);
		setTimeout(() => setIsAutoPlaying(true), 10000);
	};

	return (
		<div className="relative w-full h-[70vh] md:h-[80vh] overflow-hidden bg-black">
			{/* Background Image with Overlay */}
			<div className="absolute inset-0">
				<img
					src={currentItem.backdrop}
					alt={currentItem.title}
					className="w-full h-full object-cover transition-all duration-1000 ease-in-out"
				/>
				<div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
				<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
			</div>

			{/* Content */}
			<div className="relative z-10 h-full flex items-center">
				<div className="container mx-auto px-6 lg:px-8">
					<div className="max-w-2xl">
						{/* Featured Badge */}
						<div className="flex items-center gap-3 mb-4">
							<Badge className="bg-primary text-black font-semibold px-3 py-1">
								<Icon icon="solar:crown-bold" className="w-4 h-4 mr-1" />
								Featured
							</Badge>
							<Badge variant="outline" className="border-white/30 text-white">
								{currentItem.type}
							</Badge>
							<Badge variant="outline" className="border-white/30 text-white">
								{currentItem.year}
							</Badge>
						</div>

						{/* Title */}
						<h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight">
							{currentItem.title}
						</h1>

						{/* Meta Info */}
						<div className="flex flex-wrap items-center gap-4 mb-6 text-white/80">
							<div className="flex items-center gap-1">
								<Icon
									icon="solar:star-bold"
									className="w-5 h-5 text-yellow-500"
								/>
								<span className="font-semibold">{currentItem.rating}</span>
							</div>
							<div className="flex items-center gap-1">
								<Icon icon="solar:clock-circle-bold" className="w-5 h-5" />
								<span>{currentItem.watchTime}</span>
							</div>
							<div className="flex gap-2">
								{currentItem.genre.slice(0, 3).map((genre) => (
									<span
										key={genre}
										className="px-2 py-1 bg-white/20 rounded text-sm">
										{genre}
									</span>
								))}
							</div>
						</div>

						{/* Description */}
						<p className="text-lg md:text-xl text-white/90 mb-8 leading-relaxed max-w-xl">
							{currentItem.description}
						</p>

						{/* Action Buttons */}
						<div className="flex flex-col sm:flex-row gap-4">
							<Link
								rel="preload"
								href={`/${currentItem.type.toLowerCase()}/${currentItem.id}`}>
								<Button
									size="lg"
									className="bg-primary hover:bg-primary/90 text-black font-semibold px-8 py-3 text-lg shadow-lg hover:shadow-emerald-500/25 transition-all duration-300">
									<Icon icon="solar:play-bold" className="w-6 h-6 mr-2" />
									{currentItem.type === "Movie"
										? "Watch Movie"
										: "Watch Series"}
								</Button>
							</Link>

							<Button
								variant="outline"
								size="lg"
								className="border-white/30 text-white hover:bg-white/10 px-8 py-3 text-lg">
								<Icon icon="solar:info-circle-bold" className="w-6 h-6 mr-2" />
								More Info
							</Button>

							<Button
								variant="ghost"
								size="lg"
								className="text-white hover:bg-white/10 px-4 py-3">
								<Icon icon="solar:bookmark-bold" className="w-6 h-6" />
							</Button>
						</div>
					</div>
				</div>
			</div>

			{/* Navigation Arrows */}
			<Button
				variant="ghost"
				size="lg"
				onClick={prevSlide}
				className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 text-white hover:bg-white/20 w-12 h-12 rounded-full">
				<Icon icon="solar:arrow-left-bold" className="w-6 h-6" />
			</Button>

			<Button
				variant="ghost"
				size="lg"
				onClick={nextSlide}
				className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 text-white hover:bg-white/20 w-12 h-12 rounded-full">
				<Icon icon="solar:arrow-right-bold" className="w-6 h-6" />
			</Button>

			{/* Dots Indicator */}
			<div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
				<div className="flex gap-3">
					{FEATURED_CONTENT.map((_, index) => (
						<button
							key={index}
							onClick={() => goToSlide(index)}
							className={`w-3 h-3 rounded-full transition-all duration-300 ${
								index === currentIndex
									? "bg-primary w-8"
									: "bg-white/50 hover:bg-white/80"
							}`}
						/>
					))}
				</div>
			</div>

			{/* Progress Bar */}
			<div className="absolute bottom-0 left-0 right-0 z-20">
				<div className="h-1 bg-white/20">
					<div
						className="h-full bg-primary transition-all duration-100 ease-linear"
						style={{
							width: isAutoPlaying
								? `${((currentIndex + 1) / FEATURED_CONTENT.length) * 100}%`
								: "0%",
						}}
					/>
				</div>
			</div>

			{/* Thumbnail Strip (Desktop) */}
			<div className="absolute bottom-20 right-8 hidden lg:block z-20">
				<div className="flex flex-col gap-2">
					{FEATURED_CONTENT.map((item, index) => (
						<button
							key={item.id}
							onClick={() => goToSlide(index)}
							className={`w-20 h-28 rounded-lg overflow-hidden transition-all duration-300 ${
								index === currentIndex
									? "ring-2 ring-primary scale-110"
									: "opacity-60 hover:opacity-100"
							}`}>
							<img
								src={item.poster}
								alt={item.title}
								className="w-full h-full object-cover"
							/>
						</button>
					))}
				</div>
			</div>

			{/* Auto-play Control */}
			<Button
				variant="ghost"
				size="sm"
				onClick={() => setIsAutoPlaying(!isAutoPlaying)}
				className="absolute top-4 right-4 z-20 text-white hover:bg-white/20">
				<Icon
					icon={isAutoPlaying ? "solar:pause-bold" : "solar:play-bold"}
					className="w-5 h-5"
				/>
			</Button>
		</div>
	);
}
