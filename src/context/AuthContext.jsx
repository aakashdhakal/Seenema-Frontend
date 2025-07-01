"use client";
import React, { createContext, useContext } from "react";
import { useAuth } from "@/hooks/useAuth";

const AuthContext = createContext();

export function AuthProvider({ children }) {
	const auth = useAuth(); // contains { user, isLoading, ... }

	return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
	const context = useContext(AuthContext);
	if (!context)
		throw new Error("useAuthContext must be used inside AuthProvider");
	return context;
}
