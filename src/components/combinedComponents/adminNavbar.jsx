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
import echo from "@/lib/echo";
import { toast } from "sonner";

export default function AdminNavbar() {
	const [mounted, setMounted] = useState(false);
	const [notifications, setNotifications] = useState([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [searchQuery, setSearchQuery] = useState("");
	const [isSearchFocused, setIsSearchFocused] = useState(false);
	const [connectionStatus, setConnectionStatus] = useState("disconnected");
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

		// Only setup notifications if user is authenticated
		if (!user?.user?.id) return;

		console.log("Setting up Reverb notifications for user:", user.id);
		console.log(echo.connector?.pusher?.connection);

		// Listen for connection events
		if (echo.connector?.pusher?.connection) {
			echo.connector.pusher.connection.bind("connected", () => {
				console.log("Reverb connected successfully");
				setConnectionStatus("connected");
			});

			echo.connector.pusher.connection.bind("disconnected", () => {
				console.log("Reverb disconnected");
				setConnectionStatus("disconnected");
			});

			echo.connector.pusher.connection.bind("error", (error) => {
				console.error("Reverb connection error:", error);
				setConnectionStatus("error");
			});
		}

		// Listen for admin notifications
		const adminChannel = echo
			.private("admin.notifications")
			.listen(".video.processing.status", (data) => {
				//update status of video
			})
			.error((error) => {
				console.error("Admin channel error:", error);
			});

		// Cleanup function
		return () => {
			if (adminChannel) {
				adminChannel.stopListening(".video.processing.status");
			}
			echo.leaveChannel("admin.notifications");
			if (user.role === "admin") {
				echo.leaveChannel(`user.${user.id}`);
			}
		};
	}, [user?.user?.id]);

	const handleNotification = (data, source) => {
		const notification = {
			id: `${source}-${data.video_id}-${Date.now()}`,
			type: "video_processing",
			title: getNotificationTitle(data.status),
			message: data.message || `${data.video_title} - ${data.status}`,
			videoId: data.video_id,
			videoTitle: data.video_title,
			status: data.status,
			progress: data.progress || 0,
			timestamp: data.timestamp || new Date().toISOString(),
			time: new Date().toLocaleTimeString(),
			read: false,
			icon: getNotificationIcon(data.status),
		};

		// Add to notifications list (avoid duplicates)
		setNotifications((prev) => {
			const exists = prev.some((n) => n.id === notification.id);
			if (!exists) {
				// Only increment unread count for new notifications
				setUnreadCount((count) => count + 1);
				return [notification, ...prev.slice(0, 19)]; // Keep only last 20
			}
			return prev;
		});

		// Show toast notification
		showToast(notification);
	};

	const getNotificationTitle = (status) => {
		switch (status) {
			case "processing":
				return "🔄 Video Processing";
			case "ready":
				return "✅ Video Ready!";
			case "failed":
				return "❌ Processing Failed";
			default:
				return "📹 Video Update";
		}
	};

	const getNotificationIcon = (status) => {
		switch (status) {
			case "processing":
				return "solar:refresh-bold-duotone";
			case "ready":
				return "solar:check-circle-bold-duotone";
			case "failed":
				return "solar:close-circle-bold-duotone";
			default:
				return "solar:videocamera-record-bold-duotone";
		}
	};

	const getNotificationColor = (status) => {
		switch (status) {
			case "processing":
				return "bg-blue-100 text-blue-600";
			case "ready":
				return "bg-green-100 text-green-600";
			case "failed":
				return "bg-red-100 text-red-600";
			default:
				return "bg-gray-100 text-gray-600";
		}
	};

	const showToast = (notification) => {
		switch (notification.status) {
			case "ready":
				toast.success(notification.title, {
					description: notification.message,
					duration: 5000,
					action: {
						label: "View Video",
						onClick: () => router.push(`/admin/videos/${notification.videoId}`),
					},
				});
				break;
			case "failed":
				toast.error(notification.title, {
					description: notification.message,
					duration: 7000,
				});
				break;
			case "processing":
				toast.info(notification.title, {
					description: notification.message,
					duration: 3000,
				});
				break;
		}
	};

	const markAsRead = (id) => {
		setNotifications((prev) =>
			prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)),
		);
		const notification = notifications.find((n) => n.id === id);
		if (notification && !notification.read) {
			setUnreadCount((prev) => Math.max(0, prev - 1));
		}
	};

	const markAllAsRead = () => {
		const unreadNotifications = notifications.filter((n) => !n.read);
		setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
		setUnreadCount(0);
	};

	const clearAllNotifications = () => {
		setNotifications([]);
		setUnreadCount(0);
	};

	const formatTimeAgo = (timestamp) => {
		const now = new Date();
		const time = new Date(timestamp);
		const diffInSeconds = Math.floor((now - time) / 1000);

		if (diffInSeconds < 60) return "Just now";
		if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
		if (diffInSeconds < 86400)
			return `${Math.floor(diffInSeconds / 3600)}h ago`;
		return `${Math.floor(diffInSeconds / 86400)}d ago`;
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
						{/* Connection Status Indicator */}
						{process.env.NODE_ENV === "development" && (
							<div className="flex items-center gap-1">
								<div
									className={`w-2 h-2 rounded-full ${
										connectionStatus === "connected"
											? "bg-green-500"
											: connectionStatus === "error"
											? "bg-red-500"
											: "bg-yellow-500"
									}`}
								/>
								<span className="text-xs text-muted-foreground">
									{connectionStatus}
								</span>
							</div>
						)}
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
						className="h-9 w-9 lg:flex items-center justify-center"
						onClick={() => {
							setTheme(theme === "dark" ? "light" : "dark");
						}}>
						<Icon icon="solar:moon-bold-duotone" className="h-4 w-4" />
						<span className="sr-only">Toggle Dark Mode</span>
					</Button>

					{/* Notifications */}
					<DropdownMenu>
						<DropdownMenuTrigger className="cursor-pointer" asChild>
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
								<div className="flex items-center gap-2">
									{unreadCount > 0 && (
										<Badge variant="secondary" className="text-xs">
											{unreadCount} new
										</Badge>
									)}
									{notifications.length > 0 && (
										<div className="flex gap-1">
											<Button
												variant="ghost"
												size="sm"
												onClick={markAllAsRead}
												className="h-6 px-2 text-xs">
												Mark all read
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={clearAllNotifications}
												className="h-6 px-2 text-xs text-red-600 hover:text-red-700">
												Clear all
											</Button>
										</div>
									)}
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<div className="max-h-80 overflow-y-auto">
								{notifications.length > 0 ? (
									notifications.map((notification) => (
										<DropdownMenuItem
											key={notification.id}
											className="flex items-start gap-3 p-3 cursor-pointer"
											onClick={() => {
												markAsRead(notification.id);
												if (notification.videoId) {
													router.push(`/admin/videos/${notification.videoId}`);
												}
											}}>
											<div
												className={`flex-shrink-0 p-2 rounded-full ${getNotificationColor(
													notification.status,
												)}`}>
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
												<p className="text-xs text-muted-foreground mt-1 line-clamp-2">
													{notification.message}
												</p>
												{notification.status === "processing" &&
													notification.progress > 0 && (
														<div className="mt-2">
															<div className="w-full bg-gray-200 rounded-full h-1.5">
																<div
																	className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
																	style={{
																		width: `${notification.progress}%`,
																	}}></div>
															</div>
															<p className="text-xs text-muted-foreground mt-1">
																{notification.progress}% complete
															</p>
														</div>
													)}
												<p className="text-xs text-muted-foreground mt-1">
													{formatTimeAgo(notification.timestamp)}
												</p>
											</div>
										</DropdownMenuItem>
									))
								) : (
									<div className="p-4 text-center text-sm text-muted-foreground">
										No notifications yet
									</div>
								)}
							</div>
							{notifications.length > 10 && (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem className="text-center justify-center p-2">
										<Button
											variant="ghost"
											size="sm"
											className="w-full"
											onClick={() => router.push("/admin/notifications")}>
											View all notifications
										</Button>
									</DropdownMenuItem>
								</>
							)}
						</DropdownMenuContent>
					</DropdownMenu>

					{/* User Profile */}
					<DropdownMenu>
						<DropdownMenuTrigger className="w-8 h-8 rounded-full" asChild>
							<Button variant="ghost" className="relative w-min h-min p-0">
								{loading ? (
									<Skeleton className="h-8 w-8 rounded-full" />
								) : (
									<UserAvatar
										src={user?.user?.profile_picture}
										fallback={user?.user?.name?.charAt(0).toUpperCase() || "U"}
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
