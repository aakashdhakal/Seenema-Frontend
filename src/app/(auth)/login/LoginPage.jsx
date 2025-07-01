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
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuthContext } from "@/context/AuthContext";
import PageLoadingComponent from "@/components/combinedComponents/PageLoadingComponent";

export default function LoginPage() {
	const [isLoginLoading, setIsLoginLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [formData, setFormData] = useState({
		email: "",
		password: "",
	});
	const [error, setError] = useState("");
	const router = useRouter();
	const { login, user, isLoading } = useAuthContext();

	const handleSubmit = async (e) => {
		e.preventDefault();
		setIsLoginLoading(true);
		setError("");

		try {
			// Call the login function from useAuthContext, which handles CSRF and mutate
			await login(formData);

			// No need to manually redirect here — useEffect will do it once user is loaded
		} catch (err) {
			// Display the error message returned from backend or fallback
			setError(err.message || "Login failed");
		}

		setIsLoginLoading(false);
	};

	const handleInputChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	useEffect(() => {
		if (!isLoading && user) {
			router.replace("/home");
		}
	}, [user, isLoading, router]);

	if (isLoading) {
		// Optionally show a loading spinner
		return <PageLoadingComponent />;
	}

	// Only render the login form if not authenticated
	if (user && !isLoading) return null;

	return (
		<div className="min-h-screen flex items-center flex-col justify-center relative overflow-hidden bg-[url('/backdrop.jpg')] bg-cover bg-center bg-no-repeat bg-amber-100">
			{/* Dimmed background overlay */}
			<div className="absolute inset-0 bg-black/80 z-0" />

			{/* Login Form Container */}
			<div className="relative z-20 w-full max-w-md px-6">
				{/* Login Card */}
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
							Sign in to continue your streaming journey
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
							{/* Email Input */}
							<div className="space-y-2">
								<Label htmlFor="email" className="text-white font-medium">
									Email Address
								</Label>
								<div className="relative">
									<Icon
										icon="solar:letter-bold"
										className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10"
									/>
									<Input
										type="email"
										name="email"
										id="email"
										value={formData.email}
										onChange={handleInputChange}
										className="pl-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-primary focus:ring-primary/20"
										style={{
											WebkitBoxShadow:
												"0 0 0 30px rgba(255, 255, 255, 0.05) inset",
											WebkitTextFillColor: "white",
										}}
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
										className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10"
									/>
									<Input
										type={showPassword ? "text" : "password"}
										name="password"
										id="password"
										value={formData.password}
										onChange={handleInputChange}
										className="pl-11 pr-11 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-400 focus:border-primary focus:ring-primary/20"
										style={{
											WebkitBoxShadow:
												"0 0 0 30px rgba(255, 255, 255, 0.05) inset",
											WebkitTextFillColor: "white",
										}}
										placeholder="Enter your password"
										required
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
							</div>

							{/* Remember Me & Forgot Password */}
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-2">
									<Checkbox id="remember" />
									<label htmlFor="remember" className="text-sm text-gray-300">
										Remember me
									</label>
								</div>
								<Button
									variant="link"
									className="p-0 h-auto text-sm text-primary hover:text-accent">
									Forgot password?
								</Button>
							</div>

							{/* Login Button */}
							<Button
								type="submit"
								disabled={isLoginLoading}
								className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-white font-semibold text-base shadow-lg transition-all duration-200 hover:shadow-xl">
								{isLoginLoading ? (
									<>
										<Icon
											icon="solar:refresh-bold"
											className="w-5 h-5 mr-2 animate-spin"
										/>
										Signing in...
									</>
								) : (
									<>Sign In</>
								)}
							</Button>
						</form>

						{/* Divider */}
						<div className="relative">
							<Separator className="bg-white/10" />
							<div className="absolute inset-0 flex items-center justify-center">
								<span className="px-4 bg-black/40 text-gray-400 text-sm">
									Or continue with
								</span>
							</div>
						</div>

						{/* Social Login Buttons */}
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

					{/* Sign Up Link */}
					<div className="px-6 pb-6">
						<Separator className="bg-white/10 mb-4" />
						<p className="text-center text-gray-300">
							Don't have an account?{" "}
							<Link
								href="/signup"
								className="text-primary hover:text-accent font-semibold transition-colors">
								Create one now
							</Link>
						</p>
					</div>
				</Card>

				{/* Additional Info */}
				<div className="text-center mt-6">
					<p className="text-xs text-gray-400">
						By signing in, you agree to our{" "}
						<Button
							variant="link"
							className="p-0 h-auto text-xs text-primary hover:text-accent">
							Terms of Service
						</Button>{" "}
						and{" "}
						<Button
							variant="link"
							className="p-0 h-auto text-xs text-primary hover:text-accent">
							Privacy Policy
						</Button>
					</p>
				</div>
			</div>
		</div>
	);
}
