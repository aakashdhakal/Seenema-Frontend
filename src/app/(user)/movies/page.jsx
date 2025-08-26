"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import { useAuthContext } from "@/context/AuthContext";
import Navbar from "@/components/combinedComponents/Navbar";
import PosterCard from "@/components/combinedComponents/PosterCard";
import PageLoadingComponent from "@/components/combinedComponents/PageLoadingComponent";
import CustomDropdown from "@/components/singleComponents/CustomDropdown";
import { addToWatchList, removeFromWatchList } from "@/lib/helper";
import { toast } from "sonner";
import axios from "@/lib/axios";

export default function MoviesPage() {
	const { user, isLoading } = useAuthContext();
	const router = useRouter();
	const [mounted, setMounted] = useState(false);
	const [loading, setLoading] = useState(true);
	const [movies, setMovies] = useState([]);
	const [filteredMovies, setFilteredMovies] = useState([]);
	const [genres, setGenres] = useState([]);
	const [error, setError] = useState(null);

	// Filter and sort states
	const [searchTerm, setSearchTerm] = useState("");
	const [selectedGenre, setSelectedGenre] = useState("all");
	const [sortBy, setSortBy] = useState("newest");
	const [yearFilter, setYearFilter] = useState("all");

	// Watchlist loading states
	const [watchlistLoading, setWatchlistLoading] = useState({});

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
		if (user.status === "suspended") {
			router.push("/suspended");
			return;
		}
	}, [user, isLoading, router]);

	// Fetch movies and genres
	useEffect(() => {
		const fetchData = async () => {
			if (!user) return;

			try {
				setLoading(true);
				setError(null);

				const [moviesResponse, genresResponse] = await Promise.all([
					axios.get("/video/all"),
					axios.get("/genre/get"),
				]);

				// Transform movies data
				const transformedMovies = moviesResponse.data
					.filter((video) => video.status === "ready") // Only show ready videos
					.map((video) => ({
						id: video.id,
						title: video.title,
						poster: video.thumbnail_path,
						backdrop: video.backdrop_path,
						slug: video.slug,
						rating: video.rating || 0,
						year: video.release_year,
						duration: formatDuration(video.duration),
						description: video.description || "No description available",
						genres: video.genres || [],
						resolutions: video.resolutions || [],
						exists_in_watchlist: video.exists_in_watchlist,
						created_at: video.created_at,
						content_rating: video.content_rating,
						language: video.language,
					}));

				setMovies(transformedMovies);
				setFilteredMovies(transformedMovies);
				setGenres(genresResponse.data || []);
			} catch (err) {
				console.error("Error fetching movies:", err);
				setError("Failed to load movies. Please try again.");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, [user]);

	// Filter and sort movies when filters change
	useEffect(() => {
		let filtered = [...movies];

		// Search filter
		if (searchTerm) {
			filtered = filtered.filter(
				(movie) =>
					movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
					movie.description.toLowerCase().includes(searchTerm.toLowerCase()),
			);
		}

		// Genre filter
		if (selectedGenre !== "all") {
			filtered = filtered.filter((movie) =>
				movie.genres.some((genre) => genre.name === selectedGenre),
			);
		}

		// Year filter
		if (yearFilter !== "all") {
			const currentYear = new Date().getFullYear();
			switch (yearFilter) {
				case "2024":
					filtered = filtered.filter((movie) => movie.year === 2024);
					break;
				case "2020s":
					filtered = filtered.filter(
						(movie) => movie.year >= 2020 && movie.year <= currentYear,
					);
					break;
				case "2010s":
					filtered = filtered.filter(
						(movie) => movie.year >= 2010 && movie.year < 2020,
					);
					break;
				case "2000s":
					filtered = filtered.filter(
						(movie) => movie.year >= 2000 && movie.year < 2010,
					);
					break;
				case "older":
					filtered = filtered.filter((movie) => movie.year < 2000);
					break;
			}
		}

		// Sort
		switch (sortBy) {
			case "newest":
				filtered.sort(
					(a, b) => new Date(b.created_at) - new Date(a.created_at),
				);
				break;
			case "oldest":
				filtered.sort(
					(a, b) => new Date(a.created_at) - new Date(b.created_at),
				);
				break;
			case "title-asc":
				filtered.sort((a, b) => a.title.localeCompare(b.title));
				break;
			case "title-desc":
				filtered.sort((a, b) => b.title.localeCompare(a.title));
				break;
			case "rating":
				filtered.sort((a, b) => b.rating - a.rating);
				break;
			case "year-desc":
				filtered.sort((a, b) => b.year - a.year);
				break;
			case "year-asc":
				filtered.sort((a, b) => a.year - b.year);
				break;
		}

		setFilteredMovies(filtered);
	}, [movies, searchTerm, selectedGenre, sortBy, yearFilter]);

	// Handle watchlist toggle
	const handleWatchlistToggle = async (movieId) => {
		setWatchlistLoading((prev) => ({ ...prev, [movieId]: true }));

		try {
			const movie = movies.find((m) => m.id === movieId);

			if (movie.exists_in_watchlist) {
				const response = await removeFromWatchList(movieId);
				if (response.success) {
					setMovies((prev) =>
						prev.map((m) =>
							m.id === movieId ? { ...m, exists_in_watchlist: false } : m,
						),
					);
					toast.success("Removed from watchlist");
				} else {
					toast.error("Failed to remove from watchlist");
				}
			} else {
				const response = await addToWatchList(movieId);
				if (response.success) {
					setMovies((prev) =>
						prev.map((m) =>
							m.id === movieId ? { ...m, exists_in_watchlist: true } : m,
						),
					);
					toast.success("Added to watchlist");
				} else {
					toast.error("Failed to add to watchlist");
				}
			}
		} catch (error) {
			console.error("Error toggling watchlist:", error);
			toast.error("An error occurred");
		} finally {
			setWatchlistLoading((prev) => ({ ...prev, [movieId]: false }));
		}
	};

	// Get unique years for filter
	const getAvailableYears = () => {
		const currentYear = new Date().getFullYear();
		return [
			{ value: "all", label: "All Years" },
			{ value: "2024", label: "2024" },
			{ value: "2020s", label: "2020s" },
			{ value: "2010s", label: "2010s" },
			{ value: "2000s", label: "2000s" },
			{ value: "older", label: "Before 2000" },
		];
	};

	// Get highest resolution for quality badge
	const getQuality = (resolutions) => {
		if (!resolutions || resolutions.length === 0) return "SD";
		const highest = Math.max(...resolutions.map((r) => parseInt(r)));
		if (highest >= 2160) return "4K";
		if (highest >= 1080) return "Full HD";
		if (highest >= 720) return "HD";
		return "SD";
	};

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
			{/* Header Section */}
			<section className="pt-24 sm:pt-28 md:pt-32 pb-8 sm:pb-12 px-4 sm:px-6">
				<div className="container mx-auto">
					<div className="flex items-center gap-4 mb-2">
						<Icon
							icon="material-symbols-light:movie"
							width="3em"
							height="3em"
						/>
						<h1 className="text-2xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
							Movies
						</h1>
					</div>
					<p className="text-muted-foreground text-sm sm:text-base">
						Discover and watch from our collection of {movies.length} movies
					</p>
				</div>
			</section>

			{/* Filters Section */}
			<section className="px-4 sm:px-6 pb-6">
				<div className="container mx-auto">
					<Card className="bg-transparent  border-0 shadow-none">
						<CardContent className="p-4 sm:p-6">
							<div className="flex flex-col lg:flex-row gap-4">
								{/* Search */}
								<div className="flex-1">
									<div className="relative">
										<Icon
											icon="ic:round-search"
											className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
										/>
										<Input
											placeholder="Search movies..."
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
											className="pl-10"
										/>
									</div>
								</div>

								{/* Filters Row */}
								<div className="flex flex-wrap gap-3">
									{/* Genre Filter */}
									<CustomDropdown
										options={["all", ...genres.map((genre) => genre.name)]}
										selectedOption={selectedGenre}
										onSelect={setSelectedGenre}
										placeholder={
											selectedGenre === "all" ? "All Genres" : selectedGenre
										}
										variant="outline"
										size="default"
										icon="solar:tag-bold-duotone"
										className="w-[140px] justify-between"
									/>

									{/* Year Filter */}
									<CustomDropdown
										options={getAvailableYears().map((year) => year.value)}
										selectedOption={yearFilter}
										onSelect={setYearFilter}
										placeholder={
											getAvailableYears().find((y) => y.value === yearFilter)
												?.label || "All Years"
										}
										variant="outline"
										size="default"
										icon="solar:calendar-bold-duotone"
										className="w-[140px] justify-between"
									/>

									{/* Sort Filter */}
									<CustomDropdown
										options={[
											"newest",
											"oldest",
											"title-asc",
											"title-desc",
											"rating",
											"year-desc",
											"year-asc",
										]}
										selectedOption={sortBy}
										onSelect={setSortBy}
										placeholder={
											{
												newest: "Newest First",
												oldest: "Oldest First",
												"title-asc": "Title A-Z",
												"title-desc": "Title Z-A",
												rating: "Highest Rated",
												"year-desc": "Year (New-Old)",
												"year-asc": "Year (Old-New)",
											}[sortBy] || "Sort By"
										}
										variant="outline"
										size="default"
										icon="solar:sort-vertical-bold-duotone"
										className="w-[150px] justify-between"
									/>
								</div>
							</div>

							{/* Active Filters */}
							{(searchTerm ||
								selectedGenre !== "all" ||
								yearFilter !== "all") && (
								<div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
									<span className="text-sm text-muted-foreground">
										Active filters:
									</span>
									{searchTerm && (
										<Badge variant="secondary" className="gap-1">
											Search: {searchTerm}
											<button
												onClick={() => setSearchTerm("")}
												className="ml-1 hover:text-destructive">
												<Icon icon="akar-icons:cross" className="h-3 w-3" />
											</button>
										</Badge>
									)}
									{selectedGenre !== "all" && (
										<Badge variant="secondary" className="gap-1">
											Genre: {selectedGenre}
											<button
												onClick={() => setSelectedGenre("all")}
												className="ml-1 hover:text-destructive">
												<Icon icon="akar-icons:cross" className="h-3 w-3" />
											</button>
										</Badge>
									)}
									{yearFilter !== "all" && (
										<Badge variant="secondary" className="gap-1">
											Year:{" "}
											{
												getAvailableYears().find((y) => y.value === yearFilter)
													?.label
											}
											<button
												onClick={() => setYearFilter("all")}
												className="ml-1 hover:text-destructive">
												<Icon icon="akar-icons:cross" className="h-3 w-3" />
											</button>
										</Badge>
									)}
									<Button
										variant="ghost"
										size="sm"
										onClick={() => {
											setSearchTerm("");
											setSelectedGenre("all");
											setYearFilter("all");
											setSortBy("newest");
										}}
										className="h-6 px-2 text-xs">
										Clear all
									</Button>
								</div>
							)}
						</CardContent>
					</Card>
				</div>
			</section>

			{/* Movies Grid */}
			<section className="px-4 sm:px-6 pb-16 sm:pb-20">
				<div className="container mx-auto">
					{/* Results Summary */}
					<div className="flex items-center justify-between mb-6">
						<p className="text-sm text-muted-foreground">
							Showing {filteredMovies.length} of {movies.length} movies
						</p>
					</div>

					{filteredMovies.length === 0 ? (
						// Empty State
						<div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
							<div className="w-24 h-24 sm:w-32 sm:h-32 bg-muted rounded-full flex items-center justify-center mb-6">
								<Icon
									icon="solar:videocamera-record-broken"
									className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground"
								/>
							</div>
							<h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 text-foreground">
								No movies found
							</h2>
							<p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-md">
								{searchTerm || selectedGenre !== "all" || yearFilter !== "all"
									? "Try adjusting your filters or search terms."
									: "No movies are available right now."}
							</p>
							{(searchTerm ||
								selectedGenre !== "all" ||
								yearFilter !== "all") && (
								<Button
									onClick={() => {
										setSearchTerm("");
										setSelectedGenre("all");
										setYearFilter("all");
									}}
									className="w-full sm:w-auto">
									<Icon icon="solar:refresh-bold" className="w-4 h-4 mr-2" />
									Clear Filters
								</Button>
							)}
						</div>
					) : (
						// Movies Grid
						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6 sm:gap-8">
							{filteredMovies.map((movie) => (
								<PosterCard
									key={movie.id}
									video={movie}
									onClick={() => router.push(`/video/${movie.slug}`)}
									onWatchlistToggle={() => handleWatchlistToggle(movie.id)}
									watchlistLoading={watchlistLoading[movie.id]}
								/>
							))}
						</div>
					)}
				</div>
			</section>
		</div>
	);
}
