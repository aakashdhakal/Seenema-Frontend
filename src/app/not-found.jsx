"use client";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFound() {
	const router = useRouter();

	return (
		<div className="min-h-screen flex items-center justify-center  overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black">
			{/* Main content */}
			<div className="relative z-10 text-center px-6 max-w-2xl mx-auto">
				{/* 404 with film reel icon */}
				<div className="relative mb-8">
					<h1 className="text-[12rem] md:text-[16rem] font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary/50 to-emerald-300/50 leading-none">
						404
					</h1>
				</div>

				{/* Error message */}
				<div className="mb-8 space-y-4">
					<h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
						Oops! Scene Not Found
					</h2>
					<p className="text-xl text-gray-300 mb-2">
						It looks like this page took an unexpected plot twist.
					</p>
					<p className="text-gray-400">
						The content you're looking for might have been moved, deleted, or is
						temporarily unavailable.
					</p>
				</div>

				{/* Action buttons */}
				<div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
					<Button
						onClick={() => router.push("/")}
						className="bg-primary hover:bg-primary/90 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-emerald-500/25 transition-all duration-300">
						<Icon icon="solar:home-bold" className="w-5 h-5 mr-2" />
						Back to Home
					</Button>

					<Button
						variant="outline"
						onClick={() => router.back()}
						className="border-primary/50 text-primary hover:bg-primary/10 px-8 py-3 text-lg">
						<Icon icon="solar:arrow-left-bold" className="w-5 h-5 mr-2" />
						Go Back
					</Button>
				</div>

				{/* Quick links */}
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-md mx-auto">
					<Link
						rel="preload"
						href="/movies"
						className="flex flex-col items-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-200 group">
						<Icon
							icon="material-symbols-light:movie"
							width="2em"
							height="2em"
							className="text-primary mb-2 group-hover:scale-110 transition-transform"
						/>
						<span className="text-sm text-gray-300">Movies</span>
					</Link>

					<Link
						rel="preload"
						href="/series"
						className="flex flex-col items-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-200 group">
						<Icon
							icon="solar:tv-bold"
							className="w-8 h-8 text-primary mb-2 group-hover:scale-110 transition-transform"
						/>
						<span className="text-sm text-gray-300">Series</span>
					</Link>

					<Link
						rel="preload"
						href="/video/trending"
						className="flex flex-col items-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-200 group">
						<Icon
							icon="solar:fire-bold"
							className="w-8 h-8 text-primary mb-2 group-hover:scale-110 transition-transform"
						/>
						<span className="text-sm text-gray-300">Trending</span>
					</Link>

					<Link
						rel="preload"
						href="/search"
						className="flex flex-col items-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors duration-200 group">
						<Icon
							icon="solar:magnifer-bold"
							className="w-8 h-8 text-primary mb-2 group-hover:scale-110 transition-transform"
						/>
						<span className="text-sm text-gray-300">Search</span>
					</Link>
				</div>

				{/* Fun error code */}
				<div className="mt-12 text-center">
					<p className="text-gray-500 text-sm font-mono">
						ERROR_CODE: CONTENT_NOT_IN_PLAYLIST
					</p>
				</div>
			</div>
		</div>
	);
}
