"use client";

import { useState, useEffect } from "react";
import { redirect } from "next/navigation";

export default function SignupPage() {
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");

	// Cookie getter utility
	function getCookie(name) {
		const value = `; ${document.cookie}`;
		const parts = value.split(`; ${name}=`);
		if (parts.length === 2)
			return decodeURIComponent(parts.pop().split(";").shift());
	}

	const handleSubmit = async (e) => {
		e.preventDefault();

		const tokenResponse = await fetch(
			"http://localhost:8000/sanctum/csrf-cookie",
			{
				method: "GET",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
			},
		);
		if (!tokenResponse.ok) {
			setError("Failed to fetch CSRF token. Please try again.");
			return;
		} else {
			const response = await fetch("http://localhost:8000/register", {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
					"X-XSRF-TOKEN": getCookie("XSRF-TOKEN"),
					Accept: "application/json",
				},
				body: JSON.stringify({
					name,
					email,
					password,
					password_confirmation: confirmPassword,
				}),
			});
		}
	};

	return (
		<div className="flex justify-center items-center h-screen bg-gray-100">
			<form
				onSubmit={handleSubmit}
				className="w-80 p-6 bg-white shadow-md rounded-md">
				<h2 className="text-2xl font-bold text-center mb-6">Sign Up</h2>

				{error && (
					<div className="mb-4 text-red-600 text-sm text-center">{error}</div>
				)}

				<div className="mb-4">
					<label
						htmlFor="name"
						className="block text-sm font-medium text-gray-700 mb-2">
						Name
					</label>
					<input
						type="text"
						id="name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					/>
				</div>

				<div className="mb-4">
					<label
						htmlFor="email"
						className="block text-sm font-medium text-gray-700 mb-2">
						Email
					</label>
					<input
						type="email"
						id="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					/>
				</div>

				<div className="mb-4">
					<label
						htmlFor="password"
						className="block text-sm font-medium text-gray-700 mb-2">
						Password
					</label>
					<input
						type="password"
						id="password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					/>
				</div>

				<div className="mb-4">
					<label
						htmlFor="confirmPassword"
						className="block text-sm font-medium text-gray-700 mb-2">
						Confirm Password
					</label>
					<input
						type="password"
						id="confirmPassword"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						required
					/>
				</div>

				<button
					type="submit"
					className="w-full py-2 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition">
					Sign Up
				</button>
			</form>
		</div>
	);
}
