"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Navbar from "@/components/combinedComponents/Navbar";
import PageLoadingComponent from "@/components/combinedComponents/PageLoadingComponent";
import { useAuthContext } from "@/context/AuthContext";
import axios from "@/lib/axios";
import {
	checkIfVideoInWatchList,
	addToWatchList,
	removeFromWatchList,
} from "@/lib/helper";
import { toast } from "sonner";

export default function VideoDetailsPage() {
	const { slug } = useParams();
	const router = useRouter();
	const { user, isLoading: authLoading } = useAuthContext();
	const [mounted, setMounted] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [videoData, setVideoData] = useState(null);
	const [error, setError] = useState(null);
	const [isWatchlisted, setIsWatchlisted] = useState(false);
	const [watchlistLoading, setWatchlistLoading] = useState(false);

	// Helper functions
	const formatDuration = (seconds) => {
		if (!seconds) return "Unknown";
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
	};

	const getQualityFromResolutions = (resolutions) => {
		if (!resolutions?.length) return "HD";
		if (resolutions.includes("1080p")) return "4K";
		if (resolutions.includes("720p")) return "HD";
		return "SD";
	};

	// Check watchlist status
	const checkWatchlistStatus = async (videoId) => {
		try {
			const result = await checkIfVideoInWatchList(videoId);
			setIsWatchlisted(result.exists);
		} catch (error) {
			console.error("Error checking watchlist status:", error);
		}
	};

	// Handle watchlist toggle
	const handleWatchlistToggle = async () => {
		if (!videoData?.id) return;

		setWatchlistLoading(true);
		try {
			if (isWatchlisted) {
				const response = await removeFromWatchList(videoData.id);
				if (response.success) {
					setIsWatchlisted(false);
					toast.success("Removed from watchlist");
				} else {
					toast.error("Failed to remove from watchlist");
				}
			} else {
				const response = await addToWatchList(videoData.id);
				if (response.success) {
					setIsWatchlisted(true);
					toast.success("Added to watchlist");
				} else {
					toast.error("Failed to add to watchlist");
				}
			}
		} catch (error) {
			toast.error("Something went wrong");
		} finally {
			setWatchlistLoading(false);
		}
	};

	useEffect(() => {
		setMounted(true);
	}, []);

	// Auth check
	useEffect(() => {
		if (!authLoading && !user) {
			router.replace("/login");
		}
	}, [user, authLoading, router]);

	// Fetch video data
	useEffect(() => {
		const fetchVideoData = async () => {
			if (!slug || !user) return;

			try {
				setIsLoading(true);
				setError(null);

				const response = await axios.get(`/video/${slug}`);
				const videoInfo = response.data;

				const transformedData = {
					id: videoInfo.id,
					title: videoInfo.title,
					year: videoInfo.release_year,
					rating: videoInfo.rating || null,
					duration: formatDuration(videoInfo.duration),
					genres: videoInfo.genres?.map((g) => g.name) || [],
					tags: videoInfo.tags?.map((t) => t.name) || [],
					maturityRating: videoInfo.content_rating || "NR",
					description: videoInfo.description || "No description available.",
					cast: videoInfo.people || [],
					backdrop: videoInfo.backdrop_path,
					poster: videoInfo.thumbnail_path,
					language: videoInfo.language || "Unknown",
					resolutions: videoInfo.resolutions || [],
					quality: getQualityFromResolutions(videoInfo.resolutions),
					slug: videoInfo.slug,
				};

				setVideoData(transformedData);
				// Check watchlist status after setting video data
				await checkWatchlistStatus(transformedData.id);
			} catch (err) {
				console.error("Error fetching video data:", err);
				setError(
					err.response?.status === 404
						? "Video not found"
						: "Failed to load video details",
				);
			} finally {
				setIsLoading(false);
			}
		};

		fetchVideoData();
	}, [slug, user]);

	// Loading states
	if (authLoading || !user || !mounted || isLoading) {
		return <PageLoadingComponent />;
	}

	// Error state
	if (error) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center p-4">
				<div className="text-center max-w-md">
					<Icon
						icon="solar:video-library-bold-duotone"
						className="w-20 h-20 text-primary mx-auto mb-4"
					/>
					<h1 className="text-xl font-bold mb-2 text-foreground">
						{error === "Video not found"
							? "Video Not Found"
							: "Error Loading Video"}
					</h1>
					<p className="mb-6 text-muted-foreground text-sm">
						{error === "Video not found"
							? "The video you're looking for doesn't exist."
							: error}
					</p>
					<div className="flex flex-col sm:flex-row gap-3 justify-center">
						<Button
							onClick={() => router.push("/home")}
							className="w-full sm:w-auto">
							<Icon icon="solar:arrow-left-bold" className="w-4 h-4 mr-2" />
							Go Home
						</Button>
						{error !== "Video not found" && (
							<Button
								variant="outline"
								onClick={() => window.location.reload()}
								className="w-full sm:w-auto">
								<Icon icon="solar:refresh-bold" className="w-4 h-4 mr-2" />
								Try Again
							</Button>
						)}
					</div>
				</div>
			</div>
		);
	}

	if (!videoData) return <PageLoadingComponent />;

	return (
		<div className="min-h-screen bg-background">
			<Navbar />

			{/* Hero Section */}
			<section className="relative ">
				<div className="relative h-[50vh] sm:h-[60vh] lg:h-[70vh] overflow-hidden">
					{/* Backdrop */}
					<div
						className="absolute inset-0 bg-cover bg-center"
						style={{ backgroundImage: `url(${videoData.backdrop})` }}>
						<div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-background/20" />
						<div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
					</div>

					{/* Hero Content */}
					<div className="absolute inset-0 flex items-end">
						<div className="container mx-auto px-4 pb-8">
							<div className="flex flex-col sm:flex-row items-start sm:items-end gap-6">
								{/* Poster */}
								<div className="flex-shrink-0">
									<div className="relative w-32 h-48 sm:w-40 sm:h-60 lg:w-56 lg:h-84 rounded-lg overflow-hidden shadow-2xl">
										<Image
											src={videoData.poster}
											alt={videoData.title}
											fill
											className="object-cover"
											priority
										/>
									</div>
								</div>

								{/* Title and Info */}
								<div className="flex-1 min-w-0">
									<h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold mb-3 text-white drop-shadow-lg line-clamp-2">
										{videoData.title}
									</h1>

									{/* Metadata */}
									<div className="flex flex-wrap items-center gap-2 mb-4">
										{videoData.rating && (
											<div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full text-xs">
												<Icon
													icon="solar:star-bold"
													className="w-3 h-3 text-yellow-400"
												/>
												<span className="text-white font-medium">
													{videoData.rating}
												</span>
											</div>
										)}
										<Badge variant="secondary" className="text-xs">
											{videoData.year}
										</Badge>
										<Badge
											variant="outline"
											className="text-xs bg-white/10 border-white/30 text-white">
											{videoData.duration}
										</Badge>
										<Badge className="text-xs bg-red-600">
											{videoData.maturityRating}
										</Badge>
										<Badge className="text-xs bg-green-600">
											{videoData.quality}
										</Badge>
									</div>

									{/* Action Buttons */}
									<div className="flex flex-wrap gap-3">
										<Button
											size="lg"
											className="bg-primary hover:bg-primary/90 px-6 py-2.5 font-semibold"
											onClick={() =>
												router.push(`/video/watch/${videoData.id}`)
											}>
											<Icon icon="solar:play-bold" className="w-5 h-5 mr-2" />
											Watch Now
										</Button>
										<Button
											variant="outline"
											size="lg"
											onClick={handleWatchlistToggle}
											disabled={watchlistLoading}>
											{watchlistLoading ? (
												<Icon
													icon="eos-icons:bubble-loading"
													className="w-5 h-5"
												/>
											) : (
												<Icon
													icon={
														isWatchlisted
															? "solar:bookmark-bold"
															: "solar:bookmark-linear"
													}
													className="w-5 h-5"
												/>
											)}
										</Button>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Main Content */}
			<section className="py-8 lg:py-12">
				<div className="container mx-auto px-4">
					<div className="grid lg:grid-cols-3 gap-8">
						{/* Main Content */}
						<div className="lg:col-span-2 space-y-8">
							{/* Description */}
							<div>
								<h2 className="text-xl lg:text-2xl font-bold mb-4 flex items-center">
									<Icon
										icon="solar:document-text-bold"
										className="w-5 h-5 mr-2 text-primary"
									/>
									Synopsis
								</h2>
								<p className="text-muted-foreground leading-relaxed">
									{videoData.description}
								</p>
							</div>

							{/* Genres and Tags */}
							{(videoData.genres.length > 0 || videoData.tags.length > 0) && (
								<div className="grid sm:grid-cols-2 gap-6">
									{videoData.genres.length > 0 && (
										<div>
											<h3 className="text-lg font-semibold mb-3 flex items-center">
												<Icon
													icon="solar:tag-bold"
													className="w-4 h-4 mr-2 text-primary"
												/>
												Genres
											</h3>
											<div className="flex flex-wrap gap-2">
												{videoData.genres.map((genre, index) => (
													<Badge
														key={index}
														variant="outline"
														className="border-primary/50 text-primary bg-primary/10">
														{genre}
													</Badge>
												))}
											</div>
										</div>
									)}

									{videoData.tags.length > 0 && (
										<div>
											<h3 className="text-lg font-semibold mb-3 flex items-center">
												<Icon
													icon="solar:hashtag-bold"
													className="w-4 h-4 mr-2 text-primary"
												/>
												Tags
											</h3>
											<div className="flex flex-wrap gap-2">
												{videoData.tags.map((tag, index) => (
													<Badge key={index} variant="secondary">
														{tag}
													</Badge>
												))}
											</div>
										</div>
									)}
								</div>
							)}

							{/* Cast */}
							{videoData.cast.length > 0 && (
								<div>
									<h2 className="text-xl lg:text-2xl font-bold mb-4 flex items-center">
										<Icon
											icon="solar:users-group-rounded-bold"
											className="w-5 h-5 mr-2 text-primary"
										/>
										Cast
									</h2>
									<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
										{videoData.cast.slice(0, 8).map((person, index) => (
											<Card
												key={index}
												className="overflow-hidden hover:shadow-lg transition-shadow">
												<CardContent className="p-3">
													<div className="relative aspect-square mb-2 rounded-lg overflow-hidden bg-muted">
														<Image
															src={
																person.profile_picture ||
																"/placeholder-avatar.png"
															}
															alt={person.name}
															fill
															className="object-cover"
														/>
													</div>
													<h4 className="font-medium text-sm line-clamp-2 mb-1">
														{person.name}
													</h4>
													<p className="text-xs text-muted-foreground line-clamp-1">
														{person.pivot?.credited_as || "Actor"}
													</p>
												</CardContent>
											</Card>
										))}
									</div>
								</div>
							)}
						</div>

						{/* Sidebar */}
						<div className="lg:col-span-1">
							<div className="sticky top-20 space-y-6">
								{/* Video Details */}
								<Card>
									<CardContent className="p-6">
										<h3 className="text-lg font-bold mb-4 flex items-center">
											<Icon
												icon="solar:info-circle-bold"
												className="w-5 h-5 mr-2 text-primary"
											/>
											Details
										</h3>
										<div className="space-y-3">
											<div className="flex justify-between py-2 border-b border-border/50">
												<span className="text-sm text-muted-foreground">
													Year
												</span>
												<span className="text-sm font-medium">
													{videoData.year}
												</span>
											</div>
											<div className="flex justify-between py-2 border-b border-border/50">
												<span className="text-sm text-muted-foreground">
													Duration
												</span>
												<span className="text-sm font-medium">
													{videoData.duration}
												</span>
											</div>
											<div className="flex justify-between py-2 border-b border-border/50">
												<span className="text-sm text-muted-foreground">
													Language
												</span>
												<span className="text-sm font-medium uppercase">
													{videoData.language}
												</span>
											</div>
											<div className="flex justify-between py-2 border-b border-border/50">
												<span className="text-sm text-muted-foreground">
													Rating
												</span>
												<Badge variant="outline" className="text-xs">
													{videoData.maturityRating}
												</Badge>
											</div>
											{videoData.resolutions.length > 0 && (
												<div className="pt-2">
													<span className="text-sm text-muted-foreground mb-2 block">
														Quality
													</span>
													<div className="flex flex-wrap gap-1">
														{videoData.resolutions.map((res, index) => (
															<Badge
																key={index}
																variant="secondary"
																className="text-xs">
																{res}
															</Badge>
														))}
													</div>
												</div>
											)}
										</div>
									</CardContent>
								</Card>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Bottom padding for mobile */}
			<div className="h-20 lg:hidden" />
		</div>
	);
}
