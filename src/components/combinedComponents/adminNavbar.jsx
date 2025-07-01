"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";

export default function AdminNavbar() {
	const [mounted, setMounted] = useState(false);
	const [notifications, setNotifications] = useState([]);
	const [unreadCount, setUnreadCount] = useState(3);
	const [searchQuery, setSearchQuery] = useState("");
	const [isSearchFocused, setIsSearchFocused] = useState(false);
	const router = useRouter();
	const pathname = usePathname();
	const { theme, setTheme } = useTheme();

	// Get page title based on current route
	const getPageTitle = () => {
		const pathSegments = pathname.split("/").filter(Boolean);
		const currentPage = pathSegments[pathSegments.length - 1];

		switch (currentPage) {
			case "dashboard":
				return "Dashboard Overview";
			case "videos":
				return "Video Management";
			case "users":
				return "User Management";
			case "analytics":
				return "Analytics & Reports";
			case "settings":
				return "System Settings";
			case "support":
				return "Help & Support";
			default:
				return "Admin Panel";
		}
	};

	// Handle hydration
	useEffect(() => {
		setMounted(true);
		// Mock notifications
		setNotifications([
			{
				id: 1,
				title: "New user registration",
				message: "John Doe has registered",
				time: "2 min ago",
				type: "user",
				read: false,
			},
			{
				id: 2,
				title: "Content report",
				message: "Inappropriate content reported",
				time: "15 min ago",
				type: "report",
				read: false,
			},
			{
				id: 3,
				title: "System update",
				message: "Server maintenance completed",
				time: "1 hour ago",
				type: "system",
				read: true,
			},
		]);
	}, []);

	if (!mounted) return null;

	return (
		<header className="sticky top-0 z-40 border-b border-sidebar-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="flex h-14 items-center gap-4 px-4 lg:px-6">
				{/* Mobile Sidebar Trigger */}
				<SidebarTrigger className="lg:hidden" />

				{/* Page Title */}
				<div className="flex-1">
					<h1 className="text-lg font-semibold text-foreground">
						{getPageTitle()}
					</h1>
				</div>

				{/* Search Bar */}
				<div className="hidden md:flex w-full max-w-sm">
					<div className="relative w-full">
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
							className="pl-10 pr-4 w-full bg-background border-input"
						/>
						{searchQuery && (
							<Button
								variant="ghost"
								size="sm"
								className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 p-0"
								onClick={() => setSearchQuery("")}>
								<Icon icon="solar:close-circle-bold" className="h-3 w-3" />
							</Button>
						)}
					</div>
				</div>

				{/* Actions */}
				<div className="flex items-center gap-2">
					{/* Mobile Search */}
					<Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
						<Icon icon="solar:magnifer-bold-duotone" className="h-4 w-4" />
						<span className="sr-only">Search</span>
					</Button>

					{/* Quick Actions */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="h-9 w-9">
								<Icon
									icon="solar:add-circle-bold-duotone"
									className="h-4 w-4"
								/>
								<span className="sr-only">Quick actions</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							<DropdownMenuLabel>Quick Actions</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={() => router.push("/admin/videos/add")}>
								<Icon
									icon="solar:video-library-bold"
									className="w-4 h-4 mr-2"
								/>
								Add Video Content
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => router.push("/admin/users/add")}>
								<Icon icon="solar:user-plus-bold" className="w-4 h-4 mr-2" />
								Add New User
							</DropdownMenuItem>
							<DropdownMenuItem
								onClick={() => router.push("/admin/analytics/report")}>
								<Icon icon="solar:document-add-bold" className="w-4 h-4 mr-2" />
								Generate Report
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					{/* Theme Toggle */}
					<Button
						variant="ghost"
						size="icon"
						className="h-9 w-9"
						onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
						<Icon
							icon={
								theme === "dark"
									? "solar:sun-bold-duotone"
									: "solar:moon-bold-duotone"
							}
							className="h-4 w-4"
						/>
						<span className="sr-only">Toggle theme</span>
					</Button>

					{/* Notifications */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon" className="relative h-9 w-9">
								<Icon icon="solar:bell-bold-duotone" className="h-4 w-4" />
								{unreadCount > 0 && (
									<Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs bg-destructive text-destructive-foreground border-0">
										{unreadCount > 9 ? "9+" : unreadCount}
									</Badge>
								)}
								<span className="sr-only">Notifications</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-80">
							<DropdownMenuLabel className="flex items-center justify-between">
								<span>Notifications</span>
								<Badge variant="secondary" className="text-xs">
									{unreadCount} new
								</Badge>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<div className="max-h-64 overflow-y-auto">
								{notifications.map((notification) => (
									<div
										key={notification.id}
										className="flex items-start gap-3 p-3 hover:bg-accent/50 cursor-pointer">
										<div
											className={`mt-2 h-2 w-2 rounded-full flex-shrink-0 ${
												notification.read
													? "bg-muted-foreground/30"
													: "bg-primary"
											}`}
										/>
										<div className="flex-1 space-y-1">
											<h4
												className={`text-sm font-medium ${
													!notification.read ? "text-primary" : ""
												}`}>
												{notification.title}
											</h4>
											<p className="text-xs text-muted-foreground">
												{notification.message}
											</p>
											<span className="text-xs text-muted-foreground">
												{notification.time}
											</span>
										</div>
									</div>
								))}
							</div>
							<DropdownMenuSeparator />
							<DropdownMenuItem className="justify-center text-primary">
								<Icon icon="solar:eye-bold" className="w-4 h-4 mr-2" />
								View All Notifications
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>

					{/* View Main Site */}
					<Button
						variant="ghost"
						size="icon"
						className="h-9 w-9"
						onClick={() => router.push("/home")}>
						<Icon icon="solar:home-2-bold" className="h-4 w-4" />
						<span className="sr-only">View main site</span>
					</Button>
				</div>
			</div>
		</header>
	);
}
