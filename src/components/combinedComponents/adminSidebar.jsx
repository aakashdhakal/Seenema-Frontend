"use client";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@iconify/react";
import Image from "next/image";
import Link from "next/link";
import { redirect, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

const navigationItems = [
	{
		title: "Dashboard",
		url: "/admin/dashboard",
		icon: "solar:widget-2-bold-duotone",
	},
	{
		title: "Videos",
		url: "/admin/videos",
		icon: "solar:video-frame-bold-duotone",
	},
	{
		title: "Users",
		url: "/admin/users",
		icon: "solar:users-group-two-rounded-bold-duotone",
	},
	{
		title: "Analytics",
		url: "/admin/analytics",
		icon: "solar:chart-2-bold-duotone",
	},
];

const settingsItems = [
	{
		title: "Settings",
		url: "/admin/settings",
		icon: "solar:settings-bold-duotone",
	},
	{
		title: "Help & Support",
		url: "/admin/support",
		icon: "solar:question-circle-bold-duotone",
	},
];

export default function AdminSidebar() {
	const pathname = usePathname();
	const { user, isLoading } = useAuth();
	const [admin, setAdmin] = useState({});

	useEffect(() => {
		// Simulate fetching admin data
		if (isLoading) return; // Wait for auth state to load
		if (!isLoading) {
			console.log("Admin user detected:", user);
			if (user && user.user.role === "admin") {
				setAdmin({
					name: user.user.name || "Admin User",
					email: user.user.email || "contact@aakashdhakal.com.np",
					avatar: user.user.avatar || "/admin-avatar.png",
				});
			}
		}
	}, [user]);

	// Function to check if a menu item is active
	const isActiveItem = (itemUrl) => {
		return pathname === itemUrl || pathname.startsWith(itemUrl + "/");
	};

	return (
		<Sidebar className="border-sidebar-border bg-sidebar">
			<SidebarHeader className="h-16 border-b border-sidebar-border">
				<div className="flex items-center justify-center">
					<div className="flex items-center justify-center space-x-3">
						<Image
							src="/3.png"
							alt="StreamFlow"
							width={130}
							height={40}
							className="object-cover w-36"
							priority
						/>
					</div>
				</div>
			</SidebarHeader>

			<SidebarContent className="flex flex-col">
				{/* Main Navigation */}
				<SidebarGroup className="flex-1 px-3 py-4">
					<SidebarGroupContent>
						<SidebarMenu className="space-y-1">
							{navigationItems.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton
										asChild
										isActive={isActiveItem(item.url)}
										size="lg"
										className="w-full justify-start h-11 px-3 rounded-lg transition-all duration-200 hover:bg-sidebar-accent data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-sm font-medium">
										<Link href={item.url}>
											<Icon icon={item.icon} className="h-5 w-5 shrink-0" />
											<span className="ml-3">{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>

				<div className="px-3">
					<Separator className="bg-sidebar-border" />
				</div>

				{/* Settings Section */}
				<SidebarGroup className="px-3 py-4">
					<SidebarGroupContent>
						<SidebarMenu className="space-y-1">
							{settingsItems.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton
										asChild
										isActive={isActiveItem(item.url)}
										size="lg"
										className="w-full justify-start h-11 px-3 rounded-lg transition-all duration-200 hover:bg-sidebar-accent data-[active=true]:bg-primary data-[active=true]:text-primary-foreground font-medium text-sidebar-foreground/80 hover:text-sidebar-foreground">
										<Link href={item.url}>
											<Icon icon={item.icon} className="h-5 w-5 shrink-0" />
											<span className="ml-3">{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="border-t border-sidebar-border p-4">
				<div className="flex items-center space-x-3">
					<Avatar className="h-10 w-10 border-2 border-sidebar-border">
						<AvatarImage src="/admin-avatar.png" alt="Admin" />
						<AvatarFallback className="bg-primary text-primary-foreground font-semibold">
							AD
						</AvatarFallback>
					</Avatar>
					<div className="flex-1 min-w-0">
						<p className="font-medium text-sm text-sidebar-foreground truncate">
							{admin.name}
						</p>
						<p className="text-xs text-sidebar-foreground/60 truncate">
							{admin.email}
						</p>
					</div>
					<Button
						variant="ghost"
						size="sm"
						className="h-8 w-8 p-0 hover:bg-sidebar-accent rounded-md">
						<Icon
							icon="solar:logout-2-bold-duotone"
							className="h-4 w-4 text-sidebar-foreground/60 hover:text-sidebar-foreground"
						/>
					</Button>
				</div>
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}
