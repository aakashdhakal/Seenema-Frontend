"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import PageLoadingComponent from "@/components/combinedComponents/PageLoadingComponent";

export default function HomePage() {
	const [email, setEmail] = useState("");
	const { user, isLoading } = useAuth();
	const router = useRouter();

	useEffect(() => {
		// Redirect if user is already logged in
		if (!isLoading && user) {
			if (user.email_verified_at !== null) {
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
		<div className="min-h-screen bg-black text-white">
			{/* Hero Section */}
			<div className="relative min-h-screen">
				{/* Background */}
				<div className="absolute inset-0">
					<Image
						src="/backdrop.jpg"
						alt="Hero Background"
						fill
						className="object-cover opacity-50"
						priority
					/>
					<div className="absolute inset-0 bg-black/70" />
				</div>

				{/* Navigation */}
				<nav className="relative z-20 flex items-center justify-between p-6 lg:px-16">
					<div className="flex items-center">
						<Image src="/3.png" alt="StreamFlow" width={180} height={100} />
					</div>
					<div className="flex items-center space-x-4">
						<Button variant="default" className="text-white" asChild>
							<Link href="/login">Sign In</Link>
						</Button>
					</div>
				</nav>

				{/* Hero Content */}
				<div className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
					<h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 max-w-4xl leading-tight">
						Unlimited movies, TV shows and more
					</h1>
					<p className="text-xl md:text-2xl mb-4 max-w-2xl">
						Watch anywhere. Cancel anytime.
					</p>
					<p className="text-lg mb-8 max-w-xl text-gray-300">
						Ready to watch? Enter your email to create or restart your
						membership.
					</p>

					{/* Email Signup Form */}
					<div className="w-full max-w-2xl">
						<div className="flex flex-col items-center justify-center md:flex-row gap-4">
							<Button
								onClick={handleGetStarted}
								className="h-14 px-8 text-lg font-semibold bg-primary hover:bg-primary/90 text-white">
								Get Started
								<Icon icon="solar:arrow-right-bold" className="ml-2 w-5 h-5" />
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
