import { Metadata } from "next";
import SignupPage from "./SignupPage";

export const metadata = {
	title: "Signup - Seenema",
	description:
		"Login to your Seenema account to access your favorite movies and shows.",
};

export default function Signup() {
	return <SignupPage />;
}
