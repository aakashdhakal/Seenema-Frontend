import { Metadata } from "next";
import AdminDashboard from "./AdminHome";

export const metadata = {
	title: "Dashboard - Seenema",
	description:
		"Admin Dashboard - Manage your Seenema account, view analytics, and control content.",
};

export default function Login() {
	return <AdminDashboard />;
}
