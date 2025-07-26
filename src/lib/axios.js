// lib/axios.js
import axios from "axios";
import Cookies from "js-cookie"; // for CSRF token handling

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const axiosClient = axios.create({
	baseURL: backendUrl + "/api", // Laravel API
	withCredentials: true, // Send cookies (laravel_session, XSRF-TOKEN)
	headers: {
		Accept: "application/json",
	},
});

// Intercept and attach CSRF token on each request
axiosClient.interceptors.request.use((config) => {
	const token = Cookies.get("XSRF-TOKEN");
	if (token) {
		config.headers["X-XSRF-TOKEN"] = token;
	}
	return config;
});

export default axiosClient;
