"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import PageLoadingComponent from "@/components/combinedComponents/PageLoadingComponent";
import { useAuthContext } from "@/context/AuthContext";

export default function VerifyEmailPage() {
	const [isResending, setIsResending] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");
	const router = useRouter();
	const { user, isLoading, sendVerificationEmail, logout } = useAuthContext();

	useEffect(() => {
		if (!isLoading) {
			// Only redirect verified users to home, allow unverified users to stay
			if (user && user.is_email_verified) {
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
			if (res.status === 200) {
				setMessage("A new verification link has been sent to your email!");
			} else {
				setError("Failed to send verification email. Please try again.");
			}
		} catch (err) {
			setError(
				err.response?.data?.message ||
					"An error occurred. Please try again later.",
			);
		} finally {
			setIsResending(false);
		}
	};

	// Show loading state while checking auth
	if (isLoading) {
		return <PageLoadingComponent message="Checking your status..." />;
	}

	return (
		<div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900">
			{/* Background Image */}
			<div className="absolute inset-0">
				<Image
					src="/backdrop.jpg"
					alt="Background"
					fill
					className="object-cover opacity-40"
					priority
				/>
				<div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />
			</div>

			{/* Main Content */}
			<div className="relative z-20 w-full max-w-lg px-6">
				{/* Logo */}
				<div className="flex justify-center mb-8">
					<Image
						src="/3.png"
						alt="StreamFlow Logo"
						width={200}
						height={100}
						className="opacity-90"
					/>
				</div>

				{/* Verification Card */}
				<div className="bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl overflow-hidden">
					{/* Header */}
					<div className=" px-8 py-6 text-center border-b border-white/10">
						<div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-4">
							<Icon icon="dashicons:email" className="w-8 h-8 text-primary" />
						</div>
						<h1 className="text-2xl font-bold text-white mb-2">
							Verify Your Email
						</h1>
						<p className="text-gray-300">
							We've sent a verification link to your inbox
						</p>
					</div>

					{/* Content */}
					<div className="p-8 space-y-6">
						{/* Status Messages */}
						{message && (
							<div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-start space-x-3">
								<Icon
									icon="solar:check-circle-bold"
									className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0"
								/>
								<div>
									<p className="text-green-400 font-medium text-sm">Success!</p>
									<p className="text-green-300 text-sm mt-1">{message}</p>
								</div>
							</div>
						)}

						{error && (
							<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start space-x-3">
								<Icon
									icon="solar:danger-circle-bold"
									className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0"
								/>
								<div>
									<p className="text-red-400 font-medium text-sm">Error</p>
									<p className="text-red-300 text-sm mt-1">{error}</p>
								</div>
							</div>
						)}

						{/* Email Display */}
						<div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
							<p className="text-gray-400 text-sm mb-2">
								Verification email sent to:
							</p>
							<p className="text-primary font-mono text-lg break-all">
								{user.email || "your email"}
							</p>
						</div>

						{/* Instructions */}
						<div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
							<div className="flex items-center mb-3">
								<Icon
									icon="solar:info-circle-bold"
									className="w-5 h-5 text-blue-400 mr-2"
								/>
								<h3 className="text-white font-medium">What's next?</h3>
							</div>
							<ul className="text-sm text-gray-300 space-y-2">
								<li className="flex items-start">
									<span className="text-blue-400 mr-2">1.</span>
									Check your email inbox (and spam folder)
								</li>
								<li className="flex items-start">
									<span className="text-blue-400 mr-2">2.</span>
									Click the verification link in the email
								</li>
								<li className="flex items-start">
									<span className="text-blue-400 mr-2">3.</span>
									You'll be automatically redirected to sign in
								</li>
							</ul>
						</div>

						{/* Action Buttons */}
						<div className="space-y-3">
							<Button
								onClick={resendVerificationEmail}
								className="w-full h-12"
								isLoading={isResending}
								variant={"default"}
								loadingText="Resending...">
								Resend Verification Email
							</Button>

							<Button
								variant="outline"
								className="w-full h-12 text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-300"
								onClick={() => logout().then(() => router.replace("/login"))}>
								<Icon icon="solar:arrow-left-bold" className="w-4 h-4 mr-2" />
								Back to Login
							</Button>
						</div>
					</div>

					{/* Footer */}
					<div className="px-8 pb-6">
						<Separator className="bg-white/10 mb-4" />
						<div className="text-center space-y-3">
							<p className="text-sm text-gray-400">
								Already verified?{"  "}
								<Link
									href="/login"
									className="text-primary  font-medium transition-colors">
									Sign in here
								</Link>
							</p>
						</div>
					</div>
				</div>

				{/* Bottom Help Text */}
				<div className="text-center mt-6 space-y-2">
					<p className="text-xs text-gray-400">
						Didn't receive the email? Check your spam folder or click resend
						above
					</p>
					<div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
						<span className="flex items-center">
							<Icon icon="solar:shield-check-bold" className="w-4 h-4 mr-1" />
							Secure
						</span>
						<span className="flex items-center">
							<Icon icon="solar:clock-circle-bold" className="w-4 h-4 mr-1" />
							Link expires in 24h
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
