"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@iconify/react";
import axios from "@/lib/axios";
import PosterCard from "@/components/combinedComponents/PosterCard";

export default function SearchPage() {
	const params = useParams();
	const router = useRouter();

	const keyword = decodeURIComponent(params.keyword || "");
	const [results, setResults] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);

	// Pagination
	const [currentPage, setCurrentPage] = useState(1);
	const resultsPerPage = 20;

	useEffect(() => {
		if (keyword) {
			performSearch();
		} else {
			setLoading(false);
		}
	}, [keyword, currentPage]);

	const performSearch = async () => {
		setLoading(true);
		setError(null);

		try {
			const response = await axios.get("/search", {
				params: {
					q: keyword,
					page: currentPage,
					limit: resultsPerPage,
				},
			});

			setResults(response.data || []);
		} catch (err) {
			console.error("Search error:", err);
			setError("Failed to fetch search results. Please try again.");
			setResults([]);
		} finally {
			setLoading(false);
		}
	};

	const handleVideoClick = (video) => {
		router.push(`/video/${video.slug}`);
	};

	// Transform backend data to match PosterCard expectations
	const transformedResults = results.map((item) => ({
		id: item.id,
		title: item.title || item.name,
		poster: item.poster_path,
		slug: item.slug,
		rating: item.vote_average,
		genres: item.genres || [],
		duration: item.duration,
		releaseYear: item.release_date
			? new Date(item.release_date).getFullYear()
			: null,
		overview: item.overview,
		type: item.type,
		isNew: false,
		resolutions: ["HD"],
	}));

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
			{/* Modern Header */}
			<div className="relative pt-28 pb-8">
				<div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
				<div className="container mx-auto px-6 max-w-7xl relative">
					{keyword ? (
						<div className="space-y-6">
							{/* Search Query Display */}
							<div className="flex items-center gap-4 mb-8">
								<div className="p-3 rounded-2xl bg-primary/10 backdrop-blur-sm">
									<Icon
										icon="solar:magnifer-bold"
										className="w-6 h-6 text-primary"
									/>
								</div>
								<div>
									<h1 className="text-3xl md:text-4xl font-bold text-foreground">
										Search Results
									</h1>
									<div className="flex items-center gap-3 mt-2">
										<span className="text-muted-foreground">for</span>
										<Badge
											variant="secondary"
											className="px-4 py-1 bg-primary/10 text-primary border-0 text-base font-medium">
											"{keyword}"
										</Badge>
									</div>
								</div>
							</div>

							{/* Results Stats */}
							{!loading && (
								<div className="flex items-center gap-6 text-sm text-muted-foreground">
									<div className="flex items-center gap-2">
										<div className="w-2 h-2 rounded-full bg-primary/60" />
										<span>
											{results.length} result{results.length !== 1 ? "s" : ""}
										</span>
									</div>
									<div className="flex items-center gap-2">
										<div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
										<span>Page {currentPage}</span>
									</div>
								</div>
							)}
						</div>
					) : (
						<div className="text-center space-y-6 py-16">
							<div className="w-24 h-24 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
								<Icon
									icon="solar:magnifer-bold-duotone"
									className="w-12 h-12 text-primary"
								/>
							</div>
							<div className="space-y-3">
								<h1 className="text-4xl md:text-5xl font-bold text-foreground">
									Discover Content
								</h1>
								<p className="text-lg text-muted-foreground max-w-md mx-auto">
									Use the search bar in the navigation to find your favorite
									content
								</p>
							</div>
						</div>
					)}
				</div>
			</div>

			{/* Main Content Area */}
			<div className="container mx-auto px-6 pb-12 max-w-7xl">
				{/* Loading State */}
				{loading && (
					<div className="space-y-8">
						<div className="flex items-center justify-center gap-3 text-muted-foreground mb-8">
							<div className="w-6 h-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
							<span className="font-medium">Searching...</span>
						</div>

						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 md:gap-6">
							{Array.from({ length: 14 }).map((_, index) => (
								<div key={index} className="space-y-3">
									<Skeleton className="aspect-[2/3] w-full rounded-xl bg-muted/50" />
									<Skeleton className="h-4 w-3/4 bg-muted/30" />
									<Skeleton className="h-3 w-1/2 bg-muted/20" />
								</div>
							))}
						</div>
					</div>
				)}

				{/* Error State */}
				{error && (
					<div className="flex items-center justify-center py-20">
						<div className="text-center space-y-6 max-w-md">
							<div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 flex items-center justify-center">
								<Icon
									icon="solar:danger-circle-bold"
									className="w-8 h-8 text-red-500"
								/>
							</div>
							<div className="space-y-2">
								<h3 className="text-xl font-semibold text-foreground">
									Search Failed
								</h3>
								<p className="text-muted-foreground">{error}</p>
							</div>
							<Button
								onClick={performSearch}
								className="bg-red-500 hover:bg-red-600 text-white">
								<Icon icon="solar:refresh-bold" className="w-4 h-4 mr-2" />
								Try Again
							</Button>
						</div>
					</div>
				)}

				{/* Results Grid */}
				{!loading && !error && results.length > 0 && (
					<div className="space-y-8">
						{/* Filter Bar */}
						<div className="flex items-center justify-between p-4 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
							<div className="flex items-center gap-4">
								<Badge
									variant="outline"
									className="bg-background/80 border-border/60">
									{results.length} Results
								</Badge>
								<div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
									<Icon icon="solar:sort-horizontal-bold" className="w-4 h-4" />
									<span>Relevance</span>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<Button
									variant="ghost"
									size="sm"
									className="h-8 w-8 p-0 bg-background/80">
									<Icon icon="solar:widget-4-bold" className="w-4 h-4" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									className="h-8 w-8 p-0 opacity-40">
									<Icon icon="solar:list-bold" className="w-4 h-4" />
								</Button>
							</div>
						</div>

						{/* Videos Grid */}
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 md:gap-6">
							{transformedResults.map((video) => (
								<PosterCard
									key={video.id}
									video={video}
									onClick={() => handleVideoClick(video)}
								/>
							))}
						</div>

						{/* Pagination */}
						{results.length >= resultsPerPage && (
							<div className="flex justify-center pt-8">
								<div className="flex items-center gap-2 p-2 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50">
									<Button
										variant="ghost"
										onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
										disabled={currentPage === 1}
										className="disabled:opacity-40">
										<Icon icon="solar:chevron-left-bold" className="w-4 h-4" />
									</Button>

									<div className="px-4 py-2 text-sm font-medium text-muted-foreground">
										{currentPage}
									</div>

									<Button
										variant="ghost"
										onClick={() => setCurrentPage(currentPage + 1)}
										disabled={results.length < resultsPerPage}
										className="disabled:opacity-40">
										<Icon icon="solar:chevron-right-bold" className="w-4 h-4" />
									</Button>
								</div>
							</div>
						)}
					</div>
				)}

				{/* No Results */}
				{!loading && !error && results.length === 0 && keyword && (
					<div className="flex items-center justify-center py-20">
						<div className="text-center space-y-6 max-w-lg">
							<div className="w-20 h-20 mx-auto rounded-2xl bg-muted/30 flex items-center justify-center">
								<Icon
									icon="solar:file-search-bold"
									className="w-10 h-10 text-muted-foreground"
								/>
							</div>
							<div className="space-y-3">
								<h3 className="text-2xl font-bold text-foreground">
									No Results Found
								</h3>
								<p className="text-muted-foreground leading-relaxed">
									We couldn't find any content matching{" "}
									<span className="font-semibold text-foreground">
										"{keyword}"
									</span>
									. Try a different search term.
								</p>
							</div>
							<div className="flex gap-3 justify-center">
								<Button
									onClick={() => router.push("/search")}
									variant="outline">
									<Icon icon="solar:refresh-bold" className="w-4 h-4 mr-2" />
									New Search
								</Button>
								<Button onClick={() => router.push("/")}>
									<Icon icon="solar:home-bold" className="w-4 h-4 mr-2" />
									Browse All
								</Button>
							</div>
						</div>
					</div>
				)}

				{/* Empty State - Welcome */}
				{!keyword && !loading && (
					<div className="space-y-12">
						{/* Welcome Content */}
						<div className="text-center space-y-6">
							<h2 className="text-2xl md:text-3xl font-bold text-foreground">
								What are you looking for?
							</h2>
							<p className="text-muted-foreground max-w-xl mx-auto">
								Search through our vast collection of movies, shows, and
								documentaries. Find content by title, genre, cast, or keywords.
							</p>
						</div>

						{/* Feature Cards */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							{[
								{
									icon: "solar:video-library-bold-duotone",
									title: "Movies & Shows",
									description: "Browse thousands of titles across all genres",
								},
								{
									icon: "solar:user-circle-bold-duotone",
									title: "Find by Cast",
									description:
										"Search for content featuring your favorite actors",
								},
								{
									icon: "solar:hashtag-circle-bold-duotone",
									title: "Genres & Tags",
									description: "Discover content by category and mood",
								},
							].map((feature, index) => (
								<div
									key={index}
									className="p-6 rounded-2xl bg-card/30 backdrop-blur-sm border border-border/50 hover:bg-card/50 transition-colors">
									<div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
										<Icon
											icon={feature.icon}
											className="w-6 h-6 text-primary"
										/>
									</div>
									<h4 className="font-semibold text-foreground mb-2">
										{feature.title}
									</h4>
									<p className="text-sm text-muted-foreground">
										{feature.description}
									</p>
								</div>
							))}
						</div>

						{/* Call to Action */}
						<div className="text-center">
							<Button
								onClick={() => router.push("/")}
								size="lg"
								className="px-8">
								<Icon icon="solar:compass-bold" className="w-5 h-5 mr-2" />
								Explore All Content
							</Button>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
