"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

export default function AdminNavbar() {
	const [mounted, setMounted] = useState(false);
	const [notifications, setNotifications] = useState([]);
	const [unreadCount, setUnreadCount] = useState(3);
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
			analytics: {
				title: "Analytics & Reports",
				subtitle: "View system insights",
				icon: "solar:chart-2-bold-duotone",
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
			// Implement search functionality here
			console.log("Searching for:", searchQuery);
		}
	};

	// Mock notifications
	useEffect(() => {
		setMounted(true);
		setNotifications([
			{
				id: 1,
				title: "New user registration",
				message: "John Doe has registered",
				time: "2 min ago",
				type: "user",
				read: false,
				icon: "solar:user-plus-bold-duotone",
			},
			{
				id: 2,
				title: "Content report",
				message: "Inappropriate content reported",
				time: "15 min ago",
				type: "report",
				read: false,
				icon: "solar:flag-bold-duotone",
			},
			{
				id: 3,
				title: "System update",
				message: "Server maintenance completed",
				time: "1 hour ago",
				type: "system",
				read: true,
				icon: "solar:server-bold-duotone",
			},
		]);
	}, []);

	const markAsRead = (id) => {
		setNotifications((prev) =>
			prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)),
		);
		setUnreadCount((prev) => Math.max(0, prev - 1));
	};

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
				<div className="hidden md:flex w-full max-w-sm">
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
								<Icon icon="solar:close-circle-bold" className="h-3 w-3" />
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
					{/* dark node toggle */}
					<Button
						variant="ghost"
						size="icon"
						className="h-9 w-9  lg:flex items-center justify-center"
						onClick={() => {
							setTheme(theme === "dark" ? "light" : "dark");
						}}>
						<Icon icon="solar:moon-bold-duotone" className="h-4 w-4" />
						<span className="sr-only">Toggle Dark Mode</span>
					</Button>

					{/* Notifications */}
					<DropdownMenu>
						<DropdownMenuTrigger className={"cursor-pointer"} asChild>
							<Button variant="ghost" size="icon" className="relative h-9 w-9">
								<Icon icon="solar:bell-bold-duotone" className="h-4 w-4" />
								{unreadCount > 0 && (
									<Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground">
										{unreadCount > 9 ? "9+" : unreadCount}
									</Badge>
								)}
								<span className="sr-only">Notifications</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-80">
							<DropdownMenuLabel className="flex items-center justify-between">
								<span>Notifications</span>
								{unreadCount > 0 && (
									<Badge variant="secondary" className="text-xs">
										{unreadCount} new
									</Badge>
								)}
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<div className="max-h-80 overflow-y-auto">
								{notifications.length > 0 ? (
									notifications.map((notification) => (
										<DropdownMenuItem
											key={notification.id}
											className="flex items-start gap-3 p-3 cursor-pointer"
											onClick={() => markAsRead(notification.id)}>
											<div
												className={`flex-shrink-0 p-2 rounded-full ${
													notification.type === "user"
														? "bg-blue-100 text-blue-600"
														: notification.type === "report"
														? "bg-red-100 text-red-600"
														: "bg-green-100 text-green-600"
												}`}>
												<Icon icon={notification.icon} className="h-4 w-4" />
											</div>
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2">
													<p className="text-sm font-medium truncate">
														{notification.title}
													</p>
													{!notification.read && (
														<div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
													)}
												</div>
												<p className="text-xs text-muted-foreground mt-1">
													{notification.message}
												</p>
												<p className="text-xs text-muted-foreground mt-1">
													{notification.time}
												</p>
											</div>
										</DropdownMenuItem>
									))
								) : (
									<div className="p-4 text-center text-sm text-muted-foreground">
										No notifications
									</div>
								)}
							</div>
							<DropdownMenuSeparator />
							<DropdownMenuItem className="text-center justify-center p-2">
								<Button variant="ghost" size="sm" className="w-full">
									View all notifications
								</Button>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					{/* User Profile */}
					<DropdownMenu>
						<DropdownMenuTrigger className={"w-8 h8 rounded-full"} asChild>
							<Button variant="ghost" className="relative w-min h-min p-0">
								{loading ? (
									<Skeleton className="h-8 w-8 rounded-full" />
								) : (
									<UserAvatar
										src={user.user.profile_picture}
										fallback={user.user.name?.charAt(0).toUpperCase() || "U"}
									/>
								)}
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent className="w-56" align="end" forceMount>
							<DropdownMenuLabel className="font-normal">
								<div className="flex flex-col space-y-1">
									<p className="text-sm font-medium leading-none">
										{user?.user?.name || "Admin User"}
									</p>
									<p className="text-xs leading-none text-muted-foreground">
										{user?.user?.email || "admin@example.com"}
									</p>
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem onClick={() => router.push("/admin/profile")}>
								<Icon
									icon="solar:user-circle-bold-duotone"
									className="mr-2 h-4 w-4"
								/>
								<span>Profile Settings</span>
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => router.push("/admin/settings")}>
								<Icon
									icon="solar:settings-bold-duotone"
									className="mr-2 h-4 w-4"
								/>
								<span>System Settings</span>
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => router.push("/home")}>
								<Icon icon="solar:eye-bold-duotone" className="mr-2 h-4 w-4" />
								<span>View Site</span>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={logout}
								className="text-red-600 focus:text-red-600">
								<Icon
									icon="solar:logout-bold-duotone"
									className="mr-2 h-4 w-4"
								/>
								<span>Log out</span>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</header>
	);
}
