"use client";
import { useState, useEffect } from "react";
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
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthContext } from "@/context/AuthContext";
import PageLoadingComponent from "@/components/combinedComponents/PageLoadingComponent";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

// Form validation schema
const loginSchema = z.object({
	email: z
		.string()
		.min(1, "Email is required")
		.email("Please enter a valid email address"),
	password: z.string().min(1, "Password is required"),
});

export default function LoginPage() {
	const [isLoginLoading, setIsLoginLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const router = useRouter();
	const { login, user, isLoading } = useAuthContext();

	const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

	// Initialize form with react-hook-form and zod validation
	const form = useForm({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const onSubmit = async (data) => {
		setIsLoginLoading(true);

		try {
			await login({
				email: data.email,
				password: data.password,
			});

			toast.success("Login successful! Redirecting...");
		} catch (err) {
			toast.error(err.message || "Login failed. Please try again.");

			// Set form errors if specific field errors are returned
			if (err.errors) {
				Object.keys(err.errors).forEach((field) => {
					form.setError(field, {
						type: "server",
						message: err.errors[field][0],
					});
				});
			}
		} finally {
			setIsLoginLoading(false);
		}
	};

	useEffect(() => {
		if (!isLoading && user) {
			if (user.email_verified_at !== null) {
				router.replace("/home");
			} else {
				router.replace("/verifyEmail");
			}
		}
	}, [user, isLoading, router]);

	if (isLoading) {
		return <PageLoadingComponent />;
	}

	if (user) return null;

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

			{/* Login Form Container */}
			<div className="relative z-20 w-full max-w-md px-6">
				{/* Login Card */}
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
							Sign in to continue your streaming journey
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-6">
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="space-y-6">
								{/* Email Field */}
								<FormField
									control={form.control}
									name="email"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-white font-medium">
												Email Address
											</FormLabel>
											<FormControl>
												<div className="relative">
													<Icon
														icon="solar:letter-bold"
														className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10"
													/>
													<Input
														type="email"
														placeholder="Enter your email"
														className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-primary focus:ring-primary/20"
														style={{
															WebkitBoxShadow:
																"0 0 0 30px rgba(255, 255, 255, 0.05) inset",
															WebkitTextFillColor: "white",
														}}
														{...field}
														autoComplete="off"
													/>
												</div>
											</FormControl>
											<FormMessage className="text-red-400" />
										</FormItem>
									)}
								/>

								{/* Password Field */}
								<FormField
									control={form.control}
									name="password"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-white font-medium">
												Password
											</FormLabel>
											<FormControl>
												<div className="relative">
													<Icon
														icon="solar:lock-password-bold"
														className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10"
													/>
													<Input
														type={showPassword ? "text" : "password"}
														placeholder="Enter your password"
														className="pl-11 pr-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-primary focus:ring-primary/20"
														style={{
															WebkitBoxShadow:
																"0 0 0 30px rgba(255, 255, 255, 0.05) inset",
															WebkitTextFillColor: "white",
														}}
														{...field}
														autoComplete="off"
													/>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() => setShowPassword(!showPassword)}
														className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-white/10 z-10">
														<Icon
															icon={
																showPassword
																	? "solar:eye-closed-bold"
																	: "solar:eye-bold"
															}
															className="w-4 h-4 text-gray-400 hover:text-white"
														/>
													</Button>
												</div>
											</FormControl>
											<FormMessage className="text-red-400" />
										</FormItem>
									)}
								/>

								{/* Remember Me & Forgot Password */}
								<div className="flex items-center justify-between">
									<Button
										type="button"
										variant="link"
										className="p-0 h-auto text-sm text-primary hover:text-primary/80"
										asChild>
										<Link href="/forgot-password">Forgot password?</Link>
									</Button>
								</div>

								{/* Login Button */}
								<Button
									type="submit"
									disabled={isLoginLoading}
									className="w-full h-10 text-base font-semibold"
									isLoading={isLoginLoading}
									loadingText="Signing in...">
									Sign In
								</Button>
							</form>
						</Form>

						{/* Divider */}
						<div className="relative">
							<Separator className="bg-white" />
							<div className="absolute inset-0 flex items-center justify-center">
								<span className="px-4 bg-black text-gray-400 text-sm">
									Or continue with
								</span>
							</div>
						</div>

						{/* Social Login Buttons */}
						<Button
							variant="outline"
							className="w-full h-10 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all"
							asChild>
							<Link href={backendUrl + "/api/auth/google/redirect"}>
								<Icon icon="logos:google-icon" className="w-5 h-5 mr-3" />
								Continue with Google
							</Link>
						</Button>
					</CardContent>

					{/* Sign Up Link */}
					<div className="px-6 pb-6">
						<Separator className="bg-white/10 mb-4" />
						<p className="text-center text-gray-300">
							Don't have an account?{"  "}
							<Link
								href="/signup"
								className="text-primary hover:text-primary/80 font-semibold transition-colors">
								Register
							</Link>
						</p>
					</div>
				</Card>

				{/* Additional Info */}
				<div className="text-center mt-6">
					<p className="text-xs text-gray-400">
						By signing in, you agree to our{" "}
						<Link
							href="/terms"
							className="text-primary hover:text-primary/80 transition-colors">
							Terms of Service
						</Link>{" "}
						and{" "}
						<Link
							href="/privacy"
							className="text-primary hover:text-primary/80 transition-colors">
							Privacy Policy
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
