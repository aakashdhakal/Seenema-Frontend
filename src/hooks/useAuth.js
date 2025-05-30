"use client";
import useSWR from "swr";

// Fetcher for SWR
const fetcher = (...args) =>
	fetch(...args, { credentials: "include" }).then((res) => {
		if (!res.ok) throw new Error("Not authenticated");
		return res.json();
	});

// Helper to get CSRF cookie (must be called before login/register/logout)
const getCSRFToken = async () => {
	await fetch("http://localhost:8000/sanctum/csrf-cookie", {
		credentials: "include",
	});
};

export const useAuth = () => {
	const {
		data: user,
		error,
		isLoading,
		mutate,
	} = useSWR("http://localhost:8000/api/user", fetcher);

	// Login function
	const login = async ({ email, password }) => {
		await getCSRFToken();

		const res = await fetch("http://localhost:8000/login", {
			method: "POST",
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({ email, password }),
		});

		if (!res.ok) {
			const err = await res.json();
			throw new Error(err.message || "Login failed");
		}

		await mutate(); // Refresh the user
	};

	// Logout function
	const logout = async () => {
		await getCSRFToken();

		await fetch("http://localhost:8000/logout", {
			method: "POST",
			credentials: "include",
		});

		await mutate(null); // Clear user data
	};

	// Register function (optional)
	const register = async ({ name, email, password }) => {
		await getCSRFToken();

		const res = await fetch("http://localhost:8000/register", {
			method: "POST",
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify({ name, email, password }),
		});

		if (!res.ok) {
			const err = await res.json();
			throw new Error(err.message || "Registration failed");
		}

		await mutate(); // User should be logged in right after register
	};

	return {
		user,
		isLoading,
		error,
		isLoggedIn: !!user,
		login,
		logout,
		register,
		mutate,
	};
};
