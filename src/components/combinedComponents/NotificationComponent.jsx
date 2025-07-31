"use client";

import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "@/context/AuthContext";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import axios from "@/lib/axios";
import echo from "@/lib/echo";
import { toast } from "sonner";

const formatTimeAgo = (timestamp) => {
	if (!timestamp) return "Now";
	const diff = Math.floor((Date.now() - new Date(timestamp)) / 1000);
	if (diff < 60) return "Now";
	if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
	if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
	if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
	return new Date(timestamp).toLocaleDateString();
};

export default function NotificationComponent() {
	const { user } = useAuthContext();
	const [notifications, setNotifications] = useState([]);
	const [unreadCount, setUnreadCount] = useState(0);
	const [loading, setLoading] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [hasMore, setHasMore] = useState(true);
	const [page, setPage] = useState(1);
	const [isOpen, setIsOpen] = useState(false);
	const scrollRef = useRef(null);
	const [deleteLoadingId, setDeleteLoadingId] = useState(null);
	// Update unread count
	const updateUnreadCount = (list) => {
		const count = list.filter((n) => !n.read).length;
		setUnreadCount(count);
	};

	// Fetch notifications with pagination
	const fetchNotifications = async (pageNum = 1, append = false) => {
		if (!user) return;

		try {
			if (!append) setLoading(true);
			else setLoadingMore(true);

			const res = await axios.get(`/notifications?page=${pageNum}`);
			const data = res.data;

			const mapped = (data.data || []).map((notification) => ({
				id: notification.id,
				title: notification.data?.title || notification.title || "Notification",
				message: notification.data?.body || notification.body || "",
				read: !!notification.read_at,
				created_at: notification.created_at,
			}));
			if (append) {
				setNotifications((prev) => {
					// Skip first of mapped if its id matches last of prev
					let newMapped = mapped;
					if (
						prev.length &&
						mapped.length &&
						prev[prev.length - 1].id === mapped[0].id
					) {
						newMapped = mapped.slice(1);
					}
					const updated = [...prev, ...newMapped];
					updateUnreadCount(updated);
					return updated;
				});
			} else {
				setNotifications(mapped);
				updateUnreadCount(mapped);
			}
			setHasMore(data.current_page * data.per_page < data.total);
		} catch (err) {
			console.error("Fetch notifications failed:", err);
		} finally {
			setLoading(false);
			setLoadingMore(false);
		}
	};

	// Handle scroll for infinite loading
	const handleScroll = (e) => {
		const { scrollTop, scrollHeight, clientHeight } = e.target;
		if (
			scrollHeight - scrollTop <= clientHeight + 100 &&
			hasMore &&
			!loadingMore
		) {
			const nextPage = page + 1;
			setPage(nextPage);
			fetchNotifications(nextPage, true);
		}
	};

	// Mark single notification as read
	const markAsRead = async (id) => {
		const notification = notifications.find((n) => n.id === id);
		if (!notification || notification.read) return;
		try {
			await axios.post("/notifications/mark-as-read", { id });
			setNotifications((prev) => {
				const updated = prev.map((n) =>
					n.id === id ? { ...n, read: true } : n,
				);
				updateUnreadCount(updated);
				return updated;
			});
		} catch (err) {
			console.error("Mark as read failed:", err);
		}
	};

	// Mark all as read
	const markAllAsRead = async () => {
		try {
			await axios.post("/notifications/mark-all-as-read");
			const updated = notifications.map((n) => ({ ...n, read: true }));
			setNotifications(updated);
			updateUnreadCount(updated);
			toast.success("All notifications marked as read");
		} catch (err) {
			toast.error("Failed to mark notifications as read");
		}
	};

	// Clear all notifications
	const clearAll = async () => {
		try {
			await axios.post("/notifications/delete-all");
			setNotifications([]);
			setUnreadCount(0);
			setPage(1);
			setHasMore(true);
			toast.success("All notifications cleared");
		} catch (err) {
			toast.error("Failed to clear notifications");
		}
	};

	// Handle notification click
	const handleClick = (n) => {
		if (!n.read) markAsRead(n.id);
	};

	const handleDelete = async (id, e) => {
		e.stopPropagation();
		if (deleteLoadingId) return;
		setDeleteLoadingId(id);
		try {
			const res = await axios.post("/notifications/delete/" + id);
			if (res.status === 200) {
				setNotifications((prev) => {
					const updated = prev.filter((n) => n.id !== id);
					updateUnreadCount(updated);
					return updated;
				});
			}
		} catch (err) {
			console.error("Delete notification failed:", err);
		}
		setDeleteLoadingId(null);
	};

	// Real-time notifications via WebSocket
	useEffect(() => {
		if (!user?.id) return;

		const channel = echo
			.private(`user.${user.id}`)
			.listen(".notification", (event) => {
				const notification = {
					id: event.id || Date.now(),
					title:
						event.title || (event.data && event.data.title) || "Notification",
					message: event.message || (event.data && event.data.message) || "",
					read: false,
					created_at: new Date().toISOString(),
				};

				setNotifications((prev) => {
					const updated = [notification, ...prev];
					updateUnreadCount(updated);
					return updated;
				});
				const notificationSound = new Audio("/notification.mp3");
				notificationSound.play().catch(() => {});
				toast.info(notification.message);
			});

		return () => echo.leaveChannel(`private-user.${user.id}`);
	}, [user?.id]);

	// Fetch notifications on mount and when user changes
	useEffect(() => {
		if (user) {
			setPage(1);
			fetchNotifications(1, false);
		}
	}, [user]);

	// Handle dropdown open/close
	const handleOpenChange = (open) => {
		setIsOpen(open);
	};

	return (
		<DropdownMenu open={isOpen} onOpenChange={handleOpenChange} modal={false}>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="relative h-9 w-9">
					<Icon icon="fa7-solid:bell" width="3.5em" height="4em" />{" "}
					{unreadCount > 0 && (
						<Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-destructive text-destructive-foreground">
							{unreadCount > 9 ? "9+" : unreadCount}
						</Badge>
					)}
					<span className="sr-only">Notifications</span>
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align="end" className="w-[26rem] mt-2 mr-[-3rem]">
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
									disabled={!unreadCount}
									className="h-6 px-2 text-xs">
									Mark all read
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onClick={clearAll}
									className="h-6 px-2 text-xs text-red-600 hover:text-red-700">
									Clear all
								</Button>
							</div>
						)}
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />

				<div
					ref={scrollRef}
					className="max-h-80 overflow-y-auto"
					onScroll={handleScroll}>
					{loading ? (
						<div className="p-4 text-center">
							<Icon
								icon="eos-icons:bubble-loading"
								className="h-6 w-6 mx-auto text-muted-foreground"
							/>
							<p className="text-sm text-muted-foreground mt-2">
								Loading notifications...
							</p>
						</div>
					) : notifications.length > 0 ? (
						<>
							{console.log("Notifications:", notifications)}
							{notifications.map((n) => (
								<DropdownMenuItem
									key={n.id}
									className="flex items-start  gap-3 p-3 cursor-pointer hover:bg-muted/50 w-full"
									onClick={() => handleClick(n)}>
									<div className="flex-shrink-0 pt-1">
										{!n.read && (
											<div className="w-2 h-2 bg-primary rounded-full" />
										)}
									</div>
									<div className="flex-1 min-w-0">
										<p
											className={`text-sm ${
												!n.read ? "font-semibold" : "font-medium"
											}`}>
											{n.title}
										</p>
										<p className="text-sm text-muted-foreground mt-1 line-clamp-2">
											{n.message}
										</p>
										<p className="text-xs text-muted-foreground mt-1">
											{formatTimeAgo(n.created_at)}
										</p>
									</div>
									<Button
										variant="icon"
										className={"mt-auto mb-auto text-2xl"}
										onClick={(e) => {
											handleDelete(n.id, e);
										}}
										isLoading={deleteLoadingId === n.id}
										loadingText={
											<Icon
												icon="eos-icons:bubble-loading"
												className="w-4 h-4 text-muted-foreground text-"
											/>
										}>
										<Icon icon="charm:cross" height="none" />
									</Button>
								</DropdownMenuItem>
							))}

							{loadingMore && (
								<div className="p-4 text-center">
									<Icon
										icon="eos-icons:bubble-loading"
										className="h-4 w-4 mx-auto text-muted-foreground"
									/>
									<p className="text-xs text-muted-foreground mt-1">
										Loading more...
									</p>
								</div>
							)}

							{!hasMore && notifications.length > 10 && (
								<div className="p-2 text-center">
									<p className="text-xs text-muted-foreground">
										No more notifications
									</p>
								</div>
							)}
						</>
					) : (
						<div className="p-8 text-center">
							<Icon
								icon="solar:bell-off-bold-duotone"
								className="h-12 w-12 mx-auto text-muted-foreground mb-3"
							/>
							<p className="text-sm text-muted-foreground">
								No notifications yet
							</p>
							<p className="text-xs text-muted-foreground mt-1">
								We'll notify you when something happens
							</p>
						</div>
					)}
				</div>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
