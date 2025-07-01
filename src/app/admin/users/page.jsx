import { Metadata } from "next";
import AdminUsers from "./AdminUsers";

export const metadata = {
	title: "Users - Seenema",
	description:
		"Admin Users - Manage your Seenema users, view user activity, and control user accounts.",
};

export default function Login() {
	return <AdminUsers />;
}
