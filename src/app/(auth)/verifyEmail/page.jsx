import { Metadata } from "next";
import VerifyEmailPage from "./VerifyEmailPage";

export const metadata = {
	title: "Verify Email - Seenema",
	description:
		"Verify your email address to complete your Seenema account setup.",
};

export default function VerifyEmail() {
	return <VerifyEmailPage />;
}
