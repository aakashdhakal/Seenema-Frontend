"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";

export default function SignupPage() {
	const [isSignupLoading, setisSignupLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		password: "",
		confirmPassword: "",
		agreeToTerms: false,
	});
	const [error, setError] = useState("");
	const [passwordStrength, setPasswordStrength] = useState("");
	const router = useRouter();
	const { user, isLoading, registerUser } = useAuth();

	useEffect(() => {
		// Only redirect if auth loading is complete and user exists
		if (!isLoading && user) {
			if (user.email_verified_at) {
				router.push("/home");
			} else {
				router.push("/verifyEmail");
			}
		}
	}, [user, router, isLoading]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setisSignupLoading(true);
		setError("");

		// Validation
		if (formData.password !== formData.confirmPassword) {
			setError("Passwords do not match");
			setisSignupLoading(false);
			return;
		}

		if (formData.password.length < 8) {
			setError("Password must be at least 8 characters long");
			setisSignupLoading(false);
			return;
		}

		if (!formData.agreeToTerms) {
			setError("You must agree to the Terms of Service and Privacy Policy");
			setisSignupLoading(false);
			return;
		}

		try {
			const res = await registerUser({
				name: formData.name,
				email: formData.email,
				password: formData.password,
				confirmPassword: formData.confirmPassword,
			});

			if (res.status !== 201) {
				throw new Error(res.data.message || "Registration failed");
			}
			// 3. Success!
			router.push("/verifyEmail");
		} catch (error) {
			console.error("Registration Error:", error);
			const message =
				error.response?.data?.message ||
				"Registration failed. Please try again.";
			setError(message);
		} finally {
			setisSignupLoading(false);
		}
	};

	const handleInputChange = (e) => {
		const { name, value, type, checked } = e.target;
		setFormData({
			...formData,
			[name]: type === "checkbox" ? checked : value,
		});

		// Password strength indicator
		if (name === "password") {
			checkPasswordStrength(value);
		}
	};

	const checkPasswordStrength = (password) => {
		if (password.length === 0) {
			setPasswordStrength("");
		} else if (password.length < 6) {
			setPasswordStrength("weak");
		} else if (
			password.length < 10 &&
			!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)
		) {
			setPasswordStrength("medium");
		} else if (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password)) {
			setPasswordStrength("strong");
		} else {
			setPasswordStrength("medium");
		}
	};

	const getPasswordStrengthColor = () => {
		switch (passwordStrength) {
			case "weak":
				return "bg-red-500";
			case "medium":
				return "bg-yellow-500";
			case "strong":
				return "bg-green-500";
			default:
				return "bg-gray-500";
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center relative overflow-hidden py-8">
			{/* Background with movie posters */}
			<div className="absolute inset-0 z-0">
				<img
					src="/backdrop.jpg"
					alt="Backdrop"
					className="w-full h-full object-cover"
					style={{ objectPosition: "center" }}
				/>
				{/* Dark overlay */}
				<div className="absolute inset-0 bg-black/80 z-10" />
			</div>

			{/* Signup Form Container */}
			<div className="relative z-20 w-full max-w-md px-6">
				{/* Signup Card */}
				<Card className="bg-black/40 backdrop-blur-xl border-white/10 shadow-2xl">
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
							Create your account and start streaming today
						</CardDescription>
					</CardHeader>

					<CardContent className="space-y-6">
						{error && (
							<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center space-x-2">
								<Icon
									icon="solar:danger-circle-bold"
									className="w-5 h-5 text-red-400"
								/>
								<span className="text-red-400 text-sm">{error}</span>
							</div>
						)}

						<form onSubmit={handleSubmit} className="space-y-6">
							{/* Name Input */}
							<div className="space-y-2">
								<Label htmlFor="name" className="text-white font-medium">
									Full Name
								</Label>
								<div className="relative">
									<Icon
										icon="solar:user-bold"
										className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
									/>
									<Input
										type="text"
										name="name"
										id="name"
										value={formData.name}
										onChange={handleInputChange}
										className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-primary focus:ring-primary/20"
										placeholder="Enter your full name"
										required
									/>
								</div>
							</div>

							{/* Email Input */}
							<div className="space-y-2">
								<Label htmlFor="email" className="text-white font-medium">
									Email Address
								</Label>
								<div className="relative">
									<Icon
										icon="solar:letter-bold"
										className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
									/>
									<Input
										type="email"
										name="email"
										id="email"
										value={formData.email}
										onChange={handleInputChange}
										className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-primary focus:ring-primary/20"
										placeholder="Enter your email"
										required
									/>
								</div>
							</div>

							{/* Password Input */}
							<div className="space-y-2">
								<Label htmlFor="password" className="text-white font-medium">
									Password
								</Label>
								<div className="relative">
									<Icon
										icon="solar:lock-password-bold"
										className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
									/>
									<Input
										type={showPassword ? "text" : "password"}
										name="password"
										id="password"
										value={formData.password}
										onChange={handleInputChange}
										className="pl-11 pr-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-primary focus:ring-primary/20"
										placeholder="Create a strong password"
										required
									/>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-white/10">
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
								{/* Password Strength Indicator */}
								{formData.password && (
									<div className="space-y-1">
										<div className="flex space-x-1">
											<div
												className={`h-1 w-1/3 rounded ${getPasswordStrengthColor()}`}
											/>
											<div
												className={`h-1 w-1/3 rounded ${
													passwordStrength === "medium" ||
													passwordStrength === "strong"
														? getPasswordStrengthColor()
														: "bg-gray-600"
												}`}
											/>
											<div
												className={`h-1 w-1/3 rounded ${
													passwordStrength === "strong"
														? getPasswordStrengthColor()
														: "bg-gray-600"
												}`}
											/>
										</div>
										<p className="text-xs text-gray-400 capitalize">
											{passwordStrength &&
												`Password strength: ${passwordStrength}`}
										</p>
									</div>
								)}
							</div>

							{/* Confirm Password Input */}
							<div className="space-y-2">
								<Label
									htmlFor="confirmPassword"
									className="text-white font-medium">
									Confirm Password
								</Label>
								<div className="relative">
									<Icon
										icon="solar:shield-check-bold"
										className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
									/>
									<Input
										type={showConfirmPassword ? "text" : "password"}
										name="confirmPassword"
										id="confirmPassword"
										value={formData.confirmPassword}
										onChange={handleInputChange}
										className="pl-11 pr-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-primary focus:ring-primary/20"
										placeholder="Confirm your password"
										required
									/>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => setShowConfirmPassword(!showConfirmPassword)}
										className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-white/10">
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
								{/* Password Match Indicator */}
								{formData.confirmPassword && (
									<div className="flex items-center space-x-2">
										<Icon
											icon={
												formData.password === formData.confirmPassword
													? "solar:check-circle-bold"
													: "solar:close-circle-bold"
											}
											className={`w-4 h-4 ${
												formData.password === formData.confirmPassword
													? "text-green-400"
													: "text-red-400"
											}`}
										/>
										<span
											className={`text-xs ${
												formData.password === formData.confirmPassword
													? "text-green-400"
													: "text-red-400"
											}`}>
											{formData.password === formData.confirmPassword
												? "Passwords match"
												: "Passwords do not match"}
										</span>
									</div>
								)}
							</div>

							{/* Terms and Conditions */}
							<div className="flex items-start space-x-3">
								<Checkbox
									id="agreeToTerms"
									name="agreeToTerms"
									checked={formData.agreeToTerms}
									onCheckedChange={(checked) =>
										setFormData((prev) => ({
											...prev,
											agreeToTerms: !!checked,
										}))
									}
									className="h-5 w-5 text-primary focus:ring-primary/20"
								/>
								<label
									htmlFor="agreeToTerms"
									className="text-sm text-gray-300 leading-relaxed">
									I agree to the{" "}
									<Button
										variant="link"
										className="p-0 h-auto text-sm text-primary hover:text-accent">
										Terms of Service
									</Button>{" "}
									and{" "}
									<Button
										variant="link"
										className="p-0 h-auto text-sm text-primary hover:text-accent">
										Privacy Policy
									</Button>
								</label>
							</div>

							{/* Signup Button */}
							<Button
								type="submit"
								disabled={isSignupLoading}
								variant={"default"}
								className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold text-base shadow-lg transition-all duration-200 hover:shadow-xl">
								{isSignupLoading ? (
									<>
										<Icon
											icon="solar:refresh-bold"
											className="w-5 h-5 mr-2 animate-spin"
										/>
										Creating account...
									</>
								) : (
									<>
										<Icon
											icon="solar:user-plus-bold"
											className="w-5 h-5 mr-2"
										/>
										Create Account
									</>
								)}
							</Button>
						</form>

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
								className="w-full h-12 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20"
								asChild>
								<a href="http://localhost:8000/api/auth/google/redirect">
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
							Already have an account?{" "}
							<Link
								href="/login"
								className="text-primary hover:text-accent font-semibold transition-colors">
								Sign in here
							</Link>
						</p>
					</div>
				</Card>
			</div>
		</div>
	);
}
