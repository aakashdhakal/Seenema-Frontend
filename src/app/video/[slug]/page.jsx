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

export default function VideoDetailsPage() {
	const { slug } = useParams();
	const router = useRouter();
	const [mounted, setMounted] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [videoData, setVideoData] = useState(null);
	const [activeTab, setActiveTab] = useState("overview");

	useEffect(() => {
		setMounted(true);
		// Simulate loading
		setTimeout(() => {
			setIsLoading(false);
		}, 1000);
	}, []);

	// Mock video data - replace with actual API call
	useEffect(() => {
		if (slug) {
			const mockData = {
				id: slug,
				title: "Stranger Things",
				year: "2016-2025",
				rating: "8.7",
				duration: "4 Seasons",
				genre: ["Sci-Fi", "Drama", "Horror", "Thriller"],
				maturityRating: "TV-14",
				description:
					"When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces, and one strange little girl. Set in 1980s Indiana, this supernatural thriller follows the adventures of a group of friends as they encounter government conspiracies and supernatural entities from an alternate dimension known as the Upside Down.",
				longDescription:
					"In the fictional town of Hawkins, Indiana, during the 1980s, a secret government laboratory conducting experiments accidentally opens a portal to an alternate dimension referred to as the 'Upside Down'. The influence of the Upside Down starts to affect the unknowing residents of Hawkins in calamitous ways. When twelve-year-old Will Byers goes missing, his mother Joyce and the town's police chief Jim Hopper begin their own investigation into his disappearance. At the same time, a young psychokinetic girl called Eleven escapes from the laboratory and assists Will's friends Mike, Dustin, and Lucas in their own search.",
				cast: [
					{
						name: "Millie Bobby Brown",
						character: "Eleven",
						image:
							"https://image.tmdb.org/t/p/w200/qpTZOI5cEGPoUb6IpBMsCpQQ7kY.jpg",
					},
					{
						name: "Finn Wolfhard",
						character: "Mike Wheeler",
						image:
							"https://image.tmdb.org/t/p/w200/sNuNaREJKFrgYFyB7iVqhTrvxUD.jpg",
					},
					{
						name: "David Harbour",
						character: "Jim Hopper",
						image:
							"https://image.tmdb.org/t/p/w200/chPekukMF5TNVIoRmHnKKVkUjkF.jpg",
					},
					{
						name: "Winona Ryder",
						character: "Joyce Byers",
						image:
							"https://image.tmdb.org/t/p/w200/zjhg1Y9SRNeJt1FzjvQSbQOPNVk.jpg",
					},
					{
						name: "Gaten Matarazzo",
						character: "Dustin Henderson",
						image:
							"https://image.tmdb.org/t/p/w200/x5nL3IKhvFDYkVNdkJGjJsZUhwN.jpg",
					},
					{
						name: "Caleb McLaughlin",
						character: "Lucas Sinclair",
						image:
							"https://image.tmdb.org/t/p/w200/2dITdACoANaPEShKaVy0jEb9T4c.jpg",
					},
				],
				crew: [
					{
						name: "The Duffer Brothers",
						role: "Creators & Executive Producers",
					},
					{ name: "Shawn Levy", role: "Executive Producer & Director" },
					{ name: "Dan Cohen", role: "Executive Producer" },
					{ name: "Iain Paterson", role: "Executive Producer" },
				],
				backdrop:
					"https://image.tmdb.org/t/p/original/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
				poster:
					"https://image.tmdb.org/t/p/w500/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
				trailer: "https://www.youtube.com/watch?v=b9EkMc79ZSU",
				awards: [
					"Screen Actors Guild Award Outstanding Performance",
					"Emmy Nomination for Outstanding Drama Series",
					"Critics Choice Award for Best Sci-Fi/Horror Series",
					"People's Choice Award for Favorite Premium Series",
				],
				facts: [
					"The show is set in the fictional town of Hawkins, Indiana",
					"Filmed primarily in Atlanta, Georgia",
					"The Upside Down was inspired by Silent Hill",
					"Originally pitched as a limited series",
					"The kids' characters were aged up for later seasons",
				],
				episodes: [
					{
						season: 1,
						title: "Season 1: The Vanishing of Will Byers",
						episodes: 8,
						year: "2016",
						description:
							"A young boy disappears, and his mother, friends, and the sheriff must confront terrifying supernatural forces.",
						poster:
							"https://image.tmdb.org/t/p/w300/aagCrxR2aZhVfDa9CPTCeSGK0FV.jpg",
					},
					{
						season: 2,
						title: "Season 2: The Mind Flayer",
						episodes: 9,
						year: "2017",
						description:
							"Will struggles with his connection to the Upside Down, while a new threat emerges.",
						poster:
							"https://image.tmdb.org/t/p/w300/78aK4Msbr22A5PGa6PZV0pAvdwf.jpg",
					},
					{
						season: 3,
						title: "Season 3: The Battle of Starcourt",
						episodes: 8,
						year: "2019",
						description:
							"The gang must stop a powerful new enemy that threatens the town of Hawkins.",
						poster:
							"https://image.tmdb.org/t/p/w300/x2LSRK2Cm7MZhjluni1msVJ3wDF.jpg",
					},
					{
						season: 4,
						title: "Season 4: The Hellfire Club",
						episodes: 9,
						year: "2022",
						description:
							"A new horror begins to surface, something long buried, something that connects everything.",
						poster:
							"https://image.tmdb.org/t/p/w300/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
					},
				],
				similar: [
					{
						id: "dark",
						title: "Dark",
						poster:
							"https://image.tmdb.org/t/p/w500/1ajNmPpIHnYNPqjUf5kUALPxqcp.jpg",
					},
					{
						id: "the-witcher",
						title: "The Witcher",
						poster:
							"https://image.tmdb.org/t/p/w500/7vjaCdMw15FEbXyLQTVa04URsPm.jpg",
					},
					{
						id: "umbrella-academy",
						title: "The Umbrella Academy",
						poster:
							"https://image.tmdb.org/t/p/w500/scZlQQYnDVlnpxFTxaIv2g0BWnL.jpg",
					},
					{
						id: "squid-game",
						title: "Squid Game",
						poster:
							"https://image.tmdb.org/t/p/w500/dDlEmu3EZ0Pgg93K2SVNLCjCSvE.jpg",
					},
				],
			};
			setVideoData(mockData);
		}
	}, [slug]);

	if (!mounted || isLoading) {
		return <PageLoadingComponent />;
	}

	if (!videoData) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<Icon
						icon="solar:video-library-bold-duotone"
						className="w-24 h-24 text-primary mx-auto mb-4"
					/>
					<h1 className="text-2xl font-bold mb-4 text-foreground">
						Video Not Found
					</h1>
					<p className="mb-6 text-muted-foreground">
						The video you're looking for doesn't exist or has been removed.
					</p>
					<Button
						onClick={() => router.push("/home")}
						className="bg-primary hover:bg-primary/90 text-primary-foreground">
						<Icon icon="solar:arrow-left-bold" className="w-4 h-4 mr-2" />
						Go Back Home
					</Button>
				</div>
			</div>
		);
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
									<span className="bg-gradient-to-r bg-clip-text text-transparent from-foreground via-primary/90 to-primary">
										{videoData.title}
									</span>
								</h1>

								{/* Metadata */}
								<div className="flex flex-wrap items-center gap-4 mb-6">
									<div className="flex items-center gap-2 backdrop-blur-sm px-3 py-1 rounded-full bg-foreground/10 text-foreground/90">
										<Icon
											icon="solar:star-bold-duotone"
											className="w-4 h-4 text-yellow-400"
										/>
										<span className="font-semibold">{videoData.rating}</span>
									</div>
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
										4K HDR
									</Badge>
								</div>

								{/* Genres */}
								<div className="flex flex-wrap gap-2 mb-6">
									{videoData.genre.map((g, index) => (
										<Badge
											key={index}
											variant="outline"
											className="border-primary/30 text-primary bg-primary/10 hover:bg-primary/20">
											{g}
										</Badge>
									))}
								</div>

								{/* Description */}
								<p className="text-lg mb-8 leading-relaxed text-foreground/90">
									{videoData.description}
								</p>

								{/* Action Buttons */}
								<div className="flex flex-wrap gap-4">
									<Button
										size="lg"
										className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg font-semibold shadow-lg transition-all duration-300 hover:shadow-xl hover:shadow-primary/25"
										onClick={() => router.push(`/video/play/${videoData.id}`)}>
										<Icon icon="solar:play-bold" className="w-6 h-6 mr-2" />
										Watch Now
									</Button>
									<Button
										variant="outline"
										size="lg"
										className="backdrop-blur-sm px-8 py-3 text-lg border-border text-foreground hover:bg-accent hover:text-accent-foreground">
										<Icon icon="solar:bookmark-bold" className="w-6 h-6 mr-2" />
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
					<div className="flex flex-wrap gap-4 mb-8 border-b border-border">
						{[
							{
								id: "overview",
								label: "Overview",
								icon: "solar:info-circle-bold",
							},
							{
								id: "cast",
								label: "Cast & Crew",
								icon: "solar:users-group-rounded-bold",
							},
							{
								id: "episodes",
								label: "Episodes",
								icon: "solar:video-library-bold",
							},
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

								<div>
									<h3 className="text-2xl font-bold mb-4 text-foreground">
										Awards & Recognition
									</h3>
									<div className="grid md:grid-cols-2 gap-4">
										{videoData.awards.map((award, index) => (
											<div
												key={index}
												className="flex items-center p-4 rounded-lg bg-card hover:bg-card/80 transition-colors duration-300">
												<Icon
													icon="solar:medal-star-bold-duotone"
													className="w-6 h-6 text-yellow-500 mr-3"
												/>
												<span className="text-card-foreground">{award}</span>
											</div>
										))}
									</div>
								</div>
							</div>
						)}

						{activeTab === "cast" && (
							<div className="space-y-8">
								<div>
									<h3 className="text-2xl font-bold mb-6 text-foreground">
										Main Cast
									</h3>
									<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
										{videoData.cast.map((actor, index) => (
											<Card
												key={index}
												className="bg-card border-border hover:border-primary/50 transition-all duration-300 cursor-pointer group">
												<CardContent className="p-4">
													<div className="relative aspect-square mb-3 rounded-lg overflow-hidden">
														<Image
															src={actor.image}
															alt={actor.name}
															fill
															className="object-cover group-hover:scale-105 transition-transform duration-300"
														/>
													</div>
													<h4 className="font-semibold text-sm mb-1 text-card-foreground">
														{actor.name}
													</h4>
													<p className="text-xs text-muted-foreground">
														{actor.character}
													</p>
												</CardContent>
											</Card>
										))}
									</div>
								</div>

								<div>
									<h3 className="text-2xl font-bold mb-6 text-foreground">
										Crew
									</h3>
									<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
										{videoData.crew.map((member, index) => (
											<div
												key={index}
												className="p-4 rounded-lg bg-card hover:bg-card/80 transition-colors duration-300">
												<h4 className="font-semibold mb-1 text-card-foreground">
													{member.name}
												</h4>
												<p className="text-sm text-muted-foreground">
													{member.role}
												</p>
											</div>
										))}
									</div>
								</div>
							</div>
						)}

						{activeTab === "episodes" && (
							<div>
								<h3 className="text-2xl font-bold mb-6 text-foreground">
									Seasons & Episodes
								</h3>
								<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
									{videoData.episodes.map((season, index) => (
										<Card
											key={index}
											className="bg-card border-border hover:border-primary/50 transition-all duration-300 cursor-pointer group">
											<CardContent className="p-0">
												<div className="relative aspect-video overflow-hidden rounded-t-lg">
													<Image
														src={season.poster}
														alt={season.title}
														fill
														className="object-cover group-hover:scale-105 transition-transform duration-300"
													/>
												</div>
												<div className="p-4">
													<h4 className="font-bold text-lg mb-2 text-card-foreground">
														Season {season.season}
													</h4>
													<div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
														<Icon
															icon="solar:calendar-bold"
															className="w-4 h-4"
														/>
														<span>{season.year}</span>
														<span>•</span>
														<span>{season.episodes} Episodes</span>
													</div>
													<p className="text-xs leading-relaxed text-card-foreground/80">
														{season.description}
													</p>
												</div>
											</CardContent>
										</Card>
									))}
								</div>
							</div>
						)}

						{activeTab === "details" && (
							<div className="space-y-8">
								<div>
									<h3 className="text-2xl font-bold mb-6 text-foreground">
										Production Details
									</h3>
									<div className="grid md:grid-cols-2 gap-8">
										<div className="space-y-4">
											<div className="p-4 rounded-lg bg-card">
												<h4 className="font-semibold mb-2 text-primary">
													Genre
												</h4>
												<p className="text-card-foreground">
													{videoData.genre.join(", ")}
												</p>
											</div>
											<div className="p-4 rounded-lg bg-card">
												<h4 className="font-semibold mb-2 text-primary">
													Release Year
												</h4>
												<p className="text-card-foreground">{videoData.year}</p>
											</div>
											<div className="p-4 rounded-lg bg-card">
												<h4 className="font-semibold mb-2 text-primary">
													Rating
												</h4>
												<p className="text-card-foreground">
													{videoData.maturityRating}
												</p>
											</div>
										</div>
										<div>
											<h4 className="font-semibold mb-4 text-foreground">
												Interesting Facts
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

					{/* Similar Content */}
					<Separator className="my-16" />
					<div>
						<h2 className="text-3xl font-bold mb-8 flex items-center gap-4 text-foreground">
							More Like This
							<div className="w-12 h-1 bg-gradient-to-r from-primary to-primary/60 rounded-full"></div>
						</h2>
						<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
							{videoData.similar.map((item, index) => (
								<Card
									key={index}
									className="bg-card border-border hover:border-primary/50 transition-all duration-300 cursor-pointer group"
									onClick={() => router.push(`/video/${item.id}`)}>
									<CardContent className="p-0">
										<div className="relative aspect-[2/3] overflow-hidden rounded-lg">
											<Image
												src={item.poster}
												alt={item.title}
												fill
												className="object-cover group-hover:scale-105 transition-transform duration-300"
											/>
											<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
											<div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
												<h4 className="text-white font-semibold text-sm mb-2">
													{item.title}
												</h4>
												<Button
													size="sm"
													className="bg-primary hover:bg-primary/90 text-primary-foreground">
													<Icon
														icon="solar:play-bold"
														className="w-3 h-3 mr-1"
													/>
													Play
												</Button>
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
