"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import axios from "@/lib/axios";

export default function AdminNotification() {
	const [title, setTitle] = useState("");
	const [message, setMessage] = useState("");
	const [sendTo, setSendTo] = useState("all"); // all, specific, role
	const [targetRole, setTargetRole] = useState("user"); // user, admin
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

	// Fetch users from your existing API
	useEffect(() => {
		fetchUsers();
	}, []);

	const fetchUsers = async () => {
		try {
			setLoadingUsers(true);
			const response = await axios.get("/users");
			setUsers(response.data.users || []);
		} catch (error) {
			console.error("Error fetching users:", error);
			toast.error("Failed to fetch users");
		} finally {
			setLoadingUsers(false);
		}
	};

	// Filter users based on search
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

	// Get recipient count based on send option
	const getRecipientCount = () => {
		if (sendTo === "all") return users.length;
		if (sendTo === "specific") return selectedUsers.length;
		if (sendTo === "role") {
			return users.filter((user) => user.role === targetRole).length;
		}
		return 0;
	};

	// Get recipient description
	const getRecipientText = () => {
		const count = getRecipientCount();
		if (sendTo === "all") return `All users (${count})`;
		if (sendTo === "specific") return `Selected users (${count})`;
		if (sendTo === "role") return `All ${targetRole}s (${count})`;
		return "";
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

			// Add conditional fields based on send_to value
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

	return (
		<div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
			{/* Header */}
			<div className="flex items-center gap-3 mb-6">
				<div className="p-2 bg-primary/10 rounded-lg">
					<Icon
						icon="solar:bell-bold-duotone"
						className="h-6 w-6 text-primary"
					/>
				</div>
				<div>
					<h1 className="text-2xl font-bold">Send Notifications</h1>
					<p className="text-muted-foreground">
						Send custom notifications to your users
					</p>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Notification Form */}
				<div className="lg:col-span-2">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Icon icon="solar:document-text-bold" className="h-5 w-5" />
								Compose Notification
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Quick Templates */}
							<div>
								<label className="block text-sm font-medium mb-2">
									Quick Templates
								</label>
								<div className="grid grid-cols-1 gap-2">
									{templates.map((template, index) => (
										<Button
											key={index}
											variant="outline"
											size="sm"
											onClick={() => handleTemplateSelect(template)}
											className="text-left h-auto p-3 justify-start">
											<div>
												<div className="font-medium text-sm">
													{template.title}
												</div>
												<div className="text-xs text-muted-foreground truncate">
													{template.message.slice(0, 60)}...
												</div>
											</div>
										</Button>
									))}
								</div>
							</div>

							{/* Title */}
							<div>
								<label className="block text-sm font-medium mb-1">
									Title <span className="text-red-500">*</span>
								</label>
								<Input
									placeholder="Notification title"
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									disabled={loading}
									required
								/>
							</div>

							{/* Message */}
							<div>
								<label className="block text-sm font-medium mb-1">
									Message <span className="text-red-500">*</span>
								</label>
								<Textarea
									placeholder="Your notification message..."
									value={message}
									onChange={(e) => setMessage(e.target.value)}
									rows={4}
									disabled={loading}
									required
								/>
							</div>

							{/* Send To Options */}
							<div>
								<label className="block text-sm font-medium mb-2">
									Send To
								</label>
								<div className="grid grid-cols-3 gap-2">
									<Button
										variant={sendTo === "all" ? "default" : "outline"}
										onClick={() => setSendTo("all")}
										className="justify-start">
										<Icon
											icon="solar:users-group-rounded-bold"
											className="h-4 w-4 mr-2"
										/>
										All Users
									</Button>
									<Button
										variant={sendTo === "role" ? "default" : "outline"}
										onClick={() => setSendTo("role")}
										className="justify-start">
										<Icon
											icon="solar:shield-user-bold"
											className="h-4 w-4 mr-2"
										/>
										By Role
									</Button>
									<Button
										variant={sendTo === "specific" ? "default" : "outline"}
										onClick={() => setSendTo("specific")}
										className="justify-start">
										<Icon
											icon="solar:user-check-bold"
											className="h-4 w-4 mr-2"
										/>
										Select Users
									</Button>
								</div>
							</div>

							{/* Role Selection */}
							{sendTo === "role" && (
								<div>
									<label className="block text-sm font-medium mb-1">
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
													Regular Users (
													{users.filter((u) => u.role === "user").length})
												</div>
											</SelectItem>
											<SelectItem value="admin">
												<div className="flex items-center gap-2">
													<Icon
														icon="solar:shield-user-bold"
														className="h-4 w-4"
													/>
													Administrators (
													{users.filter((u) => u.role === "admin").length})
												</div>
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}

							{/* User Selection */}
							{sendTo === "specific" && (
								<div className="space-y-3">
									<div className="flex items-center justify-between">
										<label className="text-sm font-medium">Select Users</label>
										<Badge variant="outline">
											{selectedUsers.length} selected
										</Badge>
									</div>

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

									{/* Select All */}
									<div className="flex items-center space-x-2">
										<Checkbox
											id="select-all"
											checked={
												selectedUsers.length === filteredUsers.length &&
												filteredUsers.length > 0
											}
											onCheckedChange={handleSelectAll}
										/>
										<label htmlFor="select-all" className="text-sm">
											Select all ({filteredUsers.length})
										</label>
									</div>

									{/* User List */}
									<div className="border rounded-lg max-h-60 overflow-auto">
										{loadingUsers ? (
											<div className="p-4 text-center text-sm text-muted-foreground">
												Loading users...
											</div>
										) : filteredUsers.length > 0 ? (
											<div className="p-2 space-y-1">
												{filteredUsers.map((user) => (
													<div
														key={user.id}
														className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded">
														<Checkbox
															checked={selectedUsers.includes(user.id)}
															onCheckedChange={() => handleUserSelect(user.id)}
														/>
														<div className="flex-1 min-w-0">
															<div className="text-sm font-medium truncate">
																{user.name}
															</div>
															<div className="text-xs text-muted-foreground truncate">
																{user.email}
															</div>
														</div>
														<Badge
															variant={
																user.role === "admin" ? "default" : "secondary"
															}
															className="text-xs">
															{user.role}
														</Badge>
													</div>
												))}
											</div>
										) : (
											<div className="p-4 text-center text-sm text-muted-foreground">
												No users found
											</div>
										)}
									</div>
								</div>
							)}

							{/* Recipient Summary */}
							<div className="bg-muted/50 p-3 rounded-lg">
								<div className="flex items-center justify-between">
									<span className="text-sm font-medium">Recipients:</span>
									<Badge variant="outline">{getRecipientText()}</Badge>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Preview and Actions */}
				<div className="space-y-6">
					{/* Preview */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Icon icon="solar:eye-bold" className="h-5 w-5" />
								Preview
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="border rounded-lg p-4 bg-muted/30">
								<div className="flex items-start gap-3">
									<div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
										<Icon
											icon="solar:bell-bold"
											className="h-4 w-4 text-primary-foreground"
										/>
									</div>
									<div className="flex-1 min-w-0">
										<p className="font-semibold text-sm">
											{title || "Notification Title"}
										</p>
										<p className="text-sm text-muted-foreground mt-1">
											{message ||
												"Your notification message will appear here..."}
										</p>
										<p className="text-xs text-muted-foreground mt-2">
											Just now
										</p>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Send Button */}
					<Card>
						<CardContent className="pt-6">
							<Button
								onClick={handleSend}
								isLoading={loading}
								className="w-full"
								disabled={
									!title.trim() ||
									!message.trim() ||
									(sendTo === "specific" && selectedUsers.length === 0)
								}>
								<Icon
									icon="solar:send-square-bold-duotone"
									className="h-4 w-4 mr-2"
								/>
								Send Notification
							</Button>

							<div className="text-xs text-muted-foreground text-center mt-2">
								Will be sent to {getRecipientCount()}{" "}
								{getRecipientCount() === 1 ? "user" : "users"}
							</div>
						</CardContent>
					</Card>

					{/* Statistics */}
					<Card>
						<CardHeader>
							<CardTitle className="text-sm">Quick Stats</CardTitle>
						</CardHeader>
						<CardContent className="space-y-2">
							<div className="flex justify-between text-sm">
								<span>Total Users:</span>
								<span className="font-medium">{users.length}</span>
							</div>
							<div className="flex justify-between text-sm">
								<span>Admins:</span>
								<span className="font-medium">
									{users.filter((u) => u.role === "admin").length}
								</span>
							</div>
							<div className="flex justify-between text-sm">
								<span>Regular Users:</span>
								<span className="font-medium">
									{users.filter((u) => u.role === "user").length}
								</span>
							</div>
							<div className="flex justify-between text-sm">
								<span>Verified:</span>
								<span className="font-medium">
									{users.filter((u) => u.is_email_verified).length}
								</span>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
