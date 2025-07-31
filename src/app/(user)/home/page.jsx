"use client";

import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageLoadingComponent from "@/components/combinedComponents/PageLoadingComponent";
import Navbar from "@/components/combinedComponents/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import axios from "@/lib/axios";
import VideoRow from "@/components/combinedComponents/VideoRow";
import {
	checkIfVideoInWatchList,
	addToWatchList,
	removeFromWatchList,
} from "@/lib/helper";
import { toast } from "sonner";
import echo from "@/lib/echo"; // Import your Echo instance

export default function HomePage() {
	const { user, isLoading } = useAuthContext();
	const router = useRouter();
	const [userData, setUserData] = useState(null);
	const [mounted, setMounted] = useState(false);
	const [loading, setLoading] = useState(true);
	const [addWatchListLoading, setAddWatchListLoading] = useState(false);
	const [isWatchlisted, setIsWatchlisted] = useState(false);
	const [error, setError] = useState(null);
	// State for connection status
	const [connectionStatus, setConnectionStatus] = useState("disconnected");

	// State for each section
	const [featuredVideo, setFeaturedVideo] = useState(null);
	const [trendingVideos, setTrendingVideos] = useState([]);
	const [popularVideos, setPopularVideos] = useState([]);
	const [newReleases, setNewReleases] = useState([]);
	const [actionVideos, setActionVideos] = useState([]);
	const [continueWatching, setContinueWatching] = useState([]);
	const [recommended, setRecommended] = useState([]);

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

	// Helper function to format time remaining
	const formatTimeRemaining = (seconds) => {
		if (!seconds) return "Finished";
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);

		if (hours > 0) {
			return `${hours}h ${minutes}m left`;
		}
		return `${minutes}m left`;
	};

	// Handle continue watching removal
	const handleRemoveFromContinueWatching = async (videoId) => {
		setContinueWatching((prev) => prev.filter((video) => video.id !== videoId));
	};

	// Handle watchlist toggle
	const handleWatchlistToggle = async (e) => {
		setAddWatchListLoading(true);
		const isVideoInWatchlist = await checkIfVideoInWatchList(featuredVideo.id);
		if (isVideoInWatchlist.exists) {
			setIsWatchlisted(true);
		}
		if (isWatchlisted) {
			const response = await removeFromWatchList(featuredVideo.id);
			if (response.success) {
				setIsWatchlisted(false);
				toast.success("Removed from watchlist");
			} else {
				toast.error("Failed to remove from watchlist");
			}
		} else {
			const response = await addToWatchList(featuredVideo.id);
			if (response.success) {
				setIsWatchlisted(true);
				toast.success("Added to watchlist");
			} else {
				toast.error("Failed to add to watchlist");
			}
		}
		setAddWatchListLoading(false);
	};

	// Handle Video click
	const handleVideoClick = (Video) => {
		router.push(`/video/${Video.slug}`);
	};

	// Handle continue watching click
	const handleContinueWatchingClick = (Video) => {
		router.push(`/video/watch/${Video.id}?t=${Video.currentTime}`);
	};

	// Handle hydration
	useEffect(() => {
		setMounted(true);
	}, []);

	// Set userData when user is available
	useEffect(() => {
		if (user) {
			setUserData({
				name: user?.name || "User",
				email: user?.email || "",
				avatar: user?.avatar || null,
			});
		}
	}, [user]);

	// Setup Laravel Reverb notifications
	useEffect(() => {
		if (!user?.id) return;

		const channel = echo
			.private("user." + user.id)
			.listen(".notification", (e) => {
				console.log(e);
			});

		return () => {
			echo.leaveChannel("private-user." + user.id);
		};
	}, [user?.id]);

	// Redirect to login if not authenticated
	useEffect(() => {
		if (user && !user.is_email_verified) {
			router.replace("/verifyEmail");
			return;
		}
		if (!isLoading && !user) {
			router.replace("/login");
			return;
		}
	}, [user, isLoading, router]);

	// Fetch home data
	useEffect(() => {
		const fetchHomeData = async () => {
			if (!user) return;

			try {
				setLoading(true);
				setError(null);

				// API Call 1: Get featured content
				const featuredResponse = await axios.get("/video/featured");
				const featured = featuredResponse.data;
				setFeaturedVideo({
					id: featured.id,
					title: featured.title,
					description:
						featured.description?.slice(0, 200) + "..." ||
						"No description available...",
					backdrop: featured.backdrop_path,
					poster: featured.thumbnail_path,
					rating: featured.rating || 0,
					year: featured.release_year,
					genre: featured.category || "Entertainment",
					duration: formatDuration(featured.duration),
					slug: featured.slug,
					content_rating: featured.content_rating,
					resolutions: featured.resolutions,
					exists_in_watchlist: featured.exists_in_watchlist,
				});

				// API Call 2: Get trending content
				const trendingResponse = await axios.get("/video/trending");
				setTrendingVideos(
					trendingResponse.data.map((video) => ({
						id: video.id,
						title: video.title,
						poster: video.thumbnail_path,
						slug: video.slug,
						rating: video.rating || 0,
						year: video.release_year,
						duration: formatDuration(video.duration),
						resolutions: video.resolutions,
						exists_in_watchlist: video.exists_in_watchlist,
					})),
				);

				// API Call 3: Get popular content
				const popularResponse = await axios.get("/video/popular");
				setPopularVideos(
					popularResponse.data.map((video) => ({
						id: video.id,
						title: video.title,
						poster: video.thumbnail_path,
						slug: video.slug,
						rating: video.rating || 0,
						year: video.release_year,
						duration: formatDuration(video.duration),
						resolutions: video.resolutions,
						exists_in_watchlist: video.exists_in_watchlist,
					})),
				);

				// API Call 4: Get new releases
				const newReleasesResponse = await axios.get("/video/new-release");
				setNewReleases(
					newReleasesResponse.data.map((video) => ({
						id: video.id,
						title: video.title,
						poster: video.thumbnail_path,
						slug: video.slug,
						rating: video.rating || 0,
						year: video.release_year,
						duration: formatDuration(video.duration),
						resolutions: video.resolutions,
						exists_in_watchlist: video.exists_in_watchlist,
					})),
				);

				// API Call 5: Get action & adventure content
				const actionResponse = await axios.get("/video/category/action");
				setActionVideos(
					actionResponse.data.map((video) => ({
						id: video.id,
						title: video.title,
						poster: video.thumbnail_path,
						slug: video.slug,
						rating: video.rating || 0,
						year: video.release_year,
						duration: formatDuration(video.duration),
						resolutions: video.resolutions,
						exists_in_watchlist: video.exists_in_watchlist,
					})),
				);

				// API Call 6: Get user's continue watching
				const continueWatchingResponse = await axios.get(
					"/video/continue-watching",
				);
				setContinueWatching(
					continueWatchingResponse.data.map((record) => {
						const video = record.video;
						const progress = Math.min(
							(record.watched_duration / video.duration) * 100,
							100,
						);
						const remainingSeconds = Math.max(
							video.duration - record.watched_duration,
							0,
						);

						return {
							id: video.id,
							title: video.title,
							backdrop: video.backdrop_path,
							slug: video.slug,
							description: video.description,
							progress: Math.round(progress),
							timeLeft: formatTimeRemaining(remainingSeconds),
							lastWatched: record.finished_at || record.updated_at,
							currentTime: record.watched_duration,
							totalDuration: video.duration,
							watchHistoryId: record.id,
						};
					}),
				);

				// API Call 7: Get recommendations
				const recommendedResponse = await axios.get("/video/recommendations");
				setRecommended(
					recommendedResponse.data.map((video) => ({
						id: video.id,
						title: video.title,
						poster: video.thumbnail_path,
						slug: video.slug,
						rating: video.rating || 0,
						year: video.release_year,
						duration: formatDuration(video.duration),
						resolutions: video.resolutions,
						exists_in_watchlist: video.exists_in_watchlist,
					})),
				);
			} catch (err) {
				console.error("Error fetching home data:", err);
				setError("Failed to load content. Please try again.");
			} finally {
				setLoading(false);
			}
		};

		fetchHomeData();
	}, [user]);

	if (isLoading || !user || !mounted || loading) {
		return <PageLoadingComponent />;
	}

	if (error) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center p-4">
				<div className="text-center max-w-md w-full">
					<h2 className="text-xl sm:text-2xl font-bold mb-4 text-foreground">
						Oops! Something went wrong
					</h2>
					<p className="text-sm sm:text-base text-muted-foreground mb-6">
						{error}
					</p>
					<Button
						onClick={() => window.location.reload()}
						className="w-full sm:w-auto">
						<Icon icon="solar:refresh-bold" className="w-4 h-4 mr-2" />
						Try Again
					</Button>
				</div>
			</div>
		);
	}

	if (!featuredVideo) {
		return <PageLoadingComponent />;
	}

	return (
		<div className="min-h-screen bg-background">
			<Navbar />

			{/* Featured Hero Section */}
			<section className="relative h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-[85vh] overflow-hidden">
				<div
					className="absolute inset-0 bg-cover bg-center bg-no-repeat"
					style={{ backgroundImage: `url(${featuredVideo.backdrop})` }}>
					<div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 sm:via-background/70 to-transparent" />
					<div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
				</div>

				<div className="relative h-full flex items-center">
					<div className="container mx-auto px-4 sm:px-6">
						<div className="max-w-full sm:max-w-2xl md:max-w-3xl">
							{/* Title */}
							<h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 md:mb-8 leading-tight text-primary">
								{featuredVideo.title}
							</h1>

							{/* Metadata */}
							<div className="flex flex-wrap items-center gap-2 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8 text-foreground/90">
								{featuredVideo.rating > 0 && (
									<div className="flex items-center gap-1 sm:gap-2 backdrop-blur-sm px-2 sm:px-3 py-1 rounded-full bg-foreground/10">
										<Icon
											icon="solar:star-bold-duotone"
											className="w-3 h-3 sm:w-4 md:w-5 md:h-5 text-yellow-400"
										/>
										<span className="font-semibold text-xs sm:text-sm md:text-base">
											{featuredVideo.rating}
										</span>
									</div>
								)}
								<span className="text-sm sm:text-base md:text-lg">
									{featuredVideo.year}
								</span>
								<span className="text-sm sm:text-base md:text-lg">
									{featuredVideo.duration}
								</span>
								<Badge
									variant="outline"
									className="border-primary/50 text-primary bg-primary/10 hover:bg-primary/20 text-xs sm:text-sm">
									{
										featuredVideo.resolutions[
											featuredVideo.resolutions.length - 1
										]
									}
								</Badge>
								{featuredVideo.content_rating && (
									<Badge variant="secondary" className="text-xs sm:text-sm">
										{featuredVideo.content_rating}
									</Badge>
								)}
							</div>

							{/* Description */}
							<p className="text-sm sm:text-base md:text-lg lg:text-xl mb-6 sm:mb-8 md:mb-10 leading-relaxed max-w-full sm:max-w-xl md:max-w-2xl font-light text-foreground/80 line-clamp-3 sm:line-clamp-none">
								{featuredVideo.description}
							</p>

							{/* Action Buttons */}
							<div className="flex  xs:flex-row gap-3 sm:gap-4">
								<Button
									variant={"default"}
									onClick={() =>
										router.push(`/video/watch/${featuredVideo.id}`)
									}>
									<Icon
										icon="solar:play-bold"
										className="w-4 h-4 sm:w-5 md:w-6 lg:w-7  md:h-6 lg:h-7 mr-2 sm:mr-3"
									/>
									Play Now
								</Button>
								<Button
									variant="secondary"
									onClick={() => router.push(`/video/${featuredVideo.slug}`)}>
									<Icon icon="ic:round-info" width="2em" height="2em" />
									More Info
								</Button>
								<Button
									variant="outline"
									onClick={handleWatchlistToggle}
									isLoading={addWatchListLoading}
									loadingText={
										<Icon
											icon="eos-icons:bubble-loading"
											width="2em"
											height="2em"
										/>
									}>
									<Icon icon={"solar:bookmark-linear"} className="w-4 h-4" />
								</Button>
							</div>
						</div>
					</div>
				</div>

				{/* Bottom fade gradient */}
				<div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 md:h-32 bg-gradient-to-t from-background to-transparent"></div>
			</section>

			{/* Continue Watching Section */}
			<VideoRow
				title={`Continue Watching for ${userData?.name}`}
				videos={continueWatching}
				onVideoClick={handleContinueWatchingClick}
				onRemove={handleRemoveFromContinueWatching}
				type="continue-watching"
				className={`relative px-4 sm:px-6 ${
					continueWatching.length > 0 ? "-mt-8 sm:-mt-12 md:-mt-16 z-10" : ""
				}`}
			/>

			{/* Video Rows */}
			<section
				className={`relative px-4 sm:px-6 ${
					continueWatching && continueWatching.length > 0
						? "pt-0"
						: "-mt-12 sm:-mt-16 md:-mt-20 lg:-mt-24"
				} z-10 pb-10 sm:pb-16 md:pb-20`}>
				{/* Recommended for You */}
				<VideoRow
					title="Recommended for You"
					videos={recommended}
					onVideoClick={handleVideoClick}
					type="poster"
					className="mb-6 sm:mb-8 md:mb-10"
				/>

				{/* Trending Now */}
				<VideoRow
					title="Trending Now"
					videos={trendingVideos}
					onVideoClick={handleVideoClick}
					type="poster"
					className="mb-6 sm:mb-8 md:mb-10"
				/>

				{/* Popular on Seenema */}
				<VideoRow
					title="Popular on Seenema"
					videos={popularVideos}
					onVideoClick={handleVideoClick}
					type="poster"
					className="mb-6 sm:mb-8 md:mb-10"
				/>

				{/* New Releases */}
				<VideoRow
					title="New Releases"
					videos={newReleases}
					onVideoClick={handleVideoClick}
					type="poster"
					className="mb-6 sm:mb-8 md:mb-10"
				/>

				{/* Action & Adventure */}
				<VideoRow
					title="Action & Adventure"
					videos={actionVideos}
					onVideoClick={handleVideoClick}
					type="poster"
					className="mb-6 sm:mb-8 md:mb-10"
				/>
			</section>
		</div>
	);
}
