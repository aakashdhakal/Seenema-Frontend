"use client";
import useSWR from "swr";
import axios from "@/lib/axios"; // your globally pre-configured axiosClient

// SWR fetcher using global axios
const fetcher = (url) => axios.get(url).then((res) => res.data);

// Helper to call /sanctum/csrf-cookie (CSRF token gets auto-handled by axios)
export const getCSRFToken = async () => {
	await axios.get("http://localhost:8000/sanctum/csrf-cookie");
};

export const useAuth = () => {
	const {
		data: user,
		error,
		isLoading,
		mutate,
	} = useSWR("/user", fetcher, {
		revalidateOnFocus: false, // don't re-fetch on focus
		revalidateOnReconnect: true, // don't re-fetch on reconnect
	});

	const login = async ({ email, password }) => {
		await getCSRFToken(); // this triggers Laravel to send back CSRF token in cookie

		try {
			await axios.post("/login", { email, password });
			await mutate(); // refresh user
		} catch (err) {
			throw new Error(err.response?.data?.message || "Login failed");
		}
	};

	const logout = async () => {
		await getCSRFToken();

		try {
			if (user) await axios.post("/logout");
			await mutate(null);
		} catch (err) {
			throw new Error(err.response?.data?.message || "Logout failed");
		}
	};

	const isEmailVerified = () => {
		return user?.email_verified_at !== null;
	};

	const sendVerificationEmail = async () => {
		await getCSRFToken();

		try {
			const res = await axios.post("/email/verification-notification");
			if (res.status === 200) {
				return res.data;
			} else {
				throw new Error("Failed to send verification email");
			}
		} catch (err) {
			throw new Error(
				err.response?.data?.message || "Failed to resend verification email",
			);
		}
	};

	const registerUser = async ({ name, email, password, confirmPassword }) => {
		await getCSRFToken();

		try {
			const res = await axios.post("/register", {
				name,
				email,
				password,
				password_confirmation: confirmPassword,
			});
			await mutate(); // refresh user
			return res;
		} catch (err) {
			throw new Error(err.response?.data?.message || "Registration failed");
		}
	};

	return {
		user,
		isLoading,
		error,
		isLoggedIn: !!user,
		login,
		logout,
		registerUser,
		mutate,
		isEmailVerified,
		sendVerificationEmail,
	};
};
