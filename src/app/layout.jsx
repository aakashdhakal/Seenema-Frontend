import { Geist, Geist_Mono, Nunito } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/combinedComponents/Navbar";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const nunito = Nunito({
	variable: "--font-nunito",
	weight: ["300", "400", "500", "600", "700"],
	subsets: ["latin"],
});

export const metadata = {
	title: "Seenema",
	description: "See it. Feel it. Seenema",
};

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body
				className={`${geistSans.variable} ${geistMono.variable} ${nunito.variable} antialiased`}>
				{/* <Navbar /> */}
				{children}
			</body>
		</html>
	);
}
