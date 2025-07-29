import Echo from "laravel-echo";
import Pusher from "pusher-js";
import axios from "./axios"; // Import your configured Axios instance

window.Pusher = Pusher;
const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const echo = new Echo({
	broadcaster: "reverb",
	key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
	wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
	wsPort: process.env.NEXT_PUBLIC_REVERB_PORT,
	wssPort: process.env.NEXT_PUBLIC_REVERB_PORT,
	forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? "http") === "https",
	enabledTransports: ["ws", "wss"],

	// REMOVE the old 'auth' block and REPLACE it with a custom authorizer.
	authorizer: (channel, options) => {
		return {
			authorize: (socketId, callback) => {
				// Use your Sanctum-configured axios instance to make the auth request.
				// The browser will handle the cookies automatically.
				axios
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
