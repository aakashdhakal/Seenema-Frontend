"use client";
import LandingPage from "./LandingPage";
import HomePage from "./HomePage";
import { useAuthContext } from "@/context/AuthContext";
import PageLoadingComponent from "@/components/combinedComponents/PageLoadingComponent";

export default function Page() {
	const { user, isLoading } = useAuthContext();

	if (isLoading) {
		return <PageLoadingComponent />;
	}

	if (user) {
		return <HomePage />;
	}

	return <LandingPage />;
}
