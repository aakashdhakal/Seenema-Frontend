"use client";

import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PageLoadingComponent from "@/components/combinedComponents/PageLoadingComponent";
import Navbar from "@/components/combinedComponents/Navbar";
import { Button } from "@/components/ui/button";
import PosterCard from "@/components/combinedComponents/PosterCard";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";

export default function HomePage() {
	const { user, logout, isLoading } = useAuthContext();
	const router = useRouter();
	const [userData, setUserData] = useState(null);
	const [mounted, setMounted] = useState(false);

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
		if (!isLoading && !user) {
			router.replace("/login");
		}
	}, [user, isLoading, router]);

	if (isLoading || !user || !mounted) {
		return <PageLoadingComponent />;
	}

	// Mock data - replace with actual API calls
	const featuredMovie = {
		title: "Stranger Things 4",
		description:
			"When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces, and one strange little girl.",
		backdrop:
			"https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
		rating: "8.7",
		year: "2022",
		genre: "Sci-Fi • Drama • Horror",
		duration: "1h 17m",
	};

	const movieRows = [
		{
			title: "Trending Now",
			movies: [
				{
					id: 1,
					title: "The Batman",
					poster:
						"https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T25onhq.jpg",
				},
				{
					id: 2,
					title: "Spider-Man: No Way Home",
					poster:
						"https://image.tmdb.org/t/p/w500/1g0dhYtq4irTY1GPXvft6k4YLjm.jpg",
				},
				{
					id: 3,
					title: "Dune",
					poster:
						"https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgV94XAgMIckC.jpg",
				},
				{
					id: 4,
					title: "No Time to Die",
					poster:
						"https://image.tmdb.org/t/p/w500/iUgygt3fscRoKWCV1d0C7FbM9TP.jpg",
				},
				{
					id: 5,
					title: "The Matrix Resurrections",
					poster:
						"https://image.tmdb.org/t/p/w500/8c4a8kE7PizaGQQnditMmI1xbRp.jpg",
				},
				{
					id: 6,
					title: "Eternals",
					poster:
						"https://image.tmdb.org/t/p/w500/6AdXwFTRTAzggD2QUTt5B7JFGKL.jpg",
				},
			],
		},
		{
			title: "Popular on Seenema",
			movies: [
				{
					id: 7,
					title: "Squid Game",
					poster:
						"https://image.tmdb.org/t/p/w500/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg",
				},
				{
					id: 8,
					title: "Money Heist",
					poster:
						"https://image.tmdb.org/t/p/w500/reEMJA1uzscCbkpeRJeTT2bjqUp.jpg",
				},
				{
					id: 9,
					title: "Bridgerton",
					poster:
						"https://image.tmdb.org/t/p/w500/luoKpgVwi1E5nQsi7W0UuKHu2R8.jpg",
				},
				{
					id: 10,
					title: "The Witcher",
					poster:
						"https://image.tmdb.org/t/p/w500/7vjaCdMw15FEbXyLQTVa04URsPm.jpg",
				},
				{
					id: 11,
					title: "Ozark",
					poster:
						"https://image.tmdb.org/t/p/w500/m73QUZ7KC0UVfpHsiAE6WRA3gBG.jpg",
				},
				{
					id: 12,
					title: "The Crown",
					poster:
						"https://image.tmdb.org/t/p/w500/1M876KPjulVwppEpldhdc8V4o68.jpg",
				},
			],
		},
		{
			title: "New Releases",
			movies: [
				{
					id: 13,
					title: "Top Gun: Maverick",
					poster:
						"https://image.tmdb.org/t/p/w500/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
				},
				{
					id: 14,
					title: "Doctor Strange 2",
					poster:
						"https://image.tmdb.org/t/p/w500/9Gtg2DzBhmYamXBS1hKAhiwbBKS.jpg",
				},
				{
					id: 15,
					title: "Minions: The Rise of Gru",
					poster:
						"https://image.tmdb.org/t/p/w500/wKiOkZTN9lUUUNZLmtnwubZYONg.jpg",
				},
				{
					id: 16,
					title: "Thor: Love and Thunder",
					poster:
						"https://image.tmdb.org/t/p/w500/pIkRyD18kl4FhoCNQuWxWu5cBLM.jpg",
				},
				{
					id: 17,
					title: "Lightyear",
					poster:
						"https://image.tmdb.org/t/p/w500/ox4goZd956BxqJH6iLwhWPL9ct4.jpg",
				},
				{
					id: 18,
					title: "Jurassic World Dominion",
					poster:
						"https://image.tmdb.org/t/p/w500/kAVRgw7GgK1CfYEJq8ME6EvRIgU.jpg",
				},
			],
		},
		{
			title: "Action & Adventure",
			movies: [
				{
					id: 19,
					title: "John Wick",
					poster:
						"https://image.tmdb.org/t/p/w500/fZPSd91yGE9fCcCe6OoQr6E3Bev.jpg",
				},
				{
					id: 20,
					title: "Mad Max: Fury Road",
					poster:
						"https://image.tmdb.org/t/p/w500/hA2ple9q4qnwxp3hKVNhroipsir.jpg",
				},
				{
					id: 21,
					title: "Mission: Impossible",
					poster:
						"https://image.tmdb.org/t/p/w500/AkJQpZp9WoNdj7pLYSj1L0RcMMN.jpg",
				},
				{
					id: 22,
					title: "Fast & Furious 9",
					poster:
						"https://image.tmdb.org/t/p/w500/bOFaAXmWWXC3Rbv4u4uM9ZSzRXP.jpg",
				},
				{
					id: 23,
					title: "Wonder Woman 1984",
					poster:
						"https://image.tmdb.org/t/p/w500/8UlWHLMpgZm9bx6QYh0NFoq67TZ.jpg",
				},
				{
					id: 24,
					title: "Black Widow",
					poster:
						"https://image.tmdb.org/t/p/w500/qAZ0pzat24kLdO3o8ejmbLxyOac.jpg",
				},
			],
		},
		{
			title: "My List",
			movies: [
				{
					id: 25,
					title: "Breaking Bad",
					poster:
						"https://image.tmdb.org/t/p/w500/3xnWaLQjelJDDF7LT1WBo6f4BRe.jpg",
				},
				{
					id: 26,
					title: "Game of Thrones",
					poster:
						"https://image.tmdb.org/t/p/w500/7WUHnWGx5OO145IRxPDUkQSh4C7.jpg",
				},
				{
					id: 27,
					title: "The Office",
					poster:
						"https://image.tmdb.org/t/p/w500/7DJKHzAi83BmQrWLrYYOqcoKfhR.jpg",
				},
				{
					id: 28,
					title: "Friends",
					poster:
						"https://image.tmdb.org/t/p/w500/f496cm9enuEsZkSPzCwnTESEK5s.jpg",
				},
				{
					id: 29,
					title: "Narcos",
					poster:
						"https://image.tmdb.org/t/p/w500/rTmal9fDbwh5F0waol2hq35U4ah.jpg",
				},
				{
					id: 30,
					title: "House of Cards",
					poster:
						"https://image.tmdb.org/t/p/w500/aXTAO4UbqKdJ6OWlDvpAMCfnMSl.jpg",
				},
			],
		},
	];

	return (
		<div className="min-h-screen bg-background">
			<Navbar />

			{/* Featured Hero Section */}
			<section className="relative h-[85vh] overflow-hidden">
				<div
					className="absolute inset-0 bg-cover bg-center bg-no-repeat"
					style={{ backgroundImage: `url(${featuredMovie.backdrop})` }}>
					<div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
					<div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
				</div>

				{/* Decorative Elements */}
				<div className="absolute top-20 left-20 w-32 h-32 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
				<div className="absolute bottom-40 right-32 w-48 h-48 bg-primary/3 rounded-full blur-3xl animate-pulse delay-1000"></div>

				<div className="relative h-full flex items-center">
					<div className="container mx-auto px-6">
						<div className="max-w-3xl">
							{/* Status Badge */}
							<Badge className="mb-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground border-none px-4 py-2 text-sm shadow-lg">
								<Icon icon="solar:fire-bold-duotone" className="w-4 h-4 mr-2" />
								#1 Trending Today
							</Badge>

							{/* Title */}
							<h1 className="text-6xl md:text-8xl font-bold mb-8 leading-tight text-foreground">
								<span className="bg-gradient-to-r bg-clip-text text-transparent from-foreground via-primary/90 to-primary">
									{featuredMovie.title}
								</span>
							</h1>

							{/* Metadata */}
							<div className="flex items-center gap-6 mb-8 text-foreground/90">
								<div className="flex items-center gap-2 backdrop-blur-sm px-3 py-1 rounded-full bg-foreground/10">
									<Icon
										icon="solar:star-bold-duotone"
										className="w-5 h-5 text-yellow-400"
									/>
									<span className="font-semibold">{featuredMovie.rating}</span>
								</div>
								<span className="text-lg">{featuredMovie.year}</span>
								<span className="text-lg">{featuredMovie.duration}</span>
								<Badge
									variant="outline"
									className="border-primary/50 text-primary bg-primary/10 hover:bg-primary/20">
									4K HDR
								</Badge>
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
									onClick={() => router.push("/watch/stranger-things")}>
									<Icon icon="solar:play-bold" className="w-7 h-7 mr-3" />
									Play Now
								</Button>
								<Button
									variant="outline"
									size="lg"
									className="backdrop-blur-sm px-10 py-6 text-lg border-border text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-300"
									onClick={() => router.push("/info/stranger-things")}>
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

			{/* Movie Rows */}
			<section className="relative -mt-24 z-10 pb-20">
				{movieRows.map((row, rowIndex) => (
					<div key={rowIndex} className="mb-16">
						<div className="container mx-auto px-6">
							{/* Row Header */}
							<div className="flex items-center justify-between mb-8">
								<h2 className="text-3xl font-bold flex items-center gap-4 text-foreground">
									{row.title}
									<div className="w-12 h-1 bg-gradient-to-r from-primary to-primary/60 rounded-full"></div>
								</h2>
								<Button
									variant="ghost"
									className="text-primary hover:text-primary/80 hover:bg-primary/10">
									<span className="mr-2">View All</span>
									<Icon icon="solar:arrow-right-bold" className="w-4 h-4" />
								</Button>
							</div>

							{/* Movie Cards */}
							<div className="flex gap-6 overflow-x-auto scrollbar-hide pb-6">
								{row.movies.map((movie) => (
									<PosterCard
										key={movie.id}
										video={{
											title: movie.title,
											poster: movie.poster,
											quality: "4K",
										}}
										onClick={() =>
											router.push(`/watch/${movie.title.toLowerCase()}`)
										}
									/>
								))}
							</div>
						</div>
					</div>
				))}
			</section>

			{/* Continue Watching */}
			<section className="container mx-auto px-6 py-16">
				<div className="flex items-center justify-between mb-8">
					<h2 className="text-3xl font-bold flex items-center gap-4 text-foreground">
						Continue Watching for {userData?.name}
						<div className="w-12 h-1 bg-gradient-to-r from-primary to-primary/60 rounded-full"></div>
					</h2>
				</div>

				<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
					{[
						{
							title: "The Witcher",
							episode: "S2 E5 • The Turn of a Friendly Card",
							progress: 65,
							timeLeft: "23 min left",
							poster:
								"https://image.tmdb.org/t/p/w500/7vjaCdMw15FEbXyLQTVa04URsPm.jpg",
						},
						{
							title: "Ozark",
							episode: "S4 E2 • Let the Great World Spin",
							progress: 23,
							timeLeft: "42 min left",
							poster:
								"https://image.tmdb.org/t/p/w500/m73QUZ7KC0UVfpHsiAE6WRA3gBG.jpg",
						},
						{
							title: "Stranger Things",
							episode: "S4 E7 • The Massacre at Hawkins Lab",
							progress: 88,
							timeLeft: "8 min left",
							poster:
								"https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
						},
					].map((item, index) => (
						<PosterCard
							key={index}
							video={{
								title: item.title,
								episode: item.episode,
								progress: item.progress,
								timeLeft: item.timeLeft,
								poster: item.poster,
							}}
							onClick={() => router.push(`/watch/${item.title.toLowerCase()}`)}
						/>
					))}
				</div>
			</section>

			{/* Additional Features Section */}
			<section className="container mx-auto px-6 py-16 border-t border-border">
				<div className="grid md:grid-cols-3 gap-8">
					<div className="text-center p-8 rounded-xl bg-card hover:bg-card/80 transition-colors duration-300">
						<div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
							<Icon
								icon="solar:monitor-smartphone-bold-duotone"
								className="w-8 h-8 text-primary"
							/>
						</div>
						<h3 className="text-xl font-semibold mb-3 text-card-foreground">
							Watch Anywhere
						</h3>
						<p className="text-muted-foreground">
							Stream on your TV, laptop, phone, and tablet
						</p>
					</div>

					<div className="text-center p-8 rounded-xl bg-card hover:bg-card/80 transition-colors duration-300">
						<div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
							<Icon
								icon="solar:download-bold-duotone"
								className="w-8 h-8 text-primary"
							/>
						</div>
						<h3 className="text-xl font-semibold mb-3 text-card-foreground">
							Download & Go
						</h3>
						<p className="text-muted-foreground">
							Download titles to watch offline anytime
						</p>
					</div>

					<div className="text-center p-8 rounded-xl bg-card hover:bg-card/80 transition-colors duration-300">
						<div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
							<Icon
								icon="solar:users-group-rounded-bold-duotone"
								className="w-8 h-8 text-primary"
							/>
						</div>
						<h3 className="text-xl font-semibold mb-3 text-card-foreground">
							Family Profiles
						</h3>
						<p className="text-muted-foreground">
							Create profiles for kids with age-appropriate content
						</p>
					</div>
				</div>
			</section>
		</div>
	);
}
