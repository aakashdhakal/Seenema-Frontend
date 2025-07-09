"use client";

import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from "@/components/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function AdminUsers() {
	const [users, setUsers] = useState([]);
	const [filteredUsers, setFilteredUsers] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [roleFilter, setRoleFilter] = useState("all");
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState(null);
	const [isCreateMode, setIsCreateMode] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	// Form state
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		role: "user",
		status: "active",
		bio: "",
		avatar: null,
	});

	// Mock data - replace with actual API calls
	const mockUsers = [
		{
			id: 1,
			name: "John Doe",
			email: "john@example.com",
			role: "admin",
			status: "active",
			avatar:
				"https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
			createdAt: "2024-01-15",
			lastLogin: "2024-07-06",
			bio: "System administrator with 5+ years experience",
		},
		{
			id: 2,
			name: "Jane Smith",
			email: "jane@example.com",
			role: "moderator",
			status: "active",
			avatar:
				"https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=400",
			createdAt: "2024-02-20",
			lastLogin: "2024-07-05",
			bio: "Content moderator and community manager",
		},
		{
			id: 3,
			name: "Mike Johnson",
			email: "mike@example.com",
			role: "user",
			status: "inactive",
			avatar:
				"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
			createdAt: "2024-03-10",
			lastLogin: "2024-06-28",
			bio: "Regular user, content creator",
		},
		{
			id: 4,
			name: "Sarah Wilson",
			email: "sarah@example.com",
			role: "user",
			status: "suspended",
			avatar:
				"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400",
			createdAt: "2024-04-05",
			lastLogin: "2024-07-01",
			bio: "Video content enthusiast",
		},
	];

	useEffect(() => {
		// Simulate API call
		setUsers(mockUsers);
		setFilteredUsers(mockUsers);
	}, []);

	// Filter users based on search and filters
	useEffect(() => {
		let filtered = users.filter((user) => {
			const matchesSearch =
				user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				user.email.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesStatus =
				statusFilter === "all" || user.status === statusFilter;
			const matchesRole = roleFilter === "all" || user.role === roleFilter;
			return matchesSearch && matchesStatus && matchesRole;
		});
		setFilteredUsers(filtered);
	}, [users, searchTerm, statusFilter, roleFilter]);

	const handleCreateUser = () => {
		setIsCreateMode(true);
		setSelectedUser(null);
		setFormData({
			name: "",
			email: "",
			role: "user",
			status: "active",
			bio: "",
			avatar: null,
		});
		setIsDialogOpen(true);
	};

	const handleEditUser = (user) => {
		setIsCreateMode(false);
		setSelectedUser(user);
		setFormData({
			name: user.name,
			email: user.email,
			role: user.role,
			status: user.status,
			bio: user.bio || "",
			avatar: null,
		});
		setIsDialogOpen(true);
	};

	const handleDeleteUser = (userId) => {
		if (window.confirm("Are you sure you want to delete this user?")) {
			setUsers(users.filter((user) => user.id !== userId));
			toast.success("User deleted successfully");
		}
	};

	const handleSubmit = async () => {
		setIsLoading(true);

		// Simulate API call
		await new Promise((resolve) => setTimeout(resolve, 1000));

		if (isCreateMode) {
			const newUser = {
				id: users.length + 1,
				...formData,
				avatar: formData.avatar ? URL.createObjectURL(formData.avatar) : null,
				createdAt: new Date().toISOString().split("T")[0],
				lastLogin: "Never",
			};
			setUsers([...users, newUser]);
			toast.success("User created successfully");
		} else {
			const updatedUsers = users.map((user) =>
				user.id === selectedUser.id
					? {
							...user,
							...formData,
							avatar: formData.avatar
								? URL.createObjectURL(formData.avatar)
								: user.avatar,
					  }
					: user,
			);
			setUsers(updatedUsers);
			toast.success("User updated successfully");
		}

		setIsLoading(false);
		setIsDialogOpen(false);
	};

	const handleStatusChange = (userId, newStatus) => {
		const updatedUsers = users.map((user) =>
			user.id === userId ? { ...user, status: newStatus } : user,
		);
		setUsers(updatedUsers);
		toast.success(`User status updated to ${newStatus}`);
	};

	const getRoleColor = (role) => {
		switch (role) {
			case "admin":
				return "destructive";
			case "moderator":
				return "default";
			case "user":
				return "secondary";
			default:
				return "secondary";
		}
	};

	const getStatusColor = (status) => {
		switch (status) {
			case "active":
				return "bg-green-100 text-green-800";
			case "inactive":
				return "bg-gray-100 text-gray-800";
			case "suspended":
				return "bg-red-100 text-red-800";
			default:
				return "bg-gray-100 text-gray-800";
		}
	};

	return (
		<div className="container mx-auto px-4 py-8 max-w-7xl">
			{/* Header */}
			<div className="mb-8">
				<h1 className="text-3xl font-bold mb-2">User Management</h1>
				<p className="text-muted-foreground">
					Manage users, roles, and permissions
				</p>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<Icon
								icon="solar:users-group-rounded-bold"
								className="h-8 w-8 text-blue-600"
							/>
							<div className="ml-4">
								<p className="text-sm font-medium text-muted-foreground">
									Total Users
								</p>
								<p className="text-2xl font-bold">{users.length}</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<Icon
								icon="solar:check-circle-bold"
								className="h-8 w-8 text-green-600"
							/>
							<div className="ml-4">
								<p className="text-sm font-medium text-muted-foreground">
									Active Users
								</p>
								<p className="text-2xl font-bold">
									{users.filter((u) => u.status === "active").length}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<Icon
								icon="solar:shield-user-bold"
								className="h-8 w-8 text-purple-600"
							/>
							<div className="ml-4">
								<p className="text-sm font-medium text-muted-foreground">
									Admins
								</p>
								<p className="text-2xl font-bold">
									{users.filter((u) => u.role === "admin").length}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center">
							<Icon
								icon="solar:danger-circle-bold"
								className="h-8 w-8 text-red-600"
							/>
							<div className="ml-4">
								<p className="text-sm font-medium text-muted-foreground">
									Suspended
								</p>
								<p className="text-2xl font-bold">
									{users.filter((u) => u.status === "suspended").length}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters and Actions */}
			<Card className="mb-6">
				<CardContent className="p-6">
					<div className="flex flex-col md:flex-row gap-4 items-center justify-between">
						<div className="flex flex-col md:flex-row gap-4 flex-1">
							<div className="relative flex-1 max-w-sm">
								<Icon
									icon="solar:magnifer-linear"
									className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground"
								/>
								<Input
									placeholder="Search users..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10"
								/>
							</div>
							<Select value={statusFilter} onValueChange={setStatusFilter}>
								<SelectTrigger className="w-[160px]">
									<SelectValue placeholder="Filter by status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									<SelectItem value="active">Active</SelectItem>
									<SelectItem value="inactive">Inactive</SelectItem>
									<SelectItem value="suspended">Suspended</SelectItem>
								</SelectContent>
							</Select>
							<Select value={roleFilter} onValueChange={setRoleFilter}>
								<SelectTrigger className="w-[160px]">
									<SelectValue placeholder="Filter by role" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Roles</SelectItem>
									<SelectItem value="admin">Admin</SelectItem>
									<SelectItem value="moderator">Moderator</SelectItem>
									<SelectItem value="user">User</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<Button onClick={handleCreateUser}>
							<Icon icon="solar:add-circle-bold" className="mr-2 h-4 w-4" />
							Add User
						</Button>
					</div>
				</CardContent>
			</Card>

			{/* Users Table */}
			<Card>
				<CardHeader>
					<CardTitle>Users ({filteredUsers.length})</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>User</TableHead>
								<TableHead>Role</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Last Login</TableHead>
								<TableHead>Created</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{filteredUsers.map((user) => (
								<TableRow key={user.id}>
									<TableCell>
										<div className="flex items-center space-x-3">
											<img
												src={user.avatar || "/api/placeholder/40/40"}
												alt={user.name}
												className="h-10 w-10 rounded-full object-cover"
											/>
											<div>
												<p className="font-medium">{user.name}</p>
												<p className="text-sm text-muted-foreground">
													{user.email}
												</p>
											</div>
										</div>
									</TableCell>
									<TableCell>
										<Badge
											variant={getRoleColor(user.role)}
											className="capitalize">
											{user.role}
										</Badge>
									</TableCell>
									<TableCell>
										<Badge
											className={`capitalize ${getStatusColor(user.status)}`}
											variant="secondary">
											{user.status}
										</Badge>
									</TableCell>
									<TableCell className="text-sm text-muted-foreground">
										{user.lastLogin}
									</TableCell>
									<TableCell className="text-sm text-muted-foreground">
										{user.createdAt}
									</TableCell>
									<TableCell className="text-right">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button variant="ghost" size="sm">
													<Icon
														icon="solar:menu-dots-bold"
														className="h-4 w-4"
													/>
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onClick={() => handleEditUser(user)}>
													<Icon
														icon="solar:pen-bold"
														className="mr-2 h-4 w-4"
													/>
													Edit User
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() =>
														handleStatusChange(
															user.id,
															user.status === "active" ? "inactive" : "active",
														)
													}>
													<Icon
														icon={
															user.status === "active"
																? "solar:pause-bold"
																: "solar:play-bold"
														}
														className="mr-2 h-4 w-4"
													/>
													{user.status === "active" ? "Deactivate" : "Activate"}
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() =>
														handleStatusChange(user.id, "suspended")
													}
													className="text-orange-600">
													<Icon
														icon="solar:stop-bold"
														className="mr-2 h-4 w-4"
													/>
													Suspend
												</DropdownMenuItem>
												<DropdownMenuItem
													onClick={() => handleDeleteUser(user.id)}
													className="text-red-600">
													<Icon
														icon="solar:trash-bin-trash-bold"
														className="mr-2 h-4 w-4"
													/>
													Delete
												</DropdownMenuItem>
											</DropdownMenuContent>
										</DropdownMenu>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			{/* Create/Edit User Dialog */}
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>
							{isCreateMode ? "Create New User" : "Edit User"}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">Name *</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) =>
									setFormData({ ...formData, name: e.target.value })
								}
								placeholder="Enter user name"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="email">Email *</Label>
							<Input
								id="email"
								type="email"
								value={formData.email}
								onChange={(e) =>
									setFormData({ ...formData, email: e.target.value })
								}
								placeholder="Enter email address"
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="role">Role</Label>
								<Select
									value={formData.role}
									onValueChange={(value) =>
										setFormData({ ...formData, role: value })
									}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="user">User</SelectItem>
										<SelectItem value="moderator">Moderator</SelectItem>
										<SelectItem value="admin">Admin</SelectItem>
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label htmlFor="status">Status</Label>
								<Select
									value={formData.status}
									onValueChange={(value) =>
										setFormData({ ...formData, status: value })
									}>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="active">Active</SelectItem>
										<SelectItem value="inactive">Inactive</SelectItem>
										<SelectItem value="suspended">Suspended</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="bio">Bio</Label>
							<Textarea
								id="bio"
								value={formData.bio}
								onChange={(e) =>
									setFormData({ ...formData, bio: e.target.value })
								}
								placeholder="Enter user bio (optional)"
								rows={3}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="avatar">Avatar</Label>
							<Input
								id="avatar"
								type="file"
								accept="image/*"
								onChange={(e) =>
									setFormData({ ...formData, avatar: e.target.files[0] })
								}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsDialogOpen(false)}>
							Cancel
						</Button>
						<Button onClick={handleSubmit} disabled={isLoading}>
							{isLoading ? (
								<Icon
									icon="solar:clock-circle-bold"
									className="mr-2 h-4 w-4 animate-spin"
								/>
							) : null}
							{isCreateMode ? "Create User" : "Update User"}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
