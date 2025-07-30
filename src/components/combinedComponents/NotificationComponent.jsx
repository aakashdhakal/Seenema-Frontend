"use client";
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

export default function NotificationComponent() {
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
	</DropdownMenu>;
}
