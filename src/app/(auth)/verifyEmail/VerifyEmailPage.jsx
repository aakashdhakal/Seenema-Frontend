"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import PageLoadingComponent from "@/components/combinedComponents/PageLoadingComponent";

export default function VerifyEmailPage() {
	const [isResending, setIsResending] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const router = useRouter();
	const searchParams = useSearchParams();
	const email = searchParams.get("email") || "your email";
	const { user, isLoading, sendVerificationEmail, logout } = useAuth();

	useEffect(() => {
		if (!isLoading) {
			if (!user) {
				router.replace("/login");
			} else if (user.user.email_verified_at) {
				router.replace("/home");
			}
		}
	}, [user, isLoading, router]);

	const resendVerificationEmail = async () => {
		setIsResending(true);
		setError("");
		setMessage("");

		try {
			const res = await sendVerificationEmail();
			console.log(res);
			if (res === 200) {
				setMessage("Verification email sent successfully!");
			} else {
				setError("Failed to send verification email. Please try again.");
			}
		} catch (err) {
			setError(
				err.message || "Failed to send verification email. Please try again.",
			);
		}
		setIsResending(false);
	};

	// Show loading state while checking auth
	if (isLoading) {
		return <PageLoadingComponent />;
	}

	// Prevent render if redirect is about to happen
	// if (!user || user.email_verified_at !== null) return null;

	return (
		<div className="min-h-screen flex items-center flex-col justify-center relative overflow-hidden bg-[url('/backdrop.jpg')] bg-cover bg-center bg-no-repeat bg-amber-100">
			{/* Dimmed background overlay */}
			<div className="absolute inset-0 bg-black/80 z-0" />

			{/* Verification Form Container */}
			<div className="relative z-20 w-full max-w-md px-6">
				{/* Verification Card */}
				<Card className="bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl">
					{/* Logo/Brand Section */}
					<CardHeader className="text-center pb-4">
						<CardTitle className="text-2xl font-bold text-white">
							<div className="flex items-center justify-around mb-6 z-10 w-full">
								<Image
									src="/3.png"
									alt="StreamFlow Logo"
									width={200}
									height={100}
								/>
							</div>
						</CardTitle>
						<CardDescription className="text-gray-300 text-base">
							Almost there! Just one more step
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-6">
						{/* Success Message */}
						{message && (
							<div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center space-x-2">
								<Icon
									icon="solar:check-circle-bold"
									className="w-5 h-5 text-green-400"
								/>
								<span className="text-green-400 text-sm">{message}</span>
							</div>
						)}

						{/* Error Message */}
						{error && (
							<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center space-x-2">
								<Icon
									icon="solar:danger-circle-bold"
									className="w-5 h-5 text-red-400"
								/>
								<span className="text-red-400 text-sm">{error}</span>
							</div>
						)}

						{/* Main Content */}
						<div className="text-center space-y-6">
							<div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
								<Icon
									icon="solar:letter-bold"
									className="w-8 h-8 text-primary"
								/>
							</div>

							<div className="space-y-2">
								<h3 className="text-xl font-semibold text-white">
									Check Your Email
								</h3>
								<p className="text-gray-300">
									We've sent a verification link to{" "}
									<span className="text-primary font-medium">{email}</span>
								</p>
							</div>

							<div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-left">
								<h4 className="text-white font-medium mb-2 flex items-center">
									<Icon
										icon="solar:info-circle-bold"
										className="w-5 h-5 mr-2 text-blue-400"
									/>
									Next Steps:
								</h4>
								<ul className="text-sm text-gray-300 space-y-1 ml-7">
									<li>• Check your inbox for the verification email</li>
									<li>• Click the verification link in the email</li>
									<li>• You'll be redirected to login automatically</li>
								</ul>
							</div>

							<div className="space-y-3">
								<Button
									onClick={resendVerificationEmail}
									disabled={isResending}
									className="w-full bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90">
									{isResending ? (
										<>
											<Icon
												icon="solar:refresh-bold"
												className="w-5 h-5 mr-2 animate-spin"
											/>
											Resending...
										</>
									) : (
										<>
											<Icon icon="solar:letter-bold" className="w-5 h-5 mr-2" />
											Resend Verification Email
										</>
									)}
								</Button>

								<Button
									variant="ghost"
									className="w-full text-gray-400 hover:text-white hover:bg-white/5"
									onClick={() => logout().then(() => router.replace("/login"))}>
									<Icon icon="solar:arrow-left-bold" className="w-4 h-4 mr-2" />
									Back to Login
								</Button>
							</div>
						</div>
					</CardContent>

					{/* Footer Links */}
					<div className="px-6 pb-6">
						<Separator className="bg-white/10 mb-4" />
						<div className="text-center space-y-2">
							<p className="text-gray-300">
								Having trouble?{" "}
								<Button
									variant="link"
									className="p-0 h-auto text-primary hover:text-accent font-semibold transition-colors">
									Contact Support
								</Button>
							</p>
							<p className="text-xs text-gray-400">
								Already verified?{" "}
								<Link
									href="/login"
									className="text-primary hover:text-accent font-medium transition-colors">
									Sign in here
								</Link>
							</p>
						</div>
					</div>
				</Card>

				{/* Additional Info */}
				<div className="text-center mt-6">
					<p className="text-xs text-gray-400">
						Didn't receive the email? Check your spam folder or use the resend
						button above
					</p>
				</div>
			</div>
		</div>
	);
}
