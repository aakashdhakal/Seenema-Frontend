"use client";
import LandingPage from "./LandingPage";
import HomePage from "./HomePage";
import { useAuthContext } from "@/context/AuthContext";
import PageLoadingComponent from "@/components/combinedComponents/PageLoadingComponent";
import SuspendedPage from "./(user)/suspended/SuspendedPage";
import { redirect } from "next/navigation";

export default function Page() {
	const { user, isLoading } = useAuthContext();

	if (isLoading) {
		return <PageLoadingComponent />;
	}

	if (user) {
		if (user.status === "suspended") {
			redirect("/suspended");
		}

		return <HomePage />;
	}

	return <LandingPage />;
}
