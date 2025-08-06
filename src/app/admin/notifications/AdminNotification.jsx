"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import axios from "@/lib/axios";
import UserAvatar from "@/components/singleComponents/UserAvatar";

export default function AdminNotification() {
	const [title, setTitle] = useState("");
	const [message, setMessage] = useState("");
	const [sendTo, setSendTo] = useState("all");
	const [targetRole, setTargetRole] = useState("user");
	const [selectedUsers, setSelectedUsers] = useState([]);
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(false);
	const [loadingUsers, setLoadingUsers] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");

	// Quick templates
	const templates = [
		{
			title: "Welcome to Seenema!",
			message:
				"Thank you for joining our streaming platform. Enjoy unlimited movies and shows!",
		},
		{
			title: "New Content Available",
			message: "Check out the latest movies and shows added to your library!",
		},
		{
			title: "System Maintenance",
			message:
				"We'll be performing scheduled maintenance. The service may be temporarily unavailable.",
		},
	];

	useEffect(() => {
		fetchUsers();
	}, []);

	const fetchUsers = async () => {
		try {
			setLoadingUsers(true);
			const response = await axios.get("/users");
			setUsers(response.data || []);
		} catch (error) {
			console.error("Error fetching users:", error);
			toast.error("Failed to fetch users");
		} finally {
			setLoadingUsers(false);
		}
	};

	const filteredUsers = users.filter(
		(user) =>
			user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.email.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	const handleUserSelect = (userId) => {
		setSelectedUsers((prev) =>
			prev.includes(userId)
				? prev.filter((id) => id !== userId)
				: [...prev, userId],
		);
	};

	const handleSelectAll = () => {
		if (selectedUsers.length === filteredUsers.length) {
			setSelectedUsers([]);
		} else {
			setSelectedUsers(filteredUsers.map((user) => user.id));
		}
	};

	const handleTemplateSelect = (template) => {
		setTitle(template.title);
		setMessage(template.message);
	};

	const getRecipientCount = () => {
		if (sendTo === "all") return users.length;
		if (sendTo === "specific") return selectedUsers.length;
		if (sendTo === "role") {
			return users.filter((user) => user.role === targetRole).length;
		}
		return 0;
	};

	const handleSend = async (e) => {
		e.preventDefault();

		if (!title.trim() || !message.trim()) {
			toast.error("Title and message are required");
			return;
		}

		if (sendTo === "specific" && selectedUsers.length === 0) {
			toast.error("Please select at least one user");
			return;
		}

		setLoading(true);
		try {
			const payload = {
				title,
				message,
				send_to: sendTo,
			};

			if (sendTo === "specific") {
				payload.user_ids = selectedUsers;
			} else if (sendTo === "role") {
				payload.target_role = targetRole;
			}

			const response = await axios.post("/notifications/send", payload);
			toast.success(
				`Notification sent to ${response.data.recipients_count} users successfully`,
			);

			// Reset form
			setTitle("");
			setMessage("");
			setSelectedUsers([]);
			setSendTo("all");
			setTargetRole("user");
		} catch (err) {
			toast.error(
				err?.response?.data?.message || "Failed to send notification",
			);
		}
		setLoading(false);
	};

	// Get user stats
	const userStats = {
		total: users.length,
		admins: users.filter((user) => user.role === "admin").length,
		regularUsers: users.filter((user) => user.role === "user").length,
		verified: users.filter((user) => user.is_email_verified).length,
	};

	if (loadingUsers) {
		return <NotificationPageSkeleton />;
	}

	return (
		<div className="space-y-6 p-6">
			{/* Page Header */}
			<div>
				<h1 className="text-3xl font-bold tracking-tight">
					Send Notifications
				</h1>
				<p className="text-muted-foreground">
					Send custom notifications to your users
				</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				{/* Left Column: Form & Templates */}
				<div className="space-y-6">
					{/* Templates */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Icon
									icon="mdi:newspaper-variant"
									width="1.5em"
									height="1.5em"
								/>
								Quick Templates
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 gap-2">
								{templates.map((template, index) => (
									<Button
										key={index}
										variant="outline"
										size="sm"
										onClick={() => handleTemplateSelect(template)}
										className="text-left h-auto p-3 justify-start hover:bg-accent">
										<div className="w-full">
											<div className="font-medium text-sm">
												{template.title}
											</div>
											<div className="text-xs text-muted-foreground truncate mt-1">
												{template.message.slice(0, 80)}...
											</div>
										</div>
									</Button>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Notification Form */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Icon icon="solar:text-bold-duotone" className="h-5 w-5" />
								Notification Content
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<label className="block text-sm font-medium mb-2">
									Title <span className="text-red-500">*</span>
								</label>
								<Input
									placeholder="Enter notification title"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									disabled={loading}
									required
								/>
							</div>

							<div>
								<label className="block text-sm font-medium mb-2">
									Message <span className="text-red-500">*</span>
								</label>
								<Textarea
									placeholder="Enter your notification message..."
									value={message}
									onChange={(e) => setMessage(e.target.value)}
									rows={6}
									disabled={loading}
									required
								/>
							</div>

							{/* Send Button */}
							<Button
								onClick={handleSend}
								isLoading={loading}
								className="w-full"
								size="lg"
								disabled={
									!title.trim() ||
									!message.trim() ||
									(sendTo === "specific" && selectedUsers.length === 0)
								}>
								<Icon icon="fluent:send-32-filled" width="2em" height="2em" />
								Notify to {getRecipientCount()}{" "}
								{getRecipientCount() === 1 ? "user" : "users"}
							</Button>
						</CardContent>
					</Card>
				</div>

				{/* Right Column: Recipients Selection */}
				<div className="space-y-6">
					{/* Recipient Type Selection */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Icon
									icon="solar:users-group-rounded-bold-duotone"
									className="h-5 w-5"
								/>
								Select Recipients
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Send To Options */}
							<div className="grid grid-cols-1 gap-3">
								<Button
									variant={sendTo === "all" ? "default" : "outline"}
									onClick={() => setSendTo("all")}
									className="justify-start h-auto p-3">
									<div className="flex items-center gap-3">
										<Icon
											icon="solar:users-group-rounded-bold"
											className="h-5 w-5"
										/>
										<div className="text-left">
											<div className="font-medium">All Users</div>
											<div className="text-xs">
												Send to all {users.length} users
											</div>
										</div>
									</div>
								</Button>

								<Button
									variant={sendTo === "role" ? "default" : "outline"}
									onClick={() => setSendTo("role")}
									className="justify-start h-auto p-3">
									<div className="flex items-center gap-3">
										<Icon icon="solar:shield-user-bold" className="h-5 w-5" />
										<div className="text-left">
											<div className="font-medium">By Role</div>
											<div className="text-xs">Send to users by their role</div>
										</div>
									</div>
								</Button>

								<Button
									variant={sendTo === "specific" ? "default" : "outline"}
									onClick={() => setSendTo("specific")}
									className="justify-start h-auto p-3">
									<div className="flex items-center gap-3">
										<Icon icon="solar:user-check-bold" className="h-5 w-5" />
										<div className="text-left">
											<div className="font-medium">Select Specific Users</div>
											<div className="text-xs">
												Choose individual users ({selectedUsers.length}{" "}
												selected)
											</div>
										</div>
									</div>
								</Button>
							</div>

							{/* Role Selection */}
							{sendTo === "role" && (
								<div>
									<label className="block text-sm font-medium mb-2">
										Target Role
									</label>
									<Select value={targetRole} onValueChange={setTargetRole}>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="user">
												<div className="flex items-center gap-2">
													<Icon icon="solar:user-bold" className="h-4 w-4" />
													Regular Users ({userStats.regularUsers})
												</div>
											</SelectItem>
											<SelectItem value="admin">
												<div className="flex items-center gap-2">
													<Icon
														icon="solar:shield-user-bold"
														className="h-4 w-4"
													/>
													Administrators ({userStats.admins})
												</div>
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}
						</CardContent>
					</Card>

					{/* User Selection (only show when specific users selected) */}
					{sendTo === "specific" && (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center justify-between">
									<span className="flex items-center gap-2">
										<Icon
											icon="solar:users-group-rounded-bold-duotone"
											className="h-5 w-5"
										/>
										Choose Users
									</span>
									<Badge variant="outline">
										{selectedUsers.length} selected
									</Badge>
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								{/* Search */}
								<div className="relative">
									<Icon
										icon="solar:magnifer-bold-duotone"
										className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
									/>
									<Input
										placeholder="Search users..."
										value={searchTerm}
										onChange={(e) => setSearchTerm(e.target.value)}
										className="pl-10"
									/>
								</div>

								{/* Select All Button */}
								<Button
									variant="outline"
									onClick={handleSelectAll}
									className="w-full">
									<Icon
										icon={
											selectedUsers.length === filteredUsers.length
												? "solar:checkbox-circle-bold"
												: "solar:square-bold"
										}
										className="h-4 w-4 mr-2"
									/>
									{selectedUsers.length === filteredUsers.length
										? "Deselect All"
										: "Select All"}
									{filteredUsers.length > 0 && ` (${filteredUsers.length})`}
								</Button>

								{/* Users List */}
								<div className="rounded-md border max-h-[400px] overflow-auto">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead className="w-12">
													<Checkbox
														checked={
															selectedUsers.length === filteredUsers.length &&
															filteredUsers.length > 0
														}
														onCheckedChange={handleSelectAll}
													/>
												</TableHead>
												<TableHead>User</TableHead>
												<TableHead>Role</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{filteredUsers.length > 0 ? (
												filteredUsers.map((user) => (
													<TableRow
														key={user.id}
														className="cursor-pointer hover:bg-muted/50">
														<TableCell>
															<Checkbox
																checked={selectedUsers.includes(user.id)}
																onCheckedChange={() =>
																	handleUserSelect(user.id)
																}
															/>
														</TableCell>
														<TableCell
															onClick={() => handleUserSelect(user.id)}>
															<div className="flex items-center gap-3">
																<UserAvatar
																	src={user.profile_picture}
																	fallback={
																		user.name?.charAt(0)?.toUpperCase() || "U"
																	}
																	className="h-8 w-8"
																/>
																<div>
																	<div className="font-medium">{user.name}</div>
																	<div className="text-sm text-muted-foreground">
																		{user.email}
																	</div>
																</div>
															</div>
														</TableCell>
														<TableCell
															onClick={() => handleUserSelect(user.id)}>
															<Badge
																variant={
																	user.role === "admin"
																		? "default"
																		: "secondary"
																}>
																{user.role}
															</Badge>
														</TableCell>
													</TableRow>
												))
											) : (
												<TableRow>
													<TableCell colSpan={3} className="text-center py-8">
														<div className="flex flex-col items-center gap-2">
															<Icon
																icon="solar:users-group-rounded-broken"
																className="h-8 w-8 text-muted-foreground"
															/>
															<p className="text-muted-foreground">
																No users found
															</p>
														</div>
													</TableCell>
												</TableRow>
											)}
										</TableBody>
									</Table>
								</div>
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	);
}

// Loading skeleton component
function NotificationPageSkeleton() {
	return (
		<div className="space-y-6 p-6">
			<div className="space-y-2">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-4 w-96" />
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={i}>
						<CardHeader className="space-y-0 pb-2">
							<Skeleton className="h-4 w-24" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-12" />
							<Skeleton className="h-3 w-20 mt-1" />
						</CardContent>
					</Card>
				))}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-32" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-20 w-full" />
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-32" />
						</CardHeader>
						<CardContent className="space-y-4">
							<Skeleton className="h-10 w-full" />
							<Skeleton className="h-24 w-full" />
							<Skeleton className="h-20 w-full" />
							<Skeleton className="h-12 w-full" />
						</CardContent>
					</Card>
				</div>
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-32" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-32 w-full" />
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<Skeleton className="h-6 w-32" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-80 w-full" />
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
