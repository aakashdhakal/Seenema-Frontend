"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/singleComponents/StatusBadge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@iconify/react";
import UserAvatar from "@/components/singleComponents/UserAvatar";
import axiosInstance from "@/lib/axios";
import { toast } from "sonner";

export default function UsersPage() {
	const [users, setUsers] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [roleFilter, setRoleFilter] = useState("all");
	const [sortBy, setSortBy] = useState("name");
	const [sortOrder, setSortOrder] = useState("asc");

	// Fetch users data
	useEffect(() => {
		fetchUsers();
	}, []);

	const fetchUsers = async () => {
		try {
			setLoading(true);
			const response = await axiosInstance.get("/getUsers");
			setUsers(response.data.users || []);
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

	// Format date
	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	// Get user stats
	const userStats = {
		total: users.length,
		admins: users.filter((user) => user.role === "admin").length,
		users: users.filter((user) => user.role === "user").length,
		verified: users.filter((user) => user.email_verified_at).length,
		unverified: users.filter((user) => !user.email_verified_at).length,
	};

	if (loading) {
		return <UsersPageSkeleton />;
	}

	return (
		<div className="space-y-6 p-6">
			{/* Page Header */}
			<div>
				<h1 className="text-3xl font-bold tracking-tight">User Management</h1>
				<p className="text-muted-foreground">
					Manage user accounts and permissions
				</p>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Admins</CardTitle>
						<Icon
							icon="solar:shield-user-bold-duotone"
							className="h-4 w-4 text-muted-foreground"
						/>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{userStats.admins}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Regular Users</CardTitle>
						<Icon
							icon="solar:user-bold-duotone"
							className="h-4 w-4 text-muted-foreground"
						/>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{userStats.users}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Verified</CardTitle>
						<Icon
							icon="solar:check-circle-bold-duotone"
							className="h-4 w-4 text-green-600"
						/>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{userStats.verified}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Unverified</CardTitle>
						<Icon
							icon="solar:close-circle-bold-duotone"
							className="h-4 w-4 text-red-600"
						/>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{userStats.unverified}</div>
					</CardContent>
				</Card>
			</div>

			{/* Filters and Search */}
			<Card>
				<CardHeader>
					<CardTitle>Users</CardTitle>
					<CardDescription>A list of all users in your system</CardDescription>
				</CardHeader>
				<CardContent>
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
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" className="w-[150px]">
									<Icon
										icon="solar:filter-bold-duotone"
										className="mr-2 h-4 w-4"
									/>
									{roleFilter === "all"
										? "All Roles"
										: roleFilter.charAt(0).toUpperCase() + roleFilter.slice(1)}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuItem onClick={() => setRoleFilter("all")}>
									All Roles
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setRoleFilter("admin")}>
									Admin
								</DropdownMenuItem>
								<DropdownMenuItem onClick={() => setRoleFilter("user")}>
									User
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

						{/* Sort */}
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant="outline" className="w-[120px]">
									<Icon
										icon="solar:sort-vertical-bold-duotone"
										className="mr-2 h-4 w-4"
									/>
									Sort
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuLabel>Sort by</DropdownMenuLabel>
								<DropdownMenuItem
									onClick={() => {
										setSortBy("name");
										setSortOrder("asc");
									}}>
									Name (A-Z)
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => {
										setSortBy("name");
										setSortOrder("desc");
									}}>
									Name (Z-A)
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => {
										setSortBy("created_at");
										setSortOrder("desc");
									}}>
									Newest First
								</DropdownMenuItem>
								<DropdownMenuItem
									onClick={() => {
										setSortBy("created_at");
										setSortOrder("asc");
									}}>
									Oldest First
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>

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
														fallback={user.name.charAt(0).toUpperCase() || "U"}
														className="h-10 w-10"
													/>
													<div className="flex flex-col">
														<span className="font-medium">{user.name}</span>
														<span className="text-sm text-muted-foreground">
															{user.email}
														</span>
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
													type="verification"
													status={
														user.email_verified_at ? "verified" : "unverified"
													}
													showIcon={true}
													size="sm"
												/>
											</TableCell>
											<TableCell>{formatDate(user.created_at)}</TableCell>
											<TableCell className="text-right">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" className="h-8 w-8 p-0">
															<Icon
																icon="solar:menu-dots-bold"
																className="h-4 w-4"
															/>
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end">
														<DropdownMenuItem>
															<Icon
																icon="solar:eye-bold-duotone"
																className="mr-2 h-4 w-4"
															/>
															View Profile
														</DropdownMenuItem>
														<DropdownMenuItem>
															<Icon
																icon="solar:pen-bold-duotone"
																className="mr-2 h-4 w-4"
															/>
															Edit User
														</DropdownMenuItem>
														{!user.email_verified_at && (
															<DropdownMenuItem>
																<Icon
																	icon="solar:letter-bold-duotone"
																	className="mr-2 h-4 w-4"
																/>
																Send Verification
															</DropdownMenuItem>
														)}
														<DropdownMenuSeparator />
														<DropdownMenuItem className="text-red-600">
															<Icon
																icon="solar:trash-bin-trash-bold-duotone"
																className="mr-2 h-4 w-4"
															/>
															Delete User
														</DropdownMenuItem>
													</DropdownMenuContent>
												</DropdownMenu>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={5} className="text-center py-8">
											<div className="flex flex-col items-center gap-2">
												<Icon
													icon="solar:users-group-rounded-bold-duotone"
													className="h-8 w-8 text-muted-foreground"
												/>
												<p className="text-muted-foreground">No users found</p>
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
		</div>
	);
}

// Loading skeleton component
function UsersPageSkeleton() {
	return (
		<div className="space-y-6 p-6">
			<div className="space-y-2">
				<Skeleton className="h-8 w-64" />
				<Skeleton className="h-4 w-96" />
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
				{Array.from({ length: 5 }).map((_, i) => (
					<Card key={i}>
						<CardHeader className="space-y-0 pb-2">
							<Skeleton className="h-4 w-24" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-12" />
						</CardContent>
					</Card>
				))}
			</div>

			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-16" />
					<Skeleton className="h-4 w-48" />
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="flex gap-4">
							<Skeleton className="h-10 flex-1" />
							<Skeleton className="h-10 w-32" />
							<Skeleton className="h-10 w-24" />
							<Skeleton className="h-10 w-10" />
						</div>
						<div className="space-y-3">
							{Array.from({ length: 5 }).map((_, i) => (
								<div
									key={i}
									className="flex items-center gap-4 p-4 border rounded">
									<Skeleton className="h-10 w-10 rounded-full" />
									<div className="flex-1 space-y-1">
										<Skeleton className="h-4 w-32" />
										<Skeleton className="h-3 w-48" />
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
