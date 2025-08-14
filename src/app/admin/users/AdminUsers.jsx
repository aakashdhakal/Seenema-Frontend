"use client";

import { useState, useEffect, useMemo } from "react";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
	// ===== STATE =====
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [roleFilter, setRoleFilter] = useState("all");
	const [sortBy, setSortBy] = useState("created_at");
	const [sortOrder, setSortOrder] = useState("desc");
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [userToDelete, setUserToDelete] = useState(null);

	// Pagination states (matching AdminVideos pattern)
	const [page, setPage] = useState(1);
	const itemsPerPage = 10;

	const { user: currentUser } = useAuthContext();

	// ===== DATA FETCHING =====

	/**
	 * Fetch users from API
	 */
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

	// ===== EFFECTS =====

	/**
	 * Fetch initial data
	 */
	useEffect(() => {
		fetchUsers();
	}, []);

	// ===== FILTER AND SORT LOGIC (matching AdminVideos pattern) =====
	const filteredUsers = users
		.filter((user) => {
			const matchesSearch =
				user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				user.email.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesRole = roleFilter === "all" || user.role === roleFilter;
			return matchesSearch && matchesRole;
		})
		.sort((a, b) => {
			let aValue = a[sortBy];
			let bValue = b[sortBy];

			if (sortBy === "created_at") {
				aValue = new Date(aValue);
				bValue = new Date(bValue);
			}

			if (sortOrder === "asc") {
				return aValue > bValue ? 1 : -1;
			} else {
				return aValue < bValue ? 1 : -1;
			}
		});

	// ===== PAGINATION CALCULATION (matching AdminVideos pattern) =====
	const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
	const paginatedUsers = filteredUsers.slice(
		(page - 1) * itemsPerPage,
		page * itemsPerPage,
	);
	const startItem =
		filteredUsers.length > 0 ? (page - 1) * itemsPerPage + 1 : 0;
	const endItem = Math.min(page * itemsPerPage, filteredUsers.length);

	// Reset to first page when filters change
	useEffect(() => {
		setPage(1);
	}, [searchTerm, roleFilter, sortBy, sortOrder]);

	// ===== UTILITY FUNCTIONS =====

	/**
	 * Format date to readable format
	 */
	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	// ===== EVENT HANDLERS =====

	/**
	 * Get action options for a user
	 */
	const getActionOptions = (user) => {
		const options = ["View Profile"];

		// Add suspend/activate options based on current status
		if (user.status === "suspended") {
			options.push("Activate User");
		} else {
			options.push("Suspend User");
		}

		// Add role change options
		if (user.role === "admin") {
			options.push("Demote to User");
		} else {
			options.push("Promote to Admin");
		}

		options.push("Delete User");
		return options;
	};

	/**
	 * Handle user actions (view, suspend, promote, delete, etc.)
	 */
	const handleUserAction = (action, user) => {
		switch (action) {
			case "View Profile":
				window.open(`/profile/${user.id}`, "_blank");
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
		}
	};

	/**
	 * Handle user status change (suspend/activate)
	 */
	const handleUserStatusChange = async (userId, currentStatus) => {
		const newStatus = currentStatus === "suspended" ? "active" : "suspended";
		try {
			await axios.patch(`/user/status/change`, {
				user_id: userId,
				status: newStatus,
			});

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

	/**
	 * Handle user role change (promote/demote)
	 */
	const handleUserRoleChange = async (userId, newRole) => {
		try {
			await axios.patch(`/user/role/change`, {
				role: newRole,
				user_id: userId,
			});

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

	/**
	 * Handle user deletion
	 */
	const handleDeleteUser = async (userId) => {
		try {
			await axios.delete(`/users/${userId}`);
			setUsers(users.filter((user) => user.id !== userId));
			toast.success("User deleted successfully");
		} catch (error) {
			toast.error("Failed to delete user");
		}
	};

	/**
	 * Handle delete confirmation
	 */
	const handleDeleteConfirm = () => {
		if (userToDelete) {
			handleDeleteUser(userToDelete.id);
			setDeleteDialogOpen(false);
			setUserToDelete(null);
		}
	};

	// ===== DROPDOWN HANDLERS (matching AdminVideos pattern) =====
	const roleOptions = ["all", "admin", "user"];
	const sortOptions = ["Newest First", "Oldest First", "Name A-Z", "Name Z-A"];

	const handleRoleFilter = (role) => {
		setRoleFilter(role);
	};

	const handleSortChange = (sort) => {
		switch (sort) {
			case "Newest First":
				setSortBy("created_at");
				setSortOrder("desc");
				break;
			case "Oldest First":
				setSortBy("created_at");
				setSortOrder("asc");
				break;
			case "Name A-Z":
				setSortBy("name");
				setSortOrder("asc");
				break;
			case "Name Z-A":
				setSortBy("name");
				setSortOrder("desc");
				break;
			default:
				break;
		}
	};

	// ===== COMPUTED VALUES =====

	/**
	 * Calculate user statistics
	 */
	const userStats = useMemo(
		() => ({
			total: users.length,
			admins: users.filter((user) => user.role === "admin").length,
			active: users.filter((user) => user.status === "active" || !user.status)
				.length,
			suspended: users.filter((user) => user.status === "suspended").length,
		}),
		[users],
	);

	/**
	 * Clear all filters
	 */
	const clearFilters = () => {
		setSearchTerm("");
		setRoleFilter("all");
	};

	// ===== LOADING STATE =====
	if (loading) {
		return <UsersPageSkeleton />;
	}

	// ===== MAIN RENDER =====
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
				{[
					{
						label: "Total Users",
						value: userStats.total,
						icon: "fa:users",
						subtitle: "All registered users",
					},
					{
						label: "Total Admins",
						value: userStats.admins,
						icon: "eos-icons:admin",
						subtitle: "Administrator accounts",
					},
					{
						label: "Active Users",
						value: userStats.active,
						icon: "icon-park-solid:check-one",
						subtitle: "Active accounts",
					},
					{
						label: "Suspended Users",
						value: userStats.suspended,
						icon: "solar:user-block-bold",
						subtitle: "Suspended accounts",
					},
				].map((stat, index) => (
					<Card key={index}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								{stat.label}
							</CardTitle>
							<Icon icon={stat.icon} className="h-6 w-6" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stat.value}</div>
							<p className="text-xs text-muted-foreground">{stat.subtitle}</p>
						</CardContent>
					</Card>
				))}
			</div>

			{/* Filters and Search (matching AdminVideos layout) */}
			<div className="flex flex-col sm:flex-row gap-3">
				<div className="relative flex-grow">
					<Icon
						icon="ri:search-line"
						className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						placeholder="Search users by name or email..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10"
					/>
				</div>
				<div className="flex gap-3">
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
						icon="iconoir:filter-solid"
						className="w-[140px] justify-between text-foreground hover:text-foreground hover:bg-accent"
					/>

					<CustomDropdown
						options={sortOptions}
						selectedOption={
							sortBy === "created_at"
								? sortOrder === "desc"
									? "Newest First"
									: "Oldest First"
								: sortBy === "name"
								? sortOrder === "asc"
									? "Name A-Z"
									: "Name Z-A"
								: "Sort"
						}
						onSelect={handleSortChange}
						placeholder="Sort"
						variant="outline"
						size="default"
						icon="mi:sort"
						className="w-[150px] justify-between text-foreground hover:text-foreground hover:bg-accent"
					/>

					<Button variant="outline" onClick={fetchUsers}>
						<Icon icon="eva:refresh-fill" className="h-4 w-4" />
					</Button>
				</div>
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
						{filteredUsers.length === 0 ? (
							// Empty state
							<TableRow>
								<TableCell colSpan={5} className="text-center py-12">
									<div className="flex flex-col items-center gap-3">
										<Icon
											icon="solar:users-group-rounded-broken"
											className="h-12 w-12 text-gray-300"
										/>
										<h3 className="text-lg font-medium text-gray-900">
											No users found
										</h3>
										<p className="text-gray-500 max-w-md mx-auto">
											{searchTerm || roleFilter !== "all"
												? "Try adjusting your search or filters to find what you're looking for."
												: "No users available in the system."}
										</p>
										{(searchTerm || roleFilter !== "all") && (
											<Button
												variant="outline"
												onClick={clearFilters}
												className="mt-2">
												Clear Filters
											</Button>
										)}
									</div>
								</TableCell>
							</TableRow>
						) : (
							// User list
							paginatedUsers.map((user) => (
								<TableRow key={user.id}>
									<TableCell>
										<div className="flex items-center gap-3">
											<UserAvatar
												src={user.profile_picture}
												fallback={user.name?.charAt(0)?.toUpperCase() || "U"}
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
										<div className="text-sm">{formatDate(user.created_at)}</div>
									</TableCell>
									<TableCell className="text-right">
										{currentUser.id !== user.id && (
											<CustomDropdown
												options={getActionOptions(user)}
												onSelect={(action) => handleUserAction(action, user)}
												placeholder=""
												variant="ghost"
												size="sm"
												icon="solar:menu-dots-bold"
												className="h-8 w-8  text-foreground hover:text-foreground hover:bg-accent"
											/>
										)}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination (matching AdminVideos pattern) */}
			{!loading && filteredUsers.length > 0 && (
				<div className="flex justify-between items-center py-4">
					<div className="text-sm text-muted-foreground">
						Showing {startItem} to {endItem} of {filteredUsers.length} users
					</div>
					<div className="flex gap-1">
						<Button
							variant="outline"
							size="sm"
							onClick={() => setPage(Math.max(1, page - 1))}
							disabled={page === 1}>
							<Icon icon="mdi:chevron-left" className="h-4 w-4" />
						</Button>
						<div className="flex items-center gap-1 px-2">
							<span className="text-sm font-medium">{page}</span>
							<span className="text-sm text-muted-foreground">
								of {totalPages || 1}
							</span>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => setPage(Math.min(totalPages, page + 1))}
							disabled={page === totalPages || totalPages === 0}>
							<Icon icon="mdi:chevron-right" className="h-4 w-4" />
						</Button>
					</div>
				</div>
			)}

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

// ===== LOADING SKELETON =====
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

			<div className="space-y-4">
				<div className="flex gap-4">
					<Skeleton className="h-10 flex-1" />
					<Skeleton className="h-10 w-32" />
					<Skeleton className="h-10 w-32" />
					<Skeleton className="h-10 w-10" />
				</div>
				<div className="rounded-md border">
					<div className="space-y-3 p-4">
						{Array.from({ length: 10 }).map((_, i) => (
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
			</div>
		</div>
	);
}
