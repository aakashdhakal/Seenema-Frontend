"use client";

import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageLoadingComponent from "@/components/combinedComponents/PageLoadingComponent";
import Navbar from "@/components/combinedComponents/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import { useSearchParams } from "next/navigation";
import axios from "@/lib/axios";
import MovieRow from "@/components/combinedComponents/MovieRow";

export default function HomePage() {
	const { user, isLoading } = useAuthContext();
	const router = useRouter();
	const [userData, setUserData] = useState(null);
	const [mounted, setMounted] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// State for each section
	const [featuredMovie, setFeaturedMovie] = useState(null);
	const [trendingMovies, setTrendingMovies] = useState([]);
	const [popularMovies, setPopularMovies] = useState([]);
	const [newReleases, setNewReleases] = useState([]);
	const [actionMovies, setActionMovies] = useState([]);
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
	const handleRemoveFromContinueWatching = async (watchHistoryId) => {
		try {
			await axios.delete(`/removeContinueWatching/${watchHistoryId}`);
			setContinueWatching((prev) =>
				prev.filter((item) => item.watchHistoryId !== watchHistoryId),
			);
		} catch (err) {
			console.error("Error removing from continue watching:", err);
		}
	};

	// Handle movie click
	const handleMovieClick = (movie) => {
		router.push(`/video/${movie.slug}`);
	};

	// Handle continue watching click
	const handleContinueWatchingClick = (movie) => {
		router.push(`/video/play/${movie.id}?t=${movie.currentTime}`);
	};

	// Handle hydration
	useEffect(() => {
		setMounted(true);
	}, []);

	// Set userData when user is available
	useEffect(() => {
		if (user) {
			setUserData({
				name: user.user?.name || "User",
				email: user.user?.email || "",
				avatar: user.user?.avatar || null,
			});
		}
	}, [user]);

	// Redirect to login if not authenticated
	useEffect(() => {
		if (user && !user.user.email_verified_at) {
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
				const featuredResponse = await axios.get("/getFeaturedVideo");
				const featured = featuredResponse.data;
				setFeaturedMovie({
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
				});

				// API Call 2: Get trending content
				const trendingResponse = await axios.get("/getTrendingVideos");
				setTrendingMovies(
					trendingResponse.data.map((video) => ({
						id: video.id,
						title: video.title,
						poster: video.thumbnail_path,
						slug: video.slug,
						rating: video.rating || 0,
						year: video.release_year,
						duration: formatDuration(video.duration),
						resolutions: video.resolutions,
					})),
				);

				// API Call 3: Get popular content
				const popularResponse = await axios.get("/getPopularVideos");
				setPopularMovies(
					popularResponse.data.map((video) => ({
						id: video.id,
						title: video.title,
						poster: video.thumbnail_path,
						slug: video.slug,
						rating: video.rating || 0,
						year: video.release_year,
						duration: formatDuration(video.duration),
						resolutions: video.resolutions,
					})),
				);

				// API Call 4: Get new releases
				const newReleasesResponse = await axios.get("/getNewReleases");
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
					})),
				);

				// API Call 5: Get action & adventure content
				const actionResponse = await axios.get("/getVideosByCategory/action");
				setActionMovies(
					actionResponse.data.map((video) => ({
						id: video.id,
						title: video.title,
						poster: video.thumbnail_path,
						slug: video.slug,
						rating: video.rating || 0,
						year: video.release_year,
						duration: formatDuration(video.duration),
						resolutions: video.resolutions,
					})),
				);

				// API Call 6: Get user's continue watching
				const continueWatchingResponse = await axios.get(
					"/getContinueWatching",
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
				const recommendedResponse = await axios.get("/getRecommendations");
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
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-2xl font-bold mb-4 text-foreground">
						Oops! Something went wrong
					</h2>
					<p className="text-muted-foreground mb-6">{error}</p>
					<Button onClick={() => window.location.reload()}>
						<Icon icon="solar:refresh-bold" className="w-4 h-4 mr-2" />
						Try Again
					</Button>
				</div>
			</div>
		);
	}

	if (!featuredMovie) {
		return <PageLoadingComponent />;
	}

	return (
		<div className="min-h-screen bg-background">
			<Navbar />

			{/* Featured Hero Section */}
			<section className="relative h-[85vh] overflow-hidden">
				<div
					className="absolute inset-0 bg-cover bg-center bg-no-repeat"
					style={{ backgroundImage: `url(${featuredMovie.backdrop})` }}>
					<div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
					<div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
				</div>

				<div className="relative h-full flex items-center">
					<div className="container mx-auto px-6">
						<div className="max-w-3xl">
							{/* Title */}
							<h1 className="text-3xl md:text-7xl font-bold mb-8 leading-tight text-primary">
								{featuredMovie.title}
							</h1>

							{/* Metadata */}
							<div className="flex items-center gap-6 mb-8 text-foreground/90">
								{featuredMovie.rating > 0 && (
									<div className="flex items-center gap-2 backdrop-blur-sm px-3 py-1 rounded-full bg-foreground/10">
										<Icon
											icon="solar:star-bold-duotone"
											className="w-5 h-5 text-yellow-400"
										/>
										<span className="font-semibold">
											{featuredMovie.rating}
										</span>
									</div>
								)}
								<span className="text-lg">{featuredMovie.year}</span>
								<span className="text-lg">{featuredMovie.duration}</span>
								<Badge
									variant="outline"
									className="border-primary/50 text-primary bg-primary/10 hover:bg-primary/20">
									{
										featuredMovie.resolutions[
											featuredMovie.resolutions.length - 1
										]
									}
								</Badge>
								{featuredMovie.content_rating && (
									<Badge variant="secondary">
										{featuredMovie.content_rating}
									</Badge>
								)}
							</div>

							{/* Description */}
							<p className="text-xl mb-10 leading-relaxed max-w-2xl font-light text-foreground/80">
								{featuredMovie.description}
							</p>

							{/* Action Buttons */}
							<div className="flex flex-col sm:flex-row gap-4">
								<Button
									size="lg"
									className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-lg font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/25"
									onClick={() =>
										router.push(`/video/play/${featuredMovie.id}`)
									}>
									<Icon icon="solar:play-bold" className="w-7 h-7 mr-3" />
									Play Now
								</Button>
								<Button
									variant="outline"
									size="lg"
									className="backdrop-blur-sm px-10 py-6 text-lg border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-300"
									onClick={() => router.push(`/video/${featuredMovie.slug}`)}>
									<Icon
										icon="solar:info-circle-bold-duotone"
										className="w-7 h-7 mr-3"
									/>
									More Info
								</Button>
								<Button
									variant="ghost"
									size="lg"
									className="px-6 py-6 text-lg text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-300">
									<Icon
										icon="solar:bookmark-circle-bold-duotone"
										className="w-7 h-7 mr-3"
									/>
									Add to List
								</Button>
							</div>
						</div>
					</div>
				</div>

				{/* Bottom fade gradient */}
				<div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent"></div>
			</section>

			{/* Continue Watching Section */}
			<MovieRow
				title={`Continue Watching for ${userData?.name}`}
				movies={continueWatching}
				onMovieClick={handleContinueWatchingClick}
				onRemove={handleRemoveFromContinueWatching}
				type="continue-watching"
				className={`relative ${
					continueWatching.length > 0 ? "-mt-16 z-10" : ""
				}`}
			/>

			{/* Movie Rows */}
			<section
				className={`relative ${
					continueWatching && continueWatching.length > 0 ? "pt-0" : "-mt-24"
				} z-10 pb-20`}>
				{/* Recommended for You */}
				<MovieRow
					title="Recommended for You"
					movies={recommended}
					onMovieClick={handleMovieClick}
					type="poster"
				/>

				{/* Trending Now */}
				<MovieRow
					title="Trending Now"
					movies={trendingMovies}
					onMovieClick={handleMovieClick}
					type="poster"
				/>

				{/* Popular on Seenema */}
				<MovieRow
					title="Popular on Seenema"
					movies={popularMovies}
					onMovieClick={handleMovieClick}
					type="poster"
				/>

				{/* New Releases */}
				<MovieRow
					title="New Releases"
					movies={newReleases}
					onMovieClick={handleMovieClick}
					type="poster"
				/>

				{/* Action & Adventure */}
				<MovieRow
					title="Action & Adventure"
					movies={actionMovies}
					onMovieClick={handleMovieClick}
					type="poster"
				/>
			</section>
		</div>
	);
}
