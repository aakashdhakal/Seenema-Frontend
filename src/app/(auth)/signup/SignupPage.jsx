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
	FormDescription,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

// Enhanced form validation schema
const signupSchema = z
	.object({
		name: z
			.string()
			.min(2, "Name must be at least 2 characters")
			.max(50, "Name must not exceed 50 characters")
			.regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
		email: z
			.string()
			.min(1, "Email is required")
			.email("Please enter a valid email address")
			.max(100, "Email must not exceed 100 characters"),
		password: z
			.string()
			.min(8, "Password must be at least 8 characters")
			.max(128, "Password must not exceed 128 characters")
			.regex(/[A-Z]/, "Password must contain at least one uppercase letter")
			.regex(/[a-z]/, "Password must contain at least one lowercase letter")
			.regex(/\d/, "Password must contain at least one number")
			.regex(
				/[@$!%*?&]/,
				"Password must contain at least one special character",
			),
		confirmPassword: z.string().min(1, "Please confirm your password"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

export default function SignupPage() {
	const [isSignupLoading, setIsSignupLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [passwordStrength, setPasswordStrength] = useState(0);
	const router = useRouter();
	const { registerUser, user, isLoading } = useAuthContext();

	const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

	// Initialize form with react-hook-form and zod validation
	const form = useForm({
		resolver: zodResolver(signupSchema),
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
		mode: "onChange", // Real-time validation
	});

	// Watch password changes for strength indicator
	const password = form.watch("password");
	const confirmPassword = form.watch("confirmPassword");

	// Calculate password strength
	useEffect(() => {
		if (!password) {
			setPasswordStrength(0);
			return;
		}

		let strength = 0;
		if (password.length >= 8) strength += 1;
		if (password.length >= 12) strength += 1;
		if (/[A-Z]/.test(password)) strength += 1;
		if (/[a-z]/.test(password)) strength += 1;
		if (/\d/.test(password)) strength += 1;
		if (/[@$!%*?&]/.test(password)) strength += 1;

		setPasswordStrength(Math.min(strength, 5));
	}, [password]);

	// Auto-fill email from URL params (from landing page)
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const emailParam = urlParams.get("email");
		if (emailParam) {
			form.setValue("email", emailParam);
		}
	}, [form]);

	// Redirect if user is already logged in
	useEffect(() => {
		if (!isLoading && user) {
			if (user.is_email_verified) {
				router.replace("/");
			} else {
				router.replace("/verifyEmail");
			}
		}
	}, [user, isLoading, router]);

	const onSubmit = async (data) => {
		setIsSignupLoading(true);

		try {
			const response = await registerUser({
				name: data.name,
				email: data.email,
				password: data.password,
				confirmPassword: data.confirmPassword,
			});
			if (response.status === 201) {
				router.replace("/verifyEmail");
			}
		} catch (err) {
			toast.error(err.message || "Registration failed. Please try again.");

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
			setIsSignupLoading(false);
		}
	};

	const getPasswordStrengthInfo = () => {
		const strengthLevels = [
			{ label: "Very Weak", color: "bg-red-500", textColor: "text-red-400" },
			{ label: "Weak", color: "bg-red-400", textColor: "text-red-400" },
			{ label: "Fair", color: "bg-yellow-500", textColor: "text-yellow-400" },
			{ label: "Good", color: "bg-blue-500", textColor: "text-blue-400" },
			{ label: "Strong", color: "bg-green-500", textColor: "text-green-400" },
			{
				label: "Very Strong",
				color: "bg-green-600",
				textColor: "text-green-400",
			},
		];
		return strengthLevels[passwordStrength] || strengthLevels[0];
	};

	if (isLoading) {
		return <PageLoadingComponent message="Checking authentication..." />;
	}

	if (user) return null;

	return (
		<div className="min-h-screen flex items-center justify-center relative overflow-hidden py-8 bg-gradient-to-br from-gray-900 via-black to-gray-900">
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

			{/* Signup Form Container */}
			<div className="relative z-20 w-full max-w-md px-6">
				{/* Signup Card */}
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
							Create your account and start streaming today
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-6">
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className="space-y-6">
								{/* Name Field */}
								<FormField
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-white font-medium">
												Full Name
											</FormLabel>
											<FormControl>
												<div className="relative">
													<Icon
														icon="solar:user-bold"
														className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10"
													/>
													<Input
														type="text"
														placeholder="Enter your full name"
														className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-primary focus:ring-primary/20"
														style={{
															WebkitBoxShadow:
																"0 0 0 30px rgba(255, 255, 255, 0.05) inset",
															WebkitTextFillColor: "white",
														}}
														{...field}
													/>
												</div>
											</FormControl>
											<FormMessage className="text-red-400" />
										</FormItem>
									)}
								/>

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
														placeholder="Create a strong password"
														className="pl-11 pr-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-primary focus:ring-primary/20"
														style={{
															WebkitBoxShadow:
																"0 0 0 30px rgba(255, 255, 255, 0.05) inset",
															WebkitTextFillColor: "white",
														}}
														{...field}
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

											{/* Password Strength Indicator */}
											{password && (
												<div className="space-y-2">
													<div className="flex space-x-1">
														{[...Array(5)].map((_, i) => (
															<div
																key={i}
																className={`h-1 flex-1 rounded transition-colors ${
																	i < passwordStrength
																		? getPasswordStrengthInfo().color
																		: "bg-gray-600"
																}`}
															/>
														))}
													</div>
													<div className="flex items-center justify-between">
														<span
															className={`text-xs ${
																getPasswordStrengthInfo().textColor
															}`}>
															Password strength:{" "}
															{getPasswordStrengthInfo().label}
														</span>
														<Icon
															icon={
																passwordStrength >= 4
																	? "solar:check-circle-bold"
																	: "solar:info-circle-bold"
															}
															className={`w-4 h-4 ${
																passwordStrength >= 4
																	? "text-green-400"
																	: "text-gray-400"
															}`}
														/>
													</div>
												</div>
											)}

											<FormMessage className="text-red-400" />
											<FormDescription className="text-gray-400 text-xs">
												Must contain uppercase, lowercase, number, and special
												character
											</FormDescription>
										</FormItem>
									)}
								/>

								{/* Confirm Password Field */}
								<FormField
									control={form.control}
									name="confirmPassword"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="text-white font-medium">
												Confirm Password
											</FormLabel>
											<FormControl>
												<div className="relative">
													<Icon
														icon="solar:shield-check-bold"
														className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10"
													/>
													<Input
														type={showConfirmPassword ? "text" : "password"}
														placeholder="Confirm your password"
														className="pl-11 pr-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-primary focus:ring-primary/20"
														style={{
															WebkitBoxShadow:
																"0 0 0 30px rgba(255, 255, 255, 0.05) inset",
															WebkitTextFillColor: "white",
														}}
														{...field}
													/>
													<Button
														type="button"
														variant="ghost"
														size="sm"
														onClick={() =>
															setShowConfirmPassword(!showConfirmPassword)
														}
														className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-white/10 z-10">
														<Icon
															icon={
																showConfirmPassword
																	? "solar:eye-closed-bold"
																	: "solar:eye-bold"
															}
															className="w-4 h-4 text-gray-400 hover:text-white"
														/>
													</Button>
												</div>
											</FormControl>

											{/* Password Match Indicator */}
											{confirmPassword && (
												<div className="flex items-center space-x-2">
													<Icon
														icon={
															password === confirmPassword
																? "solar:check-circle-bold"
																: "solar:close-circle-bold"
														}
														className={`w-4 h-4 ${
															password === confirmPassword
																? "text-green-400"
																: "text-red-400"
														}`}
													/>
													<span
														className={`text-xs ${
															password === confirmPassword
																? "text-green-400"
																: "text-red-400"
														}`}>
														{password === confirmPassword
															? "Passwords match"
															: "Passwords do not match"}
													</span>
												</div>
											)}

											<FormMessage className="text-red-400" />
										</FormItem>
									)}
								/>

								{/* Signup Button */}
								<Button
									type="submit"
									disabled={isSignupLoading}
									variant={"default"}
									className="w-full h-12 text-md"
									isLoading={isSignupLoading}
									loadingText="Creating account...">
									Create Account
								</Button>
							</form>
						</Form>

						{/* Divider */}
						<div className="relative">
							<Separator className="bg-white/10" />
							<div className="absolute inset-0 flex items-center justify-center">
								<span className="px-4 bg-black/40 text-gray-400 text-sm">
									Or sign up with
								</span>
							</div>
						</div>

						{/* Social Signup Buttons */}
						<div className="space-y-3">
							<Button
								variant="outline"
								className="w-full h-12 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all"
								asChild>
								<a href={backendUrl + "/api/auth/google/redirect"}>
									<Icon icon="logos:google-icon" className="w-5 h-5 mr-3" />
									Continue with Google
								</a>
							</Button>
						</div>
					</CardContent>

					{/* Login Link */}
					<div className="px-6 pb-6">
						<Separator className="bg-white/10 mb-4" />
						<p className="text-center text-gray-300">
							Already have an account?{"  "}
							<Link
								rel="preload"
								href="/login"
								className="text-primary hover:text-primary/80 font-semibold transition-colors">
								Login
							</Link>
						</p>
					</div>
				</Card>

				{/* Additional Info */}
				<div className="text-center mt-6">
					<p className="text-xs text-gray-400">
						By creating an account, you agree to receive emails about your
						account and our services.
					</p>
				</div>
			</div>
		</div>
	);
}
