"use client";

import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageLoadingComponent from "@/components/combinedComponents/PageLoadingComponent";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import axios from "@/lib/axios";
import VideoRow from "@/components/combinedComponents/VideoRow";
import { addToWatchList, removeFromWatchList } from "@/lib/helper";
import { toast } from "sonner";
import echo from "@/lib/echo";
import Navbar from "@/components/combinedComponents/Navbar";
import Footer from "@/components/combinedComponents/Footer";

export default function HomePage() {
	const { user, isLoading } = useAuthContext();
	const router = useRouter();

	const [userData, setUserData] = useState(null);
	const [mounted, setMounted] = useState(false);
	const [loading, setLoading] = useState(true);
	const [addWatchListLoading, setAddWatchListLoading] = useState(false);
	const [error, setError] = useState(null);

	const [homeData, setHomeData] = useState({
		featured: null,
		trending: [],
		popular: [],
		newReleases: [],
		action: [],
		continueWatching: [],
		recommended: [],
	});

	const formatDuration = (seconds) => {
		if (!seconds) return "Unknown";
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		}
		return `${minutes}m`;
	};

	const formatTimeRemaining = (seconds) => {
		if (!seconds) return "Finished";
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);

		if (hours > 0) {
			return `${hours}h ${minutes}m left`;
		}
		return `${minutes}m left`;
	};

	const transformVideoData = (video) => ({
		id: video.id,
		title: video.title,
		poster: video.thumbnail_path,
		slug: video.slug,
		rating: video.rating || 0,
		year: video.release_year,
		duration: formatDuration(video.duration),
		resolutions: video.resolutions || [],
		exists_in_watchlist: video.exists_in_watchlist || false,
	});

	const transformContinueWatchingData = (record) => {
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
	};

	const transformFeaturedData = (featured) => ({
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
		resolutions: featured.resolutions || [],
		exists_in_watchlist: featured.exists_in_watchlist || false,
	});

	const handleVideoClick = (video) => {
		router.push(`/video/${video.slug}`);
	};

	const handleContinueWatchingClick = (video) => {
		router.push(`/video/watch/${video.id}?t=${video.currentTime}`);
	};

	const handleRemoveFromContinueWatching = async (videoId) => {
		setHomeData((prev) => ({
			...prev,
			continueWatching: prev.continueWatching.filter(
				(video) => video.id !== videoId,
			),
		}));
	};

	const handleWatchlistToggle = async (e) => {
		e.preventDefault();
		if (!homeData.featured) return;

		setAddWatchListLoading(true);
		const isCurrentlyWatchlisted = homeData.featured.exists_in_watchlist;

		try {
			if (isCurrentlyWatchlisted) {
				const response = await removeFromWatchList(homeData.featured.id);
				if (response.success) {
					setHomeData((prev) => ({
						...prev,
						featured: { ...prev.featured, exists_in_watchlist: false },
					}));
					toast.success("Removed from watchlist");
				} else {
					toast.error("Failed to remove from watchlist");
				}
			} else {
				const response = await addToWatchList(homeData.featured.id);
				if (response.success) {
					setHomeData((prev) => ({
						...prev,
						featured: { ...prev.featured, exists_in_watchlist: true },
					}));
					toast.success("Added to watchlist");
				} else {
					toast.error("Failed to add to watchlist");
				}
			}
		} catch (error) {
			toast.error("An error occurred. Please try again.");
		} finally {
			setAddWatchListLoading(false);
		}
	};

	/**
	 * Handle component mounting for hydration
	 */
	useEffect(() => {
		setMounted(true);
	}, []);

	/**
	 * Set user data when user is available
	 */
	useEffect(() => {
		if (user) {
			setUserData({
				name: user?.name || "User",
				email: user?.email || "",
				avatar: user?.avatar || null,
			});
		}
	}, [user]);

	/**
	 * Setup Laravel Echo for real-time notifications
	 */
	useEffect(() => {
		if (!user?.id) return;

		const channel = echo
			.private("user." + user.id)
			.listen(".notification", (e) => {
				console.log("Received notification:", e);
			});

		return () => {
			echo.leaveChannel("private-user." + user.id);
		};
	}, [user?.id]);

	/**
	 * Handle authentication and email verification redirects
	 */
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

	useEffect(() => {
		const fetchHomeData = async () => {
			if (!user) return;

			try {
				setLoading(true);
				setError(null);

				const response = await axios.get("/video/home");
				const data = response.data;

				setHomeData({
					featured: data.featured ? transformFeaturedData(data.featured) : null,
					trending: data.trending.map(transformVideoData),
					popular: data.popular.map(transformVideoData),
					newReleases: data.newReleases.map(transformVideoData),
					action: data.action.map(transformVideoData),
					continueWatching: data.continueWatching.map(
						transformContinueWatchingData,
					),
					recommended: data.recommended.map(transformVideoData),
				});
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

	if (!homeData.featured) {
		return <PageLoadingComponent />;
	}

	return (
		<div className="min-h-screen bg-background">
			<Navbar />
			{/* ===== FEATURED HERO SECTION ===== */}
			<section className="relative h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-[85vh] overflow-hidden">
				{/* Background Image with Gradients */}
				<div
					className="absolute inset-0 bg-cover bg-center bg-no-repeat"
					style={{ backgroundImage: `url(${homeData.featured.backdrop})` }}>
					<div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 sm:via-background/70 to-transparent" />
					<div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
				</div>

				{/* Hero Content */}
				<div className="relative h-full flex items-center">
					<div className="container mx-auto px-4 sm:px-6">
						<div className="max-w-full sm:max-w-2xl md:max-w-3xl">
							{/* Title */}
							<h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 md:mb-8 leading-tight text-primary">
								{homeData.featured.title}
							</h1>

							{/* Metadata */}
							<div className="flex flex-wrap items-center gap-2 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8 text-foreground/90">
								<span className="text-sm sm:text-base md:text-lg">
									{homeData.featured.year}
								</span>
								<span className="text-sm sm:text-base md:text-lg">
									{homeData.featured.duration}
								</span>
								{homeData.featured.resolutions.length > 0 && (
									<Badge
										variant="outline"
										className="border-primary/50 text-primary bg-primary/10 hover:bg-primary/20 text-xs sm:text-sm">
										{
											homeData.featured.resolutions[
												homeData.featured.resolutions.length - 1
											]
										}
									</Badge>
								)}
								{homeData.featured.content_rating && (
									<Badge variant="secondary" className="text-xs sm:text-sm">
										{homeData.featured.content_rating}
									</Badge>
								)}
							</div>

							{/* Description */}
							<p className="text-sm sm:text-base md:text-lg lg:text-xl mb-6 sm:mb-8 md:mb-10 leading-relaxed max-w-full sm:max-w-xl md:max-w-2xl font-light text-foreground/80 line-clamp-3 sm:line-clamp-none">
								{homeData.featured.description}
							</p>

							{/* Action Buttons */}
							<div className="flex gap-3 sm:gap-4">
								<Button
									variant="default"
									onClick={() =>
										router.push(`/video/watch/${homeData.featured.id}`)
									}>
									<Icon
										icon="solar:play-bold"
										className="w-4 h-4 sm:w-5 md:w-6 lg:w-7 md:h-6 lg:h-7 mr-2 sm:mr-3"
									/>
									Play Now
								</Button>
								<Button
									variant="secondary"
									onClick={() =>
										router.push(`/video/${homeData.featured.slug}`)
									}>
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
									{homeData.featured.exists_in_watchlist ? (
										<Icon
											icon="solar:bookmark-bold"
											className="w-4 h-4 sm:w-5 md:w-6 lg:w-7 md:h-6 lg:h-7"
										/>
									) : (
										<Icon
											icon="hugeicons:bookmark-add-02"
											width="2em"
											height="2em"
										/>
									)}
								</Button>
							</div>
						</div>
					</div>
				</div>

				{/* Bottom fade gradient */}
				<div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 md:h-32 bg-gradient-to-t from-background to-transparent" />
			</section>

			{/* ===== CONTENT SECTIONS ===== */}

			{/* Continue Watching Section */}
			{homeData.continueWatching.length > 0 && (
				<VideoRow
					title={`Continue Watching for ${userData?.name}`}
					videos={homeData.continueWatching}
					onVideoClick={handleContinueWatchingClick}
					onRemove={handleRemoveFromContinueWatching}
					type="continue-watching"
					className="relative px-4 sm:px-6 -mt-8 sm:-mt-12 md:-mt-16 z-10"
				/>
			)}

			{/* Main Video Rows */}
			<section
				className={`relative px-4 sm:px-6 ${
					homeData.continueWatching.length > 0
						? "pt-0"
						: "-mt-12 sm:-mt-16 md:-mt-20 lg:-mt-24"
				} z-10 pb-10 sm:pb-16 md:pb-20`}>
				{/* Recommended for You */}
				{homeData.recommended.length > 0 && (
					<VideoRow
						title="Recommended for You"
						videos={homeData.recommended}
						onVideoClick={handleVideoClick}
						type="poster"
						className="mb-6 sm:mb-8 md:mb-10"
					/>
				)}

				{/* Trending Now */}
				{homeData.trending.length > 0 && (
					<VideoRow
						title="Trending Now"
						videos={homeData.trending}
						onVideoClick={handleVideoClick}
						type="poster"
						className="mb-6 sm:mb-8 md:mb-10"
					/>
				)}

				{/* Popular on Seenema */}
				{homeData.popular.length > 0 && (
					<VideoRow
						title="Popular on Seenema"
						videos={homeData.popular}
						onVideoClick={handleVideoClick}
						type="poster"
						className="mb-6 sm:mb-8 md:mb-10"
					/>
				)}

				{/* New Releases */}
				{homeData.newReleases.length > 0 && (
					<VideoRow
						title="New Releases"
						videos={homeData.newReleases}
						onVideoClick={handleVideoClick}
						type="poster"
						className="mb-6 sm:mb-8 md:mb-10"
					/>
				)}

				{/* Action & Adventure */}
				{homeData.action.length > 0 && (
					<VideoRow
						title="Action & Adventure"
						videos={homeData.action}
						onVideoClick={handleVideoClick}
						type="poster"
						className="mb-6 sm:mb-8 md:mb-10"
					/>
				)}
			</section>
			<Footer />
		</div>
	);
}
