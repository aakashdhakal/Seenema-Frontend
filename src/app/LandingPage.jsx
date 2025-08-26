"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@iconify/react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function LandingPage() {
	const [email, setEmail] = useState("");
	const router = useRouter();

	const handleGetStarted = () => {
		if (email) {
			router.push(`/signup?email=${encodeURIComponent(email)}`);
		} else {
			router.push("/signup");
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
			{/* Hero Section */}
			<div className="relative min-h-screen">
				{/* Background */}
				<div className="absolute inset-0 top-0">
					<Image
						src="/backdrop.jpg"
						alt="Hero Background"
						fill
						className="object-cover object-top opacity-20"
						priority
					/>
					<div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
				</div>
				{/* Navigation */}
				<nav className="relative z-20 flex items-center justify-between p-6 lg:px-16">
					<div className="flex items-center">
						<Image src="/3.png" alt="StreamFlow" width={180} height={100} />
					</div>
					<div className="flex items-center space-x-4">
						<Button variant="default" asChild>
							<Link rel="preload" href="/login">
								Sign In
							</Link>
						</Button>
					</div>
				</nav>
				{/* Hero Content */}
				<div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
					<div className="max-w-4xl mx-auto">
						<h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
							Stream Your Favorite Content
						</h1>
						<p className="text-xl md:text-2xl mb-8 text-gray-300 max-w-2xl mx-auto">
							Discover unlimited movies, TV shows and more. Watch anywhere,
							anytime.
						</p>

						{/* Email Signup Form */}
						<div className="w-full max-w-lg mx-auto mb-12">
							<div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
								<Input
									type="email"
									placeholder="Enter your email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="h-12 px-4 bg-black/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-white flex-1"
								/>
								<Button
									onClick={handleGetStarted}
									className="h-12 px-8 font-semibold bg-primary hover:bg-primary/90 text-white whitespace-nowrap">
									Get Started
									<Icon
										icon="solar:arrow-right-bold"
										className="ml-2 w-4 h-4"
									/>
								</Button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
