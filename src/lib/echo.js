import Echo from "laravel-echo";
import axios from "./axios";

let echo = null;

if (typeof window !== "undefined") {
	// Only import Pusher and set window.Pusher on the client
	const Pusher = require("pusher-js");
	window.Pusher = Pusher;

	const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
	echo = new Echo({
		broadcaster: "reverb",
		key: process.env.NEXT_PUBLIC_REVERB_APP_KEY,
		wsHost: process.env.NEXT_PUBLIC_REVERB_HOST,
		wsPort: process.env.NEXT_PUBLIC_REVERB_PORT,
		wssPort: 443,
		forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? "http") === "https",
		enabledTransports: ["ws", "wss"],
		authorizer: (channel) => {
			return {
				authorize: (socketId, callback) => {
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
}

export default echo;
