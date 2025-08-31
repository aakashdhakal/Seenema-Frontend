"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@iconify/react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import axios from "@/lib/axios";

export default function ForgotPassword() {
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);
	const [sent, setSent] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!email) {
			toast.error("Please enter your email address.");
			return;
		}

		setLoading(true);
		try {
			await axios.post("/auth/forgot-password", { email });
			setSent(true);
			toast.success("Password reset link sent! Check your email.");
		} catch (err) {
			const message =
				err?.response?.data?.message || "Failed to send reset link.";
			toast.error(message);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center flex-col justify-center relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900">
			{/* Background */}
			<div className="absolute inset-0">
				<Image
					src="/backdrop.jpg"
					alt="Background"
					fill
					className="object-cover opacity-20"
					priority
				/>
				<div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />
			</div>

			{/* Form Container */}
			<div className="relative z-20 w-full max-w-md px-6">
				<Card className="bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl">
					{/* Logo/Brand Section */}
					<CardHeader className="text-center pb-4">
						<CardTitle className="text-2xl font-bold text-white">
							<div className="flex items-center justify-center mb-6 z-10 w-full">
								<Image
									src="/3.png"
									alt="Seenema Logo"
									width={200}
									height={100}
								/>
							</div>
						</CardTitle>
						<CardDescription className="text-gray-300 text-base">
							{sent
								? `We've sent a password reset link to ${email}`
								: "Enter your email to receive a password reset link"}
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-6">
						{sent ? (
							// Success State
							<div className="space-y-4">
								<div className="text-center">
									<div className="mx-auto w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
										<Icon
											icon="solar:letter-bold"
											className="w-6 h-6 text-green-400"
										/>
									</div>
									<p className="text-sm text-gray-300">
										Check your email and click the link to reset your password.
									</p>
								</div>
								<div className="space-y-3">
									<Button
										variant="outline"
										className="w-full h-10 bg-white/5 border-white/10 text-white hover:bg-white/10"
										onClick={() => setSent(false)}>
										Try Different Email
									</Button>
									<Button
										variant="ghost"
										className="w-full h-10 text-primary hover:text-primary/80"
										asChild>
										<Link href="/login">
											<Icon
												icon="solar:arrow-left-bold"
												className="w-4 h-4 mr-2"
											/>
											Back to Login
										</Link>
									</Button>
								</div>
							</div>
						) : (
							// Form State
							<form onSubmit={handleSubmit} className="space-y-6">
								{/* Email Field */}
								<div className="space-y-2">
									<label className="text-white font-medium text-sm">
										Email Address
									</label>
									<div className="relative">
										<Icon
											icon="solar:letter-bold"
											className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10"
										/>
										<Input
											type="email"
											placeholder="Enter your email"
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-primary focus:ring-primary/20"
											required
											disabled={loading}
											autoComplete="email"
										/>
									</div>
								</div>

								{/* Submit Button */}
								<Button
									type="submit"
									disabled={loading}
									className="w-full h-10 text-base font-semibold"
									isLoading={loading}
									loadingText="Sending...">
									Send Reset Link
								</Button>
							</form>
						)}

						{!sent && (
							<>
								{/* Divider */}
								<div className="relative">
									<Separator className="bg-white/10" />
								</div>

								{/* Back to Login */}
								<Button
									variant="ghost"
									className="w-full h-10 text-primary hover:text-primary/80"
									asChild>
									<Link href="/login">
										<Icon
											icon="solar:arrow-left-bold"
											className="w-4 h-4 mr-2"
										/>
										Back to Login
									</Link>
								</Button>
							</>
						)}
					</CardContent>
				</Card>

				{/* Additional Info */}
				<div className="text-center mt-6">
					<p className="text-xs text-gray-400">
						Remember your password?{" "}
						<Link
							href="/login"
							className="text-primary hover:text-primary/80 transition-colors">
							Sign in here
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
