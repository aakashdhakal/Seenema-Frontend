"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import axios from "@/lib/axios";
import UserAvatar from "@/components/singleComponents/UserAvatar";
import CustomDropdown from "@/components/singleComponents/CustomDropdown";
import { StatusBadge } from "@/components/singleComponents/StatusBadge";
import CustomAlertDialog from "@/components/singleComponents/CustomAlertDialog";
import { useAuthContext } from "@/context/AuthContext";

export default function AdminUsers() {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [roleFilter, setRoleFilter] = useState("all");
	const [sortBy, setSortBy] = useState("newest");
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [userToDelete, setUserToDelete] = useState(null);
	const currentUser = useAuthContext().user;

	// Fetch users from API
	useEffect(() => {
		fetchUsers();
	}, []);

	const fetchUsers = async () => {
		try {
			setLoading(true);
			const response = await axios.get("/users");
			setUsers(response.data || []);
		} catch (error) {
			console.error("Error fetching users:", error);
			toast.error("Failed to fetch users", {
				description: "Please try again later",
			});
		} finally {
			setLoading(false);
		}
	};

	// Filter and sort users
	const filteredUsers = users
		.filter((user) => {
			const matchesSearch =
				user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				user.email.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesRole = roleFilter === "all" || user.role === roleFilter;
			return matchesSearch && matchesRole;
		})
		.sort((a, b) => {
			switch (sortBy) {
				case "newest":
					return new Date(b.created_at) - new Date(a.created_at);
				case "oldest":
					return new Date(a.created_at) - new Date(b.created_at);
				case "name":
					return a.name.localeCompare(b.name);
				default:
					return 0;
			}
		});

	// Format date
	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	// User stats for display - Updated with correct stats
	const userStats = {
		total: users.length,
		admins: users.filter((user) => user.role === "admin").length,
		active: users.filter((user) => user.status === "active" || !user.status)
			.length, // Default to active if no status
		suspended: users.filter((user) => user.status === "suspended").length,
	};

	// Handle user actions
	const handleDeleteUser = async (userId) => {
		try {
			await axios.delete(`/users/${userId}`);
			setUsers(users.filter((user) => user.id !== userId));
			toast.success("User deleted successfully");
		} catch (error) {
			toast.error("Failed to delete user");
		}
	};

	const handleSendVerification = async (userId) => {
		try {
			await axios.post(`/users/${userId}/send-verification`);
			toast.success("Verification email sent");
		} catch (error) {
			toast.error("Failed to send verification email");
		}
	};

	const handleUserStatusChange = async (userId, currentStatus) => {
		const newStatus = currentStatus === "suspended" ? "active" : "suspended";
		try {
			await axios.patch(`/user/status/change`, {
				user_id: userId,
				status: newStatus,
			});
			// Update local state
			setUsers(
				users.map((user) =>
					user.id === userId ? { ...user, status: newStatus } : user,
				),
			);
			toast.success(
				newStatus === "suspended"
					? "User suspended successfully"
					: "User activated successfully",
			);
		} catch (error) {
			toast.error(
				newStatus === "suspended"
					? "Failed to suspend user"
					: "Failed to activate user",
			);
		}
	};

	const handleUserRoleChange = async (userId, newRole) => {
		try {
			await axios.patch(`/user/role/change`, {
				role: newRole,
				user_id: userId,
			});
			// Update local state
			setUsers(
				users.map((user) =>
					user.id === userId ? { ...user, role: newRole } : user,
				),
			);
			toast.success(`User role updated to ${newRole}`);
		} catch (error) {
			toast.error("Failed to update user role");
		}
	};

	const handleUserAction = (action, user) => {
		switch (action) {
			case "View Profile":
				// Navigate to user profile or open modal
				window.open(`/profile/${user.id}`, "_blank");
				break;
			case "Send Verification":
				handleSendVerification(user.id);
				break;
			case "Suspend User":
				handleUserStatusChange(user.id, "active");
				break;
			case "Activate User":
				handleUserStatusChange(user.id, "suspended");
				break;
			case "Promote to Admin":
				handleUserRoleChange(user.id, "admin");
				break;
			case "Demote to User":
				handleUserRoleChange(user.id, "user");
				break;
			case "Delete User":
				setUserToDelete(user);
				setDeleteDialogOpen(true);
				break;
			default:
				break;
		}
	};

	const handleDeleteConfirm = () => {
		if (userToDelete) {
			handleDeleteUser(userToDelete.id);
			setDeleteDialogOpen(false);
			setUserToDelete(null);
		}
	};

	// Dropdown options
	const roleOptions = ["all", "admin", "user"];
	const sortOptions = ["Newest First", "Oldest First", "Name A-Z"];

	const getActionOptions = (user) => {
		const options = ["View Profile"];

		// Add suspend/activate options based on current status
		if (user.status === "suspended") {
			options.push("Activate User");
		} else {
			options.push("Suspend User");
		}

		if (user.role === "admin") {
			options.push("Demote to User");
		} else {
			options.push("Promote to Admin");
		}

		options.push("Delete User");
		return options;
	};

	const handleRoleFilter = (role) => {
		setRoleFilter(role);
	};

	const handleSortChange = (sort) => {
		switch (sort) {
			case "Newest First":
				setSortBy("newest");
				break;
			case "Oldest First":
				setSortBy("oldest");
				break;
			case "Name A-Z":
				setSortBy("name");
				break;
			default:
				setSortBy("newest");
				break;
		}
	};

	if (loading) {
		return <UsersPageSkeleton />;
	}

	return (
		<div className="space-y-6 p-6">
			{/* Page Header */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">User Management</h1>
					<p className="text-muted-foreground">
						Manage user accounts and permissions
					</p>
				</div>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Users</CardTitle>
						<Icon
							icon="solar:users-group-rounded-bold-duotone"
							className="h-4 w-4 text-muted-foreground"
						/>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{userStats.total}</div>
						<p className="text-xs text-muted-foreground">
							All registered users
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Admins</CardTitle>
						<Icon
							icon="solar:shield-user-bold-duotone"
							className="h-4 w-4 text-blue-600"
						/>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{userStats.admins}</div>
						<p className="text-xs text-muted-foreground">
							Administrator accounts
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Active Users</CardTitle>
						<Icon
							icon="solar:check-circle-bold-duotone"
							className="h-4 w-4 text-green-600"
						/>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{userStats.active}</div>
						<p className="text-xs text-muted-foreground">Active accounts</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Suspended Users
						</CardTitle>
						<Icon
							icon="solar:close-circle-bold-duotone"
							className="h-4 w-4 text-red-600"
						/>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{userStats.suspended}</div>
						<p className="text-xs text-muted-foreground">Suspended accounts</p>
					</CardContent>
				</Card>
			</div>

			{/* Filters and Table */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Icon
							icon="solar:users-group-rounded-bold-duotone"
							className="h-5 w-5"
						/>
						Users ({filteredUsers.length})
					</CardTitle>
				</CardHeader>
				<CardContent>
					{/* Filters */}
					<div className="flex flex-col sm:flex-row gap-4 mb-6">
						{/* Search */}
						<div className="flex-1">
							<div className="relative">
								<Icon
									icon="solar:magnifer-bold-duotone"
									className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
								/>
								<Input
									placeholder="Search users by name or email..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10"
								/>
							</div>
						</div>

						{/* Role Filter */}
						<CustomDropdown
							options={roleOptions}
							selectedOption={roleFilter}
							onSelect={handleRoleFilter}
							placeholder={
								roleFilter === "all"
									? "All Roles"
									: roleFilter === "admin"
									? "Admins"
									: "Users"
							}
							variant="outline"
							size="default"
							icon="solar:filter-bold-duotone"
							className="w-[140px] justify-between text-foreground hover:text-foreground hover:bg-accent"
						/>

						{/* Sort Filter */}
						<CustomDropdown
							options={sortOptions}
							selectedOption={
								sortBy === "newest"
									? "Newest First"
									: sortBy === "oldest"
									? "Oldest First"
									: "Name A-Z"
							}
							onSelect={handleSortChange}
							placeholder="Sort By"
							variant="outline"
							size="default"
							icon="solar:sort-vertical-bold-duotone"
							className="w-[140px] justify-between text-foreground hover:text-foreground hover:bg-accent"
						/>

						{/* Refresh */}
						<Button variant="outline" onClick={fetchUsers}>
							<Icon icon="solar:refresh-bold-duotone" className="h-4 w-4" />
						</Button>
					</div>

					{/* Users Table */}
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>User</TableHead>
									<TableHead>Role</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Joined</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredUsers.length > 0 ? (
									filteredUsers.map((user) => (
										<TableRow key={user.id}>
											<TableCell>
												<div className="flex items-center gap-3">
													<UserAvatar
														src={user.profile_picture}
														fallback={
															user.name?.charAt(0)?.toUpperCase() || "U"
														}
														className="h-10 w-10"
													/>
													<div className="min-w-0 flex-1">
														<p className="font-medium truncate max-w-[200px]">
															{user.name}
														</p>
														<p className="text-sm text-muted-foreground truncate max-w-[200px]">
															{user.email}
														</p>
													</div>
												</div>
											</TableCell>
											<TableCell>
												<StatusBadge
													type="user"
													status={user.role}
													showIcon={true}
													size="sm"
												/>
											</TableCell>
											<TableCell>
												<StatusBadge
													type="account"
													status={user.status || "active"}
													showIcon={true}
													size="sm"
												/>
											</TableCell>
											<TableCell>
												<div className="text-sm">
													{formatDate(user.created_at)}
												</div>
											</TableCell>
											<TableCell className="text-right">
												{currentUser.id !== user.id && (
													<CustomDropdown
														options={getActionOptions(user)}
														onSelect={(action) =>
															handleUserAction(action, user)
														}
														placeholder=""
														variant="ghost"
														size="sm"
														icon="solar:menu-dots-bold"
														className="h-8 w-8 p-0 text-foreground hover:text-foreground hover:bg-accent"
													/>
												)}
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={5} className="text-center py-8">
											<div className="flex flex-col items-center gap-2">
												<Icon
													icon="solar:users-group-rounded-broken"
													className="h-8 w-8 text-muted-foreground"
												/>
												<p className="text-muted-foreground">
													{searchTerm || roleFilter !== "all"
														? "No users found matching your criteria"
														: "No users available"}
												</p>
											</div>
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>

					{/* Results Summary */}
					{filteredUsers.length > 0 && (
						<div className="flex items-center justify-between pt-4">
							<p className="text-sm text-muted-foreground">
								Showing {filteredUsers.length} of {users.length} users
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Delete Confirmation Dialog */}
			<CustomAlertDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				alertTitle="Delete User"
				alertDescription={`Are you sure you want to delete "${userToDelete?.name}"? This action cannot be undone and will permanently remove the user from your system.`}
				cancelText="Cancel"
				actionText="Delete User"
				action={handleDeleteConfirm}
			/>
		</div>
	);
}

// Loading skeleton component
function UsersPageSkeleton() {
	return (
		<div className="space-y-6 p-6">
			<div className="flex justify-between items-start">
				<div className="space-y-2">
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-4 w-96" />
				</div>
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

			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-32" />
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="flex gap-4">
							<Skeleton className="h-10 flex-1" />
							<Skeleton className="h-10 w-32" />
							<Skeleton className="h-10 w-32" />
							<Skeleton className="h-10 w-10" />
						</div>
						<div className="space-y-3">
							{Array.from({ length: 5 }).map((_, i) => (
								<div
									key={i}
									className="flex items-center gap-4 p-4 border rounded">
									<Skeleton className="h-10 w-10 rounded-full" />
									<div className="flex-1 space-y-1">
										<Skeleton className="h-4 w-48" />
										<Skeleton className="h-3 w-64" />
									</div>
									<Skeleton className="h-6 w-16" />
									<Skeleton className="h-6 w-20" />
									<Skeleton className="h-4 w-20" />
									<Skeleton className="h-8 w-8" />
								</div>
							))}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
