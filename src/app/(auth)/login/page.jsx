"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Icon } from "@iconify/react";

const LoginPage = () => {
	const router = useRouter();
	const { login, isLoggedIn, isLoading } = useAuth();
	const [credentials, setCredentials] = useState({
		email: "",
		password: "",
	});
	const [error, setError] = useState("");
	const [showPassword, setShowPassword] = useState(false);

	// If already logged in, redirect to dashboard
	useEffect(() => {
		if (isLoggedIn && !isLoading) {
			router.push("/dashboard");
		}
	}, [isLoggedIn, isLoading, router]);

	const handleChange = (e) => {
		setCredentials({
			...credentials,
			[e.target.name]: e.target.value,
		});
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		try {
			await login(credentials);
		} catch (err) {
			console.error("Login failed", err.message);
			setError(err.message);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-muted flex items-center justify-center p-4 relative overflow-hidden">
			{/* Background decorative elements */}
			<div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5"></div>
			<div className="absolute top-10 left-10 opacity-10">
				<Icon icon="solar:play-bold" className="w-32 h-32 text-primary" />
			</div>
			<div className="absolute top-20 right-20 opacity-10">
				<Icon
					icon="solar:videocamera-record-bold"
					className="w-24 h-24 text-accent"
				/>
			</div>
			<div className="absolute bottom-20 left-20 opacity-10">
				<Icon icon="solar:tv-bold" className="w-28 h-28 text-primary" />
			</div>
			<div className="absolute bottom-10 right-10 opacity-10">
				<Icon icon="solar:monitor-bold" className="w-20 h-20 text-accent" />
			</div>

			<div className="w-full max-w-md relative z-10">
				{/* Logo/Brand Section */}
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl mb-4 shadow-golden-lg">
						<Icon
							icon="solar:play-bold"
							className="w-8 h-8 text-primary-foreground"
						/>
					</div>
					<h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">
						StreamFlow
					</h1>
					<p className="text-muted-foreground">
						Your gateway to unlimited entertainment
					</p>
				</div>

				{/* Login Card */}
				<Card className="bg-card/80 backdrop-blur-xl border-border/50 shadow-golden-lg">
					<CardHeader className="text-center">
						<CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
						<CardDescription>Sign in to continue watching</CardDescription>
					</CardHeader>

					<CardContent className="space-y-6">
						{error && (
							<Alert variant="destructive">
								<Icon icon="solar:danger-circle-bold" className="w-4 h-4" />
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}

						<form onSubmit={handleSubmit} className="space-y-6">
							{/* Email Input */}
							<div className="space-y-2">
								<Label htmlFor="email">Email Address</Label>
								<div className="relative">
									<Icon
										icon="solar:letter-bold"
										className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
									/>
									<Input
										type="email"
										name="email"
										id="email"
										value={credentials.email}
										onChange={handleChange}
										className="pl-9"
										placeholder="Enter your email"
										required
									/>
								</div>
							</div>

							{/* Password Input */}
							<div className="space-y-2">
								<Label htmlFor="password">Password</Label>
								<div className="relative">
									<Icon
										icon="solar:lock-password-bold"
										className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
									/>
									<Input
										type={showPassword ? "text" : "password"}
										name="password"
										id="password"
										value={credentials.password}
										onChange={handleChange}
										className="pl-9 pr-9"
										placeholder="Enter your password"
										required
									/>
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-transparent">
										<Icon
											icon={
												showPassword
													? "solar:eye-closed-bold"
													: "solar:eye-bold"
											}
											className="w-4 h-4 text-muted-foreground hover:text-foreground"
										/>
									</Button>
								</div>
							</div>

							{/* Forgot Password */}
							<div className="text-right">
								<Button
									variant="link"
									className="p-0 h-auto text-sm text-primary hover:text-accent">
									Forgot your password?
								</Button>
							</div>

							{/* Login Button */}
							<Button
								type="submit"
								disabled={isLoading}
								className="w-full bg-gradient-primary hover:opacity-90 shadow-golden">
								{isLoading ? (
									<>
										<Icon
											icon="solar:refresh-bold"
											className="w-4 h-4 mr-2 animate-spin"
										/>
										Signing in...
									</>
								) : (
									<>
										<Icon icon="solar:login-3-bold" className="w-4 h-4 mr-2" />
										Sign In
									</>
								)}
							</Button>
						</form>

						{/* Divider */}
						<div className="relative">
							<Separator />
							<div className="absolute inset-0 flex items-center justify-center">
								<span className="px-3 bg-card text-muted-foreground text-sm">
									Or continue with
								</span>
							</div>
						</div>

						{/* Google Login */}
						<Button variant="outline" className="w-full" asChild>
							<a href="http://localhost:8000/auth/google/redirect">
								<Icon icon="logos:google-icon" className="w-4 h-4 mr-2" />
								Continue with Google
							</a>
						</Button>
					</CardContent>

					<CardFooter className="flex flex-col space-y-4">
						<Separator />
						<p className="text-sm text-muted-foreground text-center">
							Don't have an account?{" "}
							<Button
								variant="link"
								className="p-0 h-auto text-primary hover:text-accent"
								asChild>
								<a href="/register">Create one now</a>
							</Button>
						</p>
					</CardFooter>
				</Card>

				{/* Additional Info */}
				<div className="text-center mt-6">
					<p className="text-xs text-muted-foreground">
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
};

export default LoginPage;
