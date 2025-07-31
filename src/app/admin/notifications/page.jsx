import { Metadata } from "next";
import AdminNotification from "./AdminNotification";

export const metadata = {
	title: "Notifications - Seenema",
	description:
		"Admin Notifications - Broadcast messages, manage notifications, and view user activity.",
};

export default function Login() {
	return <AdminNotification />; // Render the AdminNotification component
}
