import { Geist, Geist_Mono, Nunito } from "next/font/google";
import "./globals.css";
import { SWRConfig } from "swr";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";

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
	title: "Seenema - Made to Be Seen",
	description: "See it. Feel it. Seenema",
};

export default function RootLayout({ children }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} ${nunito.variable} `}>
				<SWRConfig
					value={{
						revalidateOnFocus: false,
						revalidateOnReconnect: false,
						refreshWhenHidden: false, // Disable revalidation when the tab is hidden
						refreshWhenOffline: false, // Disable revalidation when offline
						revalidateIfStale: false, // Disable revalidation if the data is stale
						dedupingInterval: 60000, // 1 minute
						refreshInterval: 0, // Disable automatic revalidation
						focusThrottleInterval: 0, // Disable focus revalidation
						errorRetryCount: 0, // Retry failed requests up to 3 times
					}}>
					<AuthProvider>
						{children}
						<Toaster expand={true} />
					</AuthProvider>
				</SWRConfig>
			</body>
		</html>
	);
}
