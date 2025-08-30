"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import axios from "@/lib/axios";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	ChartLegend,
	ChartLegendContent,
} from "@/components/ui/chart";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	ResponsiveContainer,
	LineChart,
	Line,
	PieChart,
	Pie,
	Cell,
	AreaChart,
	Area,
} from "recharts";

const chartConfig = {
	users: {
		label: "Users",
		color: "hsl(var(--chart-1))",
	},
	videos: {
		label: "Videos",
		color: "hsl(var(--chart-2))",
	},
	watchTime: {
		label: "Watch Time",
		color: "hsl(var(--chart-3))",
	},
	revenue: {
		label: "Revenue",
		color: "hsl(var(--chart-4))",
	},
};

export default function AdminDashboard() {
	const [loading, setLoading] = useState(true);
	const [dashboardData, setDashboardData] = useState({
		overview: {},
		userGrowth: [],
		videoStats: [],
		genreDistribution: [],
		watchTimeAnalytics: [],
		recentActivity: [],
		topVideos: [],
		systemHealth: {},
	});

	// Fetch dashboard data
	useEffect(() => {
		fetchDashboardData();
	}, []);

	const fetchDashboardData = async () => {
		try {
			setLoading(true);
			const response = await axios.get("/video/dashboard");
			setDashboardData(response.data);
		} catch (error) {
			console.error("Error fetching dashboard data:", error);
			toast.error("Failed to load dashboard data");
		} finally {
			setLoading(false);
		}
	};

	if (loading) {
		return <DashboardSkeleton />;
	}

	const {
		overview,
		userGrowth,
		videoStats,
		genreDistribution,
		watchTimeAnalytics,
		recentActivity,
		topVideos,
		systemHealth,
	} = dashboardData;

	return (
		<div className="space-y-6 p-6">
			{/* Page Header */}
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
					<p className="text-muted-foreground">
						Welcome back! Here's what's happening with your platform.
					</p>
				</div>
				<div className="flex gap-2">
					<button
						onClick={fetchDashboardData}
						className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
						<Icon icon="solar:refresh-bold" className="h-4 w-4" />
						Refresh
					</button>
				</div>
			</div>

			{/* Overview Stats */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Users</CardTitle>
						<Icon icon="fa:users" className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{overview.totalUsers || 0}</div>
						<p className="text-xs text-muted-foreground">
							<span
								className={`${
									overview.userGrowth >= 0 ? "text-green-600" : "text-red-600"
								}`}>
								{overview.userGrowth >= 0 ? "+" : ""}
								{overview.userGrowth}%
							</span>{" "}
							from last month
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Videos</CardTitle>
						<Icon
							icon="majesticons:video"
							className="h-4 w-4 text-muted-foreground"
						/>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{overview.totalVideos || 0}
						</div>
						<p className="text-xs text-muted-foreground">
							{overview.readyVideos || 0} ready •{" "}
							{overview.processingVideos || 0} processing
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Watch Time
						</CardTitle>
						<Icon
							icon="weui:time-filled"
							className="h-4 w-4 text-muted-foreground"
						/>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{formatDuration(overview.totalWatchTime || 0)}
						</div>
						<p className="text-xs text-muted-foreground">
							Avg: {formatDuration(overview.avgWatchTime || 0)} per user
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Active Today</CardTitle>
						<Icon
							icon="solar:users-group-rounded-bold"
							className="h-4 w-4 text-muted-foreground"
						/>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{overview.activeToday || 0}
						</div>
						<p className="text-xs text-muted-foreground">
							{((overview.activeToday / overview.totalUsers) * 100).toFixed(1)}%
							of total users
						</p>
					</CardContent>
				</Card>
			</div>

			{/* Charts Row 1 */}
			<div className="grid gap-4 md:grid-cols-2">
				{/* User Growth Chart */}
				<Card>
					<CardHeader>
						<CardTitle>User Growth (Last 6 Months)</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer config={chartConfig} className="h-[300px]">
							<LineChart data={userGrowth}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="month" />
								<YAxis />
								<ChartTooltip content={<ChartTooltipContent />} />
								<Line
									type="monotone"
									dataKey="users"
									stroke="var(--primary)"
									strokeWidth={2}
									dot={{ r: 4 }}
								/>
							</LineChart>
						</ChartContainer>
					</CardContent>
				</Card>

				{/* Video Upload Trends */}
				<Card>
					<CardHeader>
						<CardTitle>Video Uploads (Last 6 Months)</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer config={chartConfig} className="h-[300px]">
							<BarChart data={videoStats}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="month" />
								<YAxis />
								<ChartTooltip content={<ChartTooltipContent />} />
								<Bar
									dataKey="uploads"
									fill="var(--primary)"
									radius={[4, 4, 0, 0]}
								/>
							</BarChart>
						</ChartContainer>
					</CardContent>
				</Card>
			</div>

			{/* Charts Row 2 */}
			<div className="grid gap-4 md:grid-cols-2">
				{/* Genre Distribution */}
				<Card>
					<CardHeader>
						<CardTitle>Content by Genre</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer config={chartConfig} className="h-[300px]">
							<PieChart>
								<Pie
									data={genreDistribution}
									cx="50%"
									cy="50%"
									labelLine={false}
									label={({ name, percent }) =>
										`${name} ${(percent * 100).toFixed(0)}%`
									}
									outerRadius={80}
									fill="#8884d8"
									dataKey="count">
									{genreDistribution.map((entry, index) => (
										<Cell key={`cell-${index}`} fill={entry.color} />
									))}
								</Pie>
								<ChartTooltip />
							</PieChart>
						</ChartContainer>
					</CardContent>
				</Card>

				{/* Watch Time Analytics */}
				<Card>
					<CardHeader>
						<CardTitle>Daily Watch Time (Last 7 Days)</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer config={chartConfig} className="h-[300px]">
							<AreaChart data={watchTimeAnalytics}>
								<CartesianGrid strokeDasharray="3 3" />
								<XAxis dataKey="date" />
								<YAxis />
								<ChartTooltip content={<ChartTooltipContent />} />
								<Area
									type="monotone"
									dataKey="hours"
									stroke="var(--primary)"
									fill="var(--chart-3)"
									fillOpacity={0.3}
								/>
							</AreaChart>
						</ChartContainer>
					</CardContent>
				</Card>
			</div>

			{/* Bottom Row */}
			<div className="grid gap-4 md:grid-cols-3">
				{/* Top Videos */}
				<Card>
					<CardHeader>
						<CardTitle>Top Performing Videos</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{topVideos.map((video, index) => (
								<div key={video.id} className="flex items-center space-x-3">
									<div className="text-sm font-medium text-muted-foreground w-8">
										#{index + 1}
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium truncate">
											{video.title}
										</p>
										<p className="text-xs text-muted-foreground">
											{video.views} views •{" "}
											{formatDuration(video.totalWatchTime)}
										</p>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* Recent Activity */}
				<Card>
					<CardHeader>
						<CardTitle>Recent Activity</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{recentActivity.map((activity, index) => (
								<div key={index} className="flex items-start space-x-3">
									<Icon
										icon={getActivityIcon(activity.type)}
										className="h-4 w-4 mt-1 text-muted-foreground"
									/>
									<div className="flex-1 min-w-0">
										<p className="text-sm">{activity.description}</p>
										<p className="text-xs text-muted-foreground">
											{new Date(activity.timestamp).toLocaleString()}
										</p>
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				{/* System Health */}
				<Card>
					<CardHeader>
						<CardTitle>System Health</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<span className="text-sm">Storage Used</span>
								<span className="text-sm font-medium">
									{systemHealth.storageUsed}GB / {systemHealth.storageTotal}GB
								</span>
							</div>
							<div className="w-full bg-gray-200 rounded-full h-2">
								<div
									className="bg-blue-600 h-2 rounded-full max-w-full"
									style={{
										width: `${
											(systemHealth.storageUsed / systemHealth.storageTotal) *
											100
										}%`,
									}}></div>
							</div>

							<div className="flex items-center justify-between">
								<span className="text-sm">Queue Jobs</span>
								<span className="text-sm font-medium">
									{systemHealth.queueJobs}
								</span>
							</div>

							<div className="flex items-center justify-between">
								<span className="text-sm">Failed Jobs</span>
								<span className="text-sm font-medium text-red-600">
									{systemHealth.failedJobs}
								</span>
							</div>

							<div className="flex items-center justify-between">
								<span className="text-sm">Server Status</span>
								<div className="flex items-center gap-2">
									<div
										className={`w-2 h-2 rounded-full ${
											systemHealth.serverStatus === "healthy"
												? "bg-green-500"
												: "bg-red-500"
										}`}></div>
									<span className="text-sm font-medium capitalize">
										{systemHealth.serverStatus}
									</span>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

// Helper functions
const formatDuration = (seconds) => {
	if (!seconds) return "0m";
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	if (hours > 0) {
		return `${hours}h ${minutes}m`;
	}
	return `${minutes}m`;
};

const getActivityIcon = (type) => {
	const icons = {
		user_registered: "solar:user-plus-bold",
		video_uploaded: "solar:video-frame-play-vertical-bold",
		video_processed: "solar:check-circle-bold",
		video_failed: "solar:close-circle-bold",
		user_login: "solar:login-3-bold",
	};
	return icons[type] || "solar:info-circle-bold";
};

// Loading skeleton
function DashboardSkeleton() {
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
							<Skeleton className="h-8 w-16 mb-2" />
							<Skeleton className="h-3 w-32" />
						</CardContent>
					</Card>
				))}
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={i}>
						<CardHeader>
							<Skeleton className="h-6 w-48" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-[300px] w-full" />
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
