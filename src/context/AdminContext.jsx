"use client";

import { useAuthContext } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import PageLoadingComponent from "@/components/combinedComponents/PageLoadingComponent";

export default function AdminRoute({ children }) {
	const { user, isLoading } = useAuthContext();
	const router = useRouter();

	useEffect(() => {
		if (isLoading) {
			return; // Wait until authentication status is determined
		}

		// If loading is complete, check the user's status
		if (!user) {
			// If not logged in, redirect to the login page
			router.replace("/login");
		} else if (user?.role !== "admin") {
			// If logged in but not an admin, redirect to an access denied page
			router.replace("/denied");
		} else if (user.status === "suspended") {
			// If the account is suspended, redirect to the suspended page
			router.replace("/suspended");
		}
	}, [user, isLoading, router]);

	// While loading or if the user is not an admin, show a loading screen.
	// This prevents a flash of content before the redirect happens.
	if (isLoading || !user || user?.role !== "admin") {
		return <PageLoadingComponent />;
	}

	// If the user is an admin, render the protected page content.
	return <>{children}</>;
}
