import { Metadata } from "next";
import AdminVideos from "./AdminVideos";

export const metadata = {
	title: "Videos - Seenema",
	description:
		"Admin Videos - Manage your Seenema videos, upload new content, and edit existing videos.",
};

export default function Login() {
	return <AdminVideos />;
}
