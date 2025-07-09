import { Metadata } from "next";
import VideoUploadPage from "./UploadVideo";

export const metadata = {
	title: "Upload Video - Seenema",
	description:
		"Upload new videos to Seenema, manage your video content, and enhance your library.",
};

export default function Login() {
	return <VideoUploadPage />; // Render the VideoUploadPage component
}
