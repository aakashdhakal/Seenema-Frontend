"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";
import { useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuthContext } from "@/context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import UserAvatar from "../singleComponents/UserAvatar";
import { useTheme } from "next-themes";
import Link from "next/link";

import NotificationComponent from "./NotificationComponent";

export default function AdminNavbar() {
	const [mounted, setMounted] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [isSearchFocused, setIsSearchFocused] = useState(false);
	const router = useRouter();
	const pathname = usePathname();
	const { user, logout, loading } = useAuthContext();
	const { setTheme, theme } = useTheme();

	// Get page title and breadcrumb based on current route
	const getPageInfo = () => {
		const pathSegments = pathname.split("/").filter(Boolean);
		const currentPage = pathSegments[pathSegments.length - 1];

		const pageMap = {
			dashboard: {
				title: "Dashboard",
				subtitle: "Welcome back, admin!",
				icon: "solar:home-smile-bold-duotone",
			},
			videos: {
				title: "Video Management",
				subtitle: "Manage all video content",
				icon: "solar:videocamera-record-bold-duotone",
			},
			upload: {
				title: "Video Management",
				subtitle: "Manage all video content",
				icon: "solar:videocamera-record-bold-duotone",
			},
			users: {
				title: "User Management",
				subtitle: "Manage user accounts",
				icon: "solar:users-group-two-rounded-bold-duotone",
			},
			settings: {
				title: "System Settings",
				subtitle: "Configure system preferences",
				icon: "solar:settings-bold-duotone",
			},
			support: {
				title: "Help & Support",
				subtitle: "Support tickets and help",
				icon: "solar:help-bold-duotone",
			},
		};

		return (
			pageMap[currentPage] || {
				title: "Admin Panel",
				subtitle: "System administration",
				icon: "solar:shield-user-bold-duotone",
			}
		);
	};

	// Handle search
	const handleSearch = (e) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			console.log("Searching for:", searchQuery);
		}
	};

	// Setup Laravel Reverb notifications
	useEffect(() => {
		setMounted(true);
		if (!user) return;
	}, [user]);

	if (!mounted) return null;

	const pageInfo = getPageInfo();

	return (
		<header className="sticky top-0 z-40 border-b border-sidebar-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="flex h-16 items-center gap-4 px-4 lg:px-6">
				{/* Mobile Sidebar Trigger */}
				<SidebarTrigger className="lg:hidden" />

				{/* Page Title & Breadcrumb */}
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<div className="min-w-0">
							<h1 className="text-lg font-semibold text-foreground truncate">
								{pageInfo.title}
							</h1>
						</div>
					</div>
				</div>

				{/* Search Bar */}
				<div className="hidden md:flex w-full max-w-sm border-2 rounded-md">
					<form onSubmit={handleSearch} className="relative w-full">
						<Icon
							icon="solar:magnifer-bold-duotone"
							className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors ${
								isSearchFocused ? "text-primary" : "text-muted-foreground"
							}`}
						/>
						<Input
							type="text"
							placeholder="Search admin panel..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onFocus={() => setIsSearchFocused(true)}
							onBlur={() => setIsSearchFocused(false)}
							className="pl-10 pr-10 w-full bg-background border-input focus:ring-1 focus:ring-primary"
						/>
						{searchQuery && (
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-transparent"
								onClick={() => setSearchQuery("")}>
								<Icon icon="radix-icons:cross-2" className="h-3 w-3" />
							</Button>
						)}
					</form>
				</div>

				{/* Actions */}
				<div className="flex items-center gap-4">
					{/* Mobile Search */}
					<Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
						<Icon icon="solar:magnifer-bold-duotone" className="h-4 w-4" />
						<span className="sr-only">Search</span>
					</Button>

					{/* Dark mode toggle */}
					<Button
						variant="ghost"
						size="icon"
						className="h-9 w-9 lg:flex items-center justify-center text-2xl"
						onClick={() => {
							setTheme(theme === "dark" ? "light" : "dark");
						}}>
						<Icon icon="ic:baseline-dark-mode" width="2em" height="2em" />
						<span className="sr-only">Toggle Dark Mode</span>
					</Button>

					{/* Notifications */}
					<NotificationComponent />

					{/* User Profile */}
					<DropdownMenu modal={false}>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								className="relative h-8 w-8 rounded-full p-0 hover:bg-accent/50 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
								<UserAvatar
									src={user.profile_picture}
									fallback={user.name?.charAt(0).toUpperCase() || "U"}
									className="h-8 w-8"
								/>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-40 mt-3" align="end" forceMount>
							<DropdownMenuLabel className="font-normal">
								<div className="flex flex-col space-y-1 justify-center">
									<p className="text-sm font-medium leading-none text-center">
										{user.name || "User"}
									</p>
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							{user.role === "admin" && (
								<DropdownMenuItem asChild>
									<Link rel="preload" href="/admin" className="cursor-pointer">
										<Icon
											icon="material-symbols:admin-panel-settings"
											className="mr-2 h-4 w-4"
										/>
										<span>Admin Panel</span>
									</Link>
								</DropdownMenuItem>
							)}
							<DropdownMenuItem asChild>
								<Link rel="preload" href="/profile" className="cursor-pointer">
									<Icon
										icon="material-symbols:person-outline"
										className="mr-2 h-4 w-4"
									/>
									<span>Profile</span>
								</Link>
							</DropdownMenuItem>

							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => {
									logout();
									router.push("/login");
								}}
								className={"cursor-pointer"}>
								<Icon icon="material-symbols:logout" className="mr-2 h-4 w-4" />
								<span>Log out</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</header>
	);
}
