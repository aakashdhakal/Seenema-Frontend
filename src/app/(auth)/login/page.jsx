"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const LoginPage = () => {
	const { login, isLoggedIn, isLoading } = useAuth();
	const [credentials, setCredentials] = useState({
		email: "",
		password: "",
	});
	const [error, setError] = useState("");

	// If already logged in, redirect to dashboard
	useEffect(() => {
		if (isLoggedIn && !isLoading) {
			// Redirect to dashboard
			router.push("/dashboard");
		}
	}, [isLoggedIn, isLoading]);

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
			await login(credentials); // uses CSRF internally
		} catch (err) {
			console.error("Login failed", err.message);
			setError(err.message);
		}
	};

	return (
		<div className="flex justify-center items-center h-screen bg-gray-100">
			<form
				onSubmit={handleSubmit}
				className="w-80 p-6 bg-white shadow-md rounded-md flex flex-col gap-4">
				<h2 className="text-2xl font-bold text-center mb-6">Login</h2>

				{error && <p className="text-red-600 text-sm text-center">{error}</p>}

				<div>
					<label
						htmlFor="email"
						className="block text-sm font-medium text-gray-700 mb-2">
						Email
					</label>
					<input
						type="email"
						name="email"
						id="email"
						value={credentials.email}
						onChange={handleChange}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					/>
				</div>

				<div>
					<label
						htmlFor="password"
						className="block text-sm font-medium text-gray-700 mb-2">
						Password
					</label>
					<input
						type="password"
						name="password"
						id="password"
						value={credentials.password}
						onChange={handleChange}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					/>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					className="w-full py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition">
					{isLoading ? "Logging in..." : "Login"}
				</button>

				<a
					href="http://localhost:8000/auth/google/redirect"
					className="text-center">
					<button
						type="button"
						className="w-full py-2 mt-4 bg-red-500 text-white font-semibold rounded-md hover:bg-red-600 transition">
						Login with Google
					</button>
				</a>
			</form>
		</div>
	);
};

export default LoginPage;
