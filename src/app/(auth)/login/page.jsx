import { Metadata } from "next";
import LoginPage from "./LoginPage";

export const metadata = {
	title: "Login - Seenema",
	description:
		"Login to your Seenema account to access your favorite movies and shows.",
};

export default function Login() {
	return <LoginPage />;
}
