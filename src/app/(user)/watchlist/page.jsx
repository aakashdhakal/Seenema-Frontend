"use client";

import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageLoadingComponent from "@/components/combinedComponents/PageLoadingComponent";
import Navbar from "@/components/combinedComponents/Navbar";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import axios from "@/lib/axios";
import PosterCard from "@/components/combinedComponents/PosterCard";
import { toast } from "sonner";

export default function WatchlistPage() {
	const { user, isLoading } = useAuthContext();
	const router = useRouter();
	const [userData, setUserData] = useState(null);
	const [mounted, setMounted] = useState(false);
	const [loading, setLoading] = useState(true);
	const [watchlistMovies, setWatchlistMovies] = useState([]);
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
	const handleRemoveFromWatchlist = (videoId) => {
		setWatchlistMovies((prev) => prev.filter((movie) => movie.id !== videoId));
	};

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

	// Handle hydration
	useEffect(() => {
		setMounted(true);
	}, []);

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

	// Fetch watchlist data
	useEffect(() => {
		const fetchWatchlistData = async () => {
			if (!user) return;

			try {
				setLoading(true);
				setError(null);

				const watchlistResponse = await axios.get("/watchlist");
				setWatchlistMovies(
					watchlistResponse.data.map((item) => ({
						id: item.video.id,
						title: item.video.title,
						poster: item.video.thumbnail_path,
						backdrop: item.video.backdrop_path,
						slug: item.video.slug,
						rating: item.video.rating || 0,
						year: item.video.release_year,
						duration: formatDuration(item.video.duration),
						description:
							item.video.description?.slice(0, 150) + "..." ||
							"No description available...",
						genre: item.video.category || "Entertainment",
						content_rating: item.video.content_rating,
						resolutions: item.video.resolutions,
						addedAt: item.created_at,
						exists_in_watchlist: item.video.exists_in_watchlist,
					})),
				);
			} catch (err) {
				console.error("Error fetching watchlist:", err);
				setError("Failed to load watchlist. Please try again.");
			} finally {
				setLoading(false);
			}
		};

		fetchWatchlistData();
	}, [user]);

	if (isLoading || !user || !mounted || loading) {
		return <PageLoadingComponent />;
	}

	if (error) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center p-4">
				<Navbar />
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

	return (
		<div className="min-h-screen bg-background">
			<Navbar />

			{/* Header Section */}
			<section className="pt-24 sm:pt-28 md:pt-32 pb-8 sm:pb-12 px-4 sm:px-6">
				<div className="container mx-auto">
					<div className="flex items-center gap-4 mb-2">
						<Icon icon="fluent:bookmark-16-filled" width="3em" height="3em" />
						<h1 className="text-2xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
							My Watchlist
						</h1>
					</div>
				</div>
			</section>

			{/* Watchlist Content */}
			<section className="px-4 sm:px-6 pb-16 sm:pb-20">
				<div className="container mx-auto">
					{watchlistMovies.length === 0 ? (
						// Empty State
						<div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
							<div className="w-24 h-24 sm:w-32 sm:h-32 bg-muted rounded-full flex items-center justify-center mb-6">
								<Icon
									icon="solar:bookmark-broken"
									className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground"
								/>
							</div>
							<h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-foreground">
								Your watchlist is empty
							</h2>
							<p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-md">
								Start building your watchlist by adding movies and shows you
								want to watch later.
							</p>
							<Button
								onClick={() => router.push("/")}
								className="w-full sm:w-auto">
								<Icon icon="solar:home-bold" className="w-4 h-4 mr-2" />
								Browse Movies
							</Button>
						</div>
					) : (
						// Watchlist Grid
						<div
							className={`
                                grid
                                grid-cols-1
                                sm:grid-cols-2
                                md:grid-cols-3
                                lg:grid-cols-4
                                xl:grid-cols-6
                                gap-6 sm:gap-8
                                ${
																	watchlistMovies.length === 1
																		? "justify-center items-center"
																		: "sm:items-start"
																}
                            `}>
							{watchlistMovies.map((movie) => (
								<PosterCard
									key={movie.id}
									video={movie}
									onClick={() => router.push(`/video/${movie.slug}`)}
									onRemoveFromWatchlist={handleRemoveFromWatchlist}
								/>
							))}
						</div>
					)}
				</div>
			</section>
		</div>
	);
}
