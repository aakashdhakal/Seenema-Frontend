"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import Link from "next/link";
import Image from "next/image";
import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import PageLoadingComponent from "@/components/combinedComponents/PageLoadingComponent";

export default function HomePage() {
	const [email, setEmail] = useState("");
	const { user, isLoading } = useAuthContext();
	const router = useRouter();

	useEffect(() => {
		// Redirect if user is already logged in
		if (!isLoading && user) {
			if (user.is_email_verified) {
				router.push("/home");
			} else {
				router.push("/verifyEmail");
			}
		}
	}, [user, isLoading, router]);

	const handleGetStarted = () => {
		if (email) {
			router.push(`/signup?email=${encodeURIComponent(email)}`);
		} else {
			router.push("/signup");
		}
	};

	if (isLoading) {
		return <PageLoadingComponent />;
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white">
			{/* Hero Section */}
			<div className="relative min-h-screen">
				{/* Background */}
				<div className="absolute inset-0">
					<Image
						src="/backdrop.jpg"
						alt="Hero Background"
						fill
						className="object-cover opacity-20"
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
							<Link href="/login">Sign In</Link>
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

			{/* Features Section */}
			<div className="py-20 px-6 lg:px-16">
				<div className="max-w-6xl mx-auto">
					<h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-white">
						Why Choose Our Platform?
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-3 gap-8">
						<Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-300">
							<CardContent className="p-8 text-center">
								<div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
									<Icon
										icon="solar:play-circle-bold"
										className="w-8 h-8 text-primary"
									/>
								</div>
								<h3 className="text-xl font-semibold mb-4 text-white">
									High Quality
								</h3>
								<p className="text-gray-400">
									Experience crystal-clear streaming with adaptive quality that
									adjusts to your connection.
								</p>
							</CardContent>
						</Card>

						<Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-300">
							<CardContent className="p-8 text-center">
								<div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
									<Icon
										icon="solar:devices-bold"
										className="w-8 h-8 text-primary"
									/>
								</div>
								<h3 className="text-xl font-semibold mb-4 text-white">
									Multi-Device
								</h3>
								<p className="text-gray-400">
									Watch on any device - your phone, tablet, laptop, or TV.
									Seamlessly switch between them.
								</p>
							</CardContent>
						</Card>

						<Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-300">
							<CardContent className="p-8 text-center">
								<div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
									<Icon
										icon="solar:shield-check-bold"
										className="w-8 h-8 text-primary"
									/>
								</div>
								<h3 className="text-xl font-semibold mb-4 text-white">
									Secure & Safe
								</h3>
								<p className="text-gray-400">
									Your data is protected with enterprise-grade security. Watch
									with peace of mind.
								</p>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>

			{/* CTA Section */}
			<div className="py-20 px-6 lg:px-16 bg-gradient-to-r from-gray-800/20 to-gray-900/20">
				<div className="max-w-4xl mx-auto text-center">
					<h2 className="text-3xl md:text-4xl font-bold mb-6 text-white">
						Ready to Start Watching?
					</h2>
					<p className="text-xl text-gray-300 mb-8">
						Join thousands of users who are already enjoying unlimited
						streaming.
					</p>
					<div className="flex flex-col sm:flex-row gap-4 items-center justify-center max-w-lg mx-auto">
						<Input
							type="email"
							placeholder="Enter your email address"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							className="h-12 px-4 bg-black/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-white flex-1"
						/>
						<Button
							onClick={handleGetStarted}
							className="h-12 px-8 font-semibold bg-primary hover:bg-primary/90 text-white whitespace-nowrap">
							Get Started
							<Icon icon="solar:arrow-right-bold" className="ml-2 w-4 h-4" />
						</Button>
					</div>
				</div>
			</div>

			{/* Simple Footer */}
			<footer className="py-12 px-6 lg:px-16 bg-gray-900/50 border-t border-gray-800">
				<div className="max-w-6xl mx-auto">
					<div className="flex flex-col md:flex-row items-center justify-between">
						<div className="flex items-center mb-4 md:mb-0">
							<Image src="/3.png" alt="StreamFlow" width={120} height={60} />
						</div>
						<div className="flex space-x-6 text-gray-400">
							<Link href="/" className="hover:text-white transition-colors">
								Privacy
							</Link>
							<Link href="/" className="hover:text-white transition-colors">
								Terms
							</Link>
							<Link href="/" className="hover:text-white transition-colors">
								Contact
							</Link>
						</div>
					</div>
					<div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
						<p>
							&copy; {new Date().getFullYear()} Seenema. All rights reserved.
						</p>
					</div>
				</div>
			</footer>
		</div>
	);
}
