"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Icon } from "@iconify/react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import axios from "@/lib/axios";

export default function ResetPassword() {
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const router = useRouter();
	const searchParams = useSearchParams();

	const token = searchParams.get("token");
	const email = searchParams.get("email");

	// Redirect if no token or email in URL
	useEffect(() => {
		if (!token || !email) {
			toast.error("Invalid reset link. Please request a new one.");
			router.replace("/forgot-password");
		}
	}, [token, email, router]);

	const handleSubmit = async (e) => {
		e.preventDefault();

		// Validation
		if (!password || !confirmPassword) {
			toast.error("Please fill in all fields.");
			return;
		}

		if (password.length < 8) {
			toast.error("Password must be at least 8 characters long.");
			return;
		}

		if (password !== confirmPassword) {
			toast.error("Passwords do not match.");
			return;
		}

		setLoading(true);
		try {
			await axios.post("/auth/reset-password", {
				token,
				email,
				password,
				password_confirmation: confirmPassword,
			});

			toast.success(
				"Password reset successful! You can now log in with your new password.",
			);
			router.replace("/login");
		} catch (err) {
			const message =
				err?.response?.data?.message ||
				"Failed to reset password. Please try again.";
			toast.error(message);
		} finally {
			setLoading(false);
		}
	};

	// Don't render if no token/email
	if (!token || !email) {
		return null;
	}

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
									alt="StreamFlow Logo"
									width={200}
									height={100}
								/>
							</div>
						</CardTitle>
						<CardDescription className="text-gray-300 text-base">
							Create a new password for your account
						</CardDescription>
					</CardHeader>

					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-6">
							{/* New Password Field */}
							<div className="space-y-2">
								<label className="text-white font-medium text-sm">
									New Password
								</label>
								<div className="relative">
									<Icon
										icon="solar:lock-bold"
										className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10"
									/>
									<Input
										type={showPassword ? "text" : "password"}
										placeholder="Enter new password"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										className="pl-11 pr-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-primary focus:ring-primary/20"
										style={{
											WebkitBoxShadow:
												"0 0 0 30px rgba(255, 255, 255, 0.05) inset",
											WebkitTextFillColor: "white",
										}}
										required
										disabled={loading}
										autoComplete="new-password"
										minLength={8}
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
										<Icon
											icon={
												showPassword
													? "solar:eye-bold"
													: "solar:eye-closed-bold"
											}
											className="w-5 h-5"
										/>
									</button>
								</div>
							</div>

							{/* Confirm Password Field */}
							<div className="space-y-2">
								<label className="text-white font-medium text-sm">
									Confirm New Password
								</label>
								<div className="relative">
									<Icon
										icon="solar:lock-bold"
										className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10"
									/>
									<Input
										type={showConfirmPassword ? "text" : "password"}
										placeholder="Confirm new password"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										className="pl-11 pr-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-primary focus:ring-primary/20"
										style={{
											WebkitBoxShadow:
												"0 0 0 30px rgba(255, 255, 255, 0.05) inset",
											WebkitTextFillColor: "white",
										}}
										required
										disabled={loading}
										autoComplete="new-password"
										minLength={8}
									/>
									<button
										type="button"
										onClick={() => setShowConfirmPassword(!showConfirmPassword)}
										className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
										<Icon
											icon={
												showConfirmPassword
													? "solar:eye-bold"
													: "solar:eye-closed-bold"
											}
											className="w-5 h-5"
										/>
									</button>
								</div>
							</div>

							{/* Password Requirements */}
							<div className="text-xs text-gray-400 space-y-1">
								<p>Password must be at least 8 characters long</p>
							</div>

							{/* Submit Button */}
							<Button
								type="submit"
								disabled={loading}
								className="w-full h-12 text-base font-semibold"
								isLoading={loading}
								loadingText="Resetting Password...">
								Reset Password
							</Button>
						</form>

						{/* Back to Login */}
						<div className="mt-6">
							<Button
								variant="ghost"
								className="w-full h-10 text-primary hover:text-primary/80"
								asChild>
								<Link href="/login">
									<Icon icon="solar:arrow-left-bold" className="w-4 h-4 mr-2" />
									Back to Login
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Additional Info */}
				<div className="text-center mt-6">
					<p className="text-xs text-gray-400">
						Link expired or invalid?{" "}
						<Link
							href="/forgot-password"
							className="text-primary hover:text-primary/80 transition-colors">
							Request a new one
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
