"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Navbar from "@/components/combinedComponents/Navbar";
import PageLoadingComponent from "@/components/combinedComponents/PageLoadingComponent";
import { useAuthContext } from "@/context/AuthContext";
import axios from "@/lib/axios";

export default function VideoDetailsPage() {
	const { slug } = useParams();
	const router = useRouter();
	const { user, isLoading: authLoading } = useAuthContext();
	const [mounted, setMounted] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [videoData, setVideoData] = useState(null);
	const [activeTab, setActiveTab] = useState("overview");
	const [error, setError] = useState(null);

	// Helper function to format duration
	const formatDuration = (seconds) => {
		if (!seconds) return "Unknown";
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		}
		return `${minutes}m`;
	};

	// Helper function to get quality badge
	const getQualityFromResolutions = (resolutions) => {
		if (!resolutions || !Array.isArray(resolutions)) return "HD";
		if (resolutions.includes("1080p")) return "4K";
		if (resolutions.includes("720p")) return "HD";
		return "SD";
	};

	useEffect(() => {
		setMounted(true);
	}, []);

	// Redirect to login if not authenticated
	useEffect(() => {
		if (!authLoading && !user) {
			router.replace("/login");
			return;
		}
	}, [user, authLoading, router]);

	// Fetch video data
	useEffect(() => {
		const fetchVideoData = async () => {
			if (!slug || !user) return;

			try {
				setIsLoading(true);
				setError(null);

				// API Call: Get video details by slug
				const response = await axios.get(`/getVideoBySlug/${slug}`);

				const videoInfo = response.data;

				// Transform the data to match the component's expected format
				const transformedData = {
					id: videoInfo.id,
					title: videoInfo.title,
					year: videoInfo.release_year,
					rating: videoInfo.rating || "N/A",
					duration: formatDuration(videoInfo.duration),
					genre: videoInfo.genres ? videoInfo.genres.map((g) => g.name) : [],
					tags: videoInfo.tags ? videoInfo.tags.map((t) => t.name) : [],
					maturityRating: videoInfo.content_rating || "NR",
					description: videoInfo.description || "No description available.",
					longDescription:
						videoInfo.description || "No detailed description available.",
					cast: videoInfo.people || [],
					backdrop: videoInfo.backdrop_path,
					poster: videoInfo.thumbnail_path,
					trailer: videoInfo.trailer_url || null,
					language: videoInfo.language || "Unknown",
					status: videoInfo.status,
					resolutions: videoInfo.resolutions || [],
					quality: getQualityFromResolutions(videoInfo.resolutions),
					slug: videoInfo.slug,
					// Generate facts from actual data
					facts: [
						`Released in ${videoInfo.release_year}`,
						`Available in ${videoInfo.language?.toUpperCase()} language`,
						`Duration: ${formatDuration(videoInfo.duration)}`,
						`Content Rating: ${videoInfo.content_rating || "Not Rated"}`,
						`Available in ${
							videoInfo.resolutions?.length || 0
						} quality options`,
						videoInfo.tags?.length > 0
							? `Tags: ${videoInfo.tags.map((t) => t.name).join(", ")}`
							: null,
					].filter(Boolean),
					episodes: [], // For TV shows, this would be populated
				};

				setVideoData(transformedData);
			} catch (err) {
				console.error("Error fetching video data:", err);
				if (err.response?.status === 404) {
					setError("Video not found");
				} else {
					setError("Failed to load video details. Please try again.");
				}
			} finally {
				setIsLoading(false);
			}
		};

		fetchVideoData();
	}, [slug, user]);

	if (authLoading || !user || !mounted || isLoading) {
		return <PageLoadingComponent />;
	}

	if (error) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<Icon
						icon="solar:video-library-bold-duotone"
						className="w-24 h-24 text-primary mx-auto mb-4"
					/>
					<h1 className="text-2xl font-bold mb-4 text-foreground">
						{error === "Video not found"
							? "Video Not Found"
							: "Error Loading Video"}
					</h1>
					<p className="mb-6 text-muted-foreground">
						{error === "Video not found"
							? "The video you're looking for doesn't exist or has been removed."
							: error}
					</p>
					<div className="flex gap-4 justify-center">
						<Button
							onClick={() => router.push("/home")}
							className="bg-primary hover:bg-primary/90 text-primary-foreground">
							<Icon icon="solar:arrow-left-bold" className="w-4 h-4 mr-2" />
							Go Back Home
						</Button>
						{error !== "Video not found" && (
							<Button
								variant="outline"
								onClick={() => window.location.reload()}>
								<Icon icon="solar:refresh-bold" className="w-4 h-4 mr-2" />
								Try Again
							</Button>
						)}
					</div>
				</div>
			</div>
		);
	}

	if (!videoData) {
		return <PageLoadingComponent />;
	}

	return (
		<div className="min-h-screen bg-background">
			<Navbar />

			{/* Hero Section */}
			<section className="relative h-[70vh] overflow-hidden">
				<div
					className="absolute inset-0 bg-cover bg-center bg-no-repeat"
					style={{ backgroundImage: `url(${videoData.backdrop})` }}>
					<div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/50" />
					<div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
				</div>

				{/* Decorative Elements */}
				<div className="absolute top-20 left-20 w-32 h-32 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
				<div className="absolute bottom-40 right-32 w-48 h-48 bg-primary/3 rounded-full blur-3xl animate-pulse delay-1000"></div>

				{/* Back Button */}
				<div className="absolute top-24 left-6 z-10">
					<Button
						variant="ghost"
						onClick={() => router.back()}
						className="backdrop-blur-sm bg-background/50 text-foreground hover:bg-accent hover:text-accent-foreground">
						<Icon icon="solar:arrow-left-bold" className="w-5 h-5 mr-2" />
						Back
					</Button>
				</div>

				<div className="relative h-full flex items-center">
					<div className="container mx-auto px-6">
						<div className="flex flex-col lg:flex-row items-start gap-8">
							{/* Poster */}
							<div className="flex-shrink-0">
								<div className="relative w-64 h-96 rounded-xl overflow-hidden shadow-2xl">
									<Image
										src={videoData.poster}
										alt={videoData.title}
										fill
										className="object-cover"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
								</div>
							</div>

							{/* Content */}
							<div className="flex-1 max-w-3xl">
								{/* Title */}
								<h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight text-foreground">
									<span className="bg-primary bg-clip-text text-transparent from-foreground via-primary/90 to-primary">
										{videoData.title}
									</span>
								</h1>

								{/* Metadata */}
								<div className="flex flex-wrap items-center gap-4 mb-6">
									{videoData.rating !== "N/A" && (
										<div className="flex items-center gap-2 backdrop-blur-sm px-3 py-1 rounded-full bg-foreground/10 text-foreground/90">
											<Icon
												icon="solar:star-bold-duotone"
												className="w-4 h-4 text-yellow-400"
											/>
											<span className="font-semibold">{videoData.rating}</span>
										</div>
									)}
									<span className="text-lg text-foreground/90">
										{videoData.year}
									</span>
									<span className="text-lg text-foreground/90">
										{videoData.duration}
									</span>
									<Badge
										variant="outline"
										className="border-primary/50 text-primary bg-primary/10">
										{videoData.maturityRating}
									</Badge>
									<Badge className="bg-primary hover:bg-primary/90 text-primary-foreground">
										{videoData.quality}
									</Badge>
									{videoData.language && (
										<Badge variant="secondary">
											{videoData.language.toUpperCase()}
										</Badge>
									)}
								</div>

								{/* Genres */}
								{videoData.genre.length > 0 && (
									<div className="flex flex-wrap gap-2 mb-6">
										{videoData.genre.map((g, index) => (
											<Badge
												key={index}
												variant="outline"
												className="border-primary/30 text-primary bg-primary/10 hover:bg-primary/20 capitalize">
												{g}
											</Badge>
										))}
									</div>
								)}

								{/* Tags */}
								{videoData.tags.length > 0 && (
									<div className="flex flex-wrap gap-2 mb-6">
										{videoData.tags.map((tag, index) => (
											<Badge
												key={index}
												variant="secondary"
												className="capitalize">
												{tag}
											</Badge>
										))}
									</div>
								)}

								{/* Description */}
								<p className="text-lg mb-8 leading-relaxed text-foreground/90">
									{videoData.description}
								</p>

								{/* Action Buttons */}
								<div className="flex flex-wrap gap-4">
									<Button
										size="lg"
										className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/25"
										onClick={() => router.push(`/video/watch/${videoData.id}`)}>
										<Icon icon="solar:play-bold" className="w-6 h-6 mr-2" />
										Watch Now
									</Button>
									<Button
										variant="outline"
										size="lg"
										className="backdrop-blur-sm px-8 py-3 text-lg border-border text-foreground hover:bg-accent hover:text-accent-foreground">
										<Icon
											icon="solar:bookmark-outline"
											className="w-6 h-6 mr-2"
										/>
										Add to Watchlist
									</Button>
									<Button
										variant="ghost"
										size="lg"
										className="px-8 py-3 text-lg text-foreground hover:bg-accent hover:text-accent-foreground">
										<Icon icon="solar:download-bold" className="w-6 h-6 mr-2" />
										Download
									</Button>
									<Button
										variant="ghost"
										size="lg"
										className="px-8 py-3 text-lg text-foreground hover:bg-accent hover:text-accent-foreground">
										<Icon icon="solar:share-bold" className="w-6 h-6 mr-2" />
										Share
									</Button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Content Tabs */}
			<section className="relative py-16">
				<div className="container mx-auto px-6">
					{/* Tab Navigation */}
					<div className="flex flex-wrap gap-4 mb-8 border-b border-border pb-4">
						{[
							{
								id: "overview",
								label: "Overview",
								icon: "solar:info-circle-bold",
							},
							...(videoData.cast.length > 0
								? [
										{
											id: "cast",
											label: "Cast",
											icon: "solar:users-group-rounded-bold",
										},
								  ]
								: []),
							{
								id: "details",
								label: "Details",
								icon: "solar:document-text-bold",
							},
						].map((tab) => (
							<Button
								key={tab.id}
								variant={activeTab === tab.id ? "default" : "ghost"}
								className={`px-6 py-3 transition-all duration-200 ${
									activeTab === tab.id
										? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
										: "text-muted-foreground hover:text-foreground hover:bg-accent"
								}`}
								onClick={() => setActiveTab(tab.id)}>
								<Icon icon={tab.icon} className="w-4 h-4 mr-2" />
								{tab.label}
							</Button>
						))}
					</div>

					{/* Tab Content */}
					<div className="min-h-[400px]">
						{activeTab === "overview" && (
							<div className="space-y-8">
								<div>
									<h3 className="text-2xl font-bold mb-4 text-foreground">
										Synopsis
									</h3>
									<p className="text-lg leading-relaxed text-foreground/80">
										{videoData.longDescription}
									</p>
								</div>

								{/* Genre & Tags Information */}
								<div className="grid md:grid-cols-2 gap-8">
									{videoData.genre.length > 0 && (
										<div>
											<h4 className="text-xl font-semibold mb-4 text-foreground">
												Genres
											</h4>
											<div className="flex flex-wrap gap-2">
												{videoData.genre.map((genre, index) => (
													<Badge
														key={index}
														variant="outline"
														className="border-primary/30 text-primary bg-primary/10 hover:bg-primary/20 capitalize">
														{genre}
													</Badge>
												))}
											</div>
										</div>
									)}

									{videoData.tags.length > 0 && (
										<div>
											<h4 className="text-xl font-semibold mb-4 text-foreground">
												Tags
											</h4>
											<div className="flex flex-wrap gap-2">
												{videoData.tags.map((tag, index) => (
													<Badge
														key={index}
														variant="secondary"
														className="capitalize">
														{tag}
													</Badge>
												))}
											</div>
										</div>
									)}
								</div>
							</div>
						)}

						{activeTab === "cast" && videoData.cast.length > 0 && (
							<div className="space-y-8">
								<div>
									<h3 className="text-2xl font-bold mb-6 text-foreground">
										Cast
									</h3>
									<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
										{videoData.cast.map((person, index) => (
											<Card
												key={index}
												className="bg-card border-border hover:border-primary/50 transition-all duration-300 cursor-pointer group">
												<CardContent className="p-4">
													<div className="relative aspect-square mb-3 rounded-lg overflow-hidden">
														<Image
															src={
																person.profile_picture ||
																"/placeholder-avatar.png"
															}
															alt={person.name}
															fill
															className="object-cover group-hover:scale-105 transition-transform duration-300"
														/>
													</div>
													<h4 className="font-semibold text-sm mb-1 text-card-foreground">
														{person.name}
													</h4>
													<p className="text-xs text-muted-foreground">
														{person.pivot?.credited_as || "Actor"}
													</p>
												</CardContent>
											</Card>
										))}
									</div>
								</div>
							</div>
						)}

						{activeTab === "details" && (
							<div className="space-y-8">
								<div>
									<h3 className="text-2xl font-bold mb-6 text-foreground">
										Video Details
									</h3>
									<div className="grid md:grid-cols-2 gap-8">
										<div className="space-y-4">
											{videoData.genre.length > 0 && (
												<div className="p-4 rounded-lg bg-card">
													<h4 className="font-semibold mb-2 text-primary">
														Genres
													</h4>
													<p className="text-card-foreground capitalize">
														{videoData.genre.join(", ")}
													</p>
												</div>
											)}
											<div className="p-4 rounded-lg bg-card">
												<h4 className="font-semibold mb-2 text-primary">
													Release Year
												</h4>
												<p className="text-card-foreground">{videoData.year}</p>
											</div>
											<div className="p-4 rounded-lg bg-card">
												<h4 className="font-semibold mb-2 text-primary">
													Content Rating
												</h4>
												<p className="text-card-foreground">
													{videoData.maturityRating}
												</p>
											</div>
											<div className="p-4 rounded-lg bg-card">
												<h4 className="font-semibold mb-2 text-primary">
													Language
												</h4>
												<p className="text-card-foreground uppercase">
													{videoData.language}
												</p>
											</div>
											<div className="p-4 rounded-lg bg-card">
												<h4 className="font-semibold mb-2 text-primary">
													Available Quality
												</h4>
												<div className="flex flex-wrap gap-2">
													{videoData.resolutions.map((res, index) => (
														<Badge key={index} variant="secondary">
															{res}
														</Badge>
													))}
												</div>
											</div>
										</div>
										<div>
											<h4 className="font-semibold mb-4 text-foreground">
												Additional Information
											</h4>
											<div className="space-y-3">
												{videoData.facts.map((fact, index) => (
													<div
														key={index}
														className="flex items-start p-3 rounded-lg bg-card">
														<Icon
															icon="solar:lightbulb-bolt-bold-duotone"
															className="w-5 h-5 text-primary mr-3 mt-0.5"
														/>
														<span className="text-sm text-card-foreground">
															{fact}
														</span>
													</div>
												))}
											</div>
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>
			</section>
		</div>
	);
}
