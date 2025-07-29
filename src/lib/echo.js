import Echo from "laravel-echo";
import axiosInstance from "./axios";

const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const echo = new Echo({
	broadcaster: "reverb",
	key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
	wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
	wsPort: process.env.NEXT_PUBLIC_REVERB_PORT,
	wssPort: process.env.NEXT_PUBLIC_REVERB_PORT,
	forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? "http") === "https",
	enabledTransports: ["ws", "wss"],
	authorizer: (channel, options) => {
		return {
			authorize: (socketId, callback) => {
				axiosInstance
					.post(backendUrl + "/broadcasting/auth", {
						socket_id: socketId,
						channel_name: channel.name,
					})
					.then((response) => {
						callback(false, response.data);
					})
					.catch((error) => {
						console.error("Broadcasting authorization failed:", error);
						callback(true, error);
					});
			},
		};
	},
});

export default echo;
