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
import CustomDropdown from "@/components/singleComponents/CustomDropdown";
import CustomAlertDialog from "@/components/singleComponents/CustomAlertDialog";
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
import Link from "next/link";
import { useRouter } from "next/navigation";
import echo from "@/lib/echo";
import { useAuthContext } from "@/context/AuthContext";

export default function AdminVideos() {
	const [videos, setVideos] = useState([]);
	const [genres, setGenres] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [genreFilter, setGenreFilter] = useState("all");
	const [sortBy, setSortBy] = useState("created_at");
	const [sortOrder, setSortOrder] = useState("desc");
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [videoToDelete, setVideoToDelete] = useState(null);
	const [connectionStatus, setConnectionStatus] = useState("disconnected");
	const [mounted, setMounted] = useState(false);
	const { user } = useAuthContext();

	// Fetch data
	useEffect(() => {
		fetchData();
	}, []);

	// Setup Laravel Reverb notifications
	useEffect(() => {
		setMounted(true);

		// Only setup notifications if user is authenticated
		if (!user?.user?.id) return;

		console.log("Setting up Reverb notifications for user:", user.user.id);

		// Listen for connection events
		if (echo.connector?.pusher?.connection) {
			echo.connector.pusher.connection.bind("connected", () => {
				console.log("Reverb connected successfully");
				setConnectionStatus("connected");
			});

			echo.connector.pusher.connection.bind("disconnected", () => {
				console.log("Reverb disconnected");
				setConnectionStatus("disconnected");
			});

			echo.connector.pusher.connection.bind("error", (error) => {
				console.error("Reverb connection error:", error);
				setConnectionStatus("error");
			});
		}

		// Listen for admin notifications
		const adminChannel = echo
			.private("admin.notifications")
			.listen(".video.processing.status", (data) => {
				console.log("Received video processing status update:", data);
				handleVideoStatusUpdate(data);
			})
			.error((error) => {
				console.error("Admin channel error:", error);
			});

		// Cleanup function
		return () => {
			if (adminChannel) {
				adminChannel.stopListening(".video.processing.status");
			}
			echo.leaveChannel("admin.notifications");
			if (user.user.role === "admin") {
				echo.leaveChannel(`user.${user.user.id}`);
			}
		};
	}, [user?.user?.id]);

	// Handle video status updates in real-time
	const handleVideoStatusUpdate = (data) => {
		console.log("Processing video status update:", data);

		// Update the video in the videos array
		setVideos((prevVideos) => {
			return prevVideos.map((video) => {
				if (video.id === data.video_id) {
					const updatedVideo = {
						...video,
						status: data.status,
					};

					// If status is ready, update resolutions if available
					if (data.status === "ready" && data.resolutions) {
						updatedVideo.resolutions = data.resolutions;
					}

					console.log(
						`Updated video ${video.id} status from ${video.status} to ${data.status}`,
					);
					return updatedVideo;
				}
				return video;
			});
		});

		// Show toast notification based on status
		showStatusToast(data);
	};

	// Show appropriate toast based on status
	const showStatusToast = (data) => {
		const videoTitle = data.video_title || `Video ${data.video_id}`;

		switch (data.status) {
			case "ready":
				toast.success("Video Processing Complete!", {
					description: `${videoTitle} is now ready for streaming`,
					duration: 5000,
					action: {
						label: "View Video",
						onClick: () =>
							window.open(`/video/watch/${data.video_id}`, "_blank"),
					},
				});
				break;
			case "failed":
				toast.error("Video Processing Failed", {
					description: `${videoTitle} failed to process: ${data.message}`,
					duration: 7000,
				});
				break;
			case "processing":
				toast.info("Video Processing Started", {
					description: `${videoTitle} is being processed...`,
					duration: 3000,
				});
				break;
			default:
				toast.info("Video Status Updated", {
					description: `${videoTitle} status changed to ${data.status}`,
					duration: 3000,
				});
				break;
		}
	};

	const fetchData = async () => {
		try {
			setLoading(true);
			const [videosResponse, genresResponse] = await Promise.all([
				axiosInstance.get("/getAllVideos"),
				axiosInstance.get("/getGenres"),
			]);

			setVideos(videosResponse.data || []);
			setGenres(genresResponse.data || []);
		} catch (error) {
			console.error("Error fetching data:", error);
			toast.error("Failed to fetch videos", {
				description: "Please try again later",
			});
		} finally {
			setLoading(false);
		}
	};

	// Filter and sort videos
	const filteredVideos = videos
		.filter((video) => {
			const matchesSearch =
				video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
				video.description?.toLowerCase().includes(searchTerm.toLowerCase());
			const matchesStatus =
				statusFilter === "all" || video.status === statusFilter;
			const matchesGenre =
				genreFilter === "all" ||
				(video.genres &&
					video.genres.some((genre) => genre.id.toString() === genreFilter));
			return matchesSearch && matchesStatus && matchesGenre;
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

	// Utility functions
	const formatDuration = (seconds) => {
		if (!seconds) return "0m";
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
	};

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const renderGenres = (videoGenres) => {
		if (!videoGenres || videoGenres.length === 0) {
			return (
				<StatusBadge type="general" status="info" size="sm">
					No genres
				</StatusBadge>
			);
		}

		if (videoGenres.length === 1) {
			return (
				<StatusBadge type="general" status="info" size="sm">
					{videoGenres[0].name}
				</StatusBadge>
			);
		}

		return (
			<div className="flex items-center gap-1">
				<StatusBadge type="general" status="info" size="sm">
					{videoGenres[0].name}
				</StatusBadge>
				{videoGenres.length > 1 && (
					<StatusBadge type="count" status="count" size="sm">
						+{videoGenres.length - 1}
					</StatusBadge>
				)}
			</div>
		);
	};

	const renderResolutions = (resolutions) => {
		if (!resolutions || resolutions.length === 0) {
			return (
				<StatusBadge type="general" status="warning" size="sm">
					No resolutions
				</StatusBadge>
			);
		}

		const highestRes = Math.max(...resolutions.map((r) => parseInt(r)));
		return (
			<StatusBadge type="general" status="success" size="sm">
				Up to {highestRes}p
			</StatusBadge>
		);
	};

	const handleDeleteVideo = async (videoId) => {
		try {
			await axiosInstance.delete(`/deleteVideo/${videoId}`);
			setVideos((prev) => prev.filter((video) => video.id !== videoId));
			toast.success("Video deleted successfully");
		} catch (error) {
			toast.error("Failed to delete video");
		}
	};

	const handleVideoAction = (action, video) => {
		switch (action) {
			case "Watch Video":
				window.open(`/video/watch/${video.id}`, "_blank");
				break;
			case "Edit Video":
				window.location.href = `/admin/videos/${video.id}`;
				break;
			case "View Uploader":
				window.open(`/admin/users/${video.user?.id}`, "_blank");
				break;
			case "Delete Video":
				setVideoToDelete(video);
				setDeleteDialogOpen(true);
				break;
			default:
				break;
		}
	};

	const handleDeleteConfirm = () => {
		if (videoToDelete) {
			handleDeleteVideo(videoToDelete.id);
			setDeleteDialogOpen(false);
			setVideoToDelete(null);
		}
	};

	// Dropdown options
	const statusOptions = ["all", "ready", "processing", "failed", "pending"];
	const genreOptions = ["all", ...genres.map((genre) => genre.name)];
	const sortOptions = [
		"Title (A-Z)",
		"Title (Z-A)",
		"Newest First",
		"Oldest First",
		"Longest First",
		"Shortest First",
	];

	const actionOptions = [
		"Watch Video",
		"Edit Video",
		"View Uploader",
		"Delete Video",
	];

	const handleStatusFilter = (status) => {
		setStatusFilter(status);
	};

	const handleGenreFilter = (genre) => {
		if (genre === "all") {
			setGenreFilter("all");
		} else {
			const selectedGenre = genres.find((g) => g.name === genre);
			setGenreFilter(selectedGenre ? selectedGenre.id.toString() : "all");
		}
	};

	const handleSortChange = (sort) => {
		switch (sort) {
			case "Title (A-Z)":
				setSortBy("title");
				setSortOrder("asc");
				break;
			case "Title (Z-A)":
				setSortBy("title");
				setSortOrder("desc");
				break;
			case "Newest First":
				setSortBy("created_at");
				setSortOrder("desc");
				break;
			case "Oldest First":
				setSortBy("created_at");
				setSortOrder("asc");
				break;
			case "Longest First":
				setSortBy("duration");
				setSortOrder("desc");
				break;
			case "Shortest First":
				setSortBy("duration");
				setSortOrder("asc");
				break;
			default:
				break;
		}
	};

	// Get video stats (recalculated with updated data)
	const videoStats = {
		total: videos.length,
		ready: videos.filter((v) => v.status === "ready").length,
		processing: videos.filter((v) => v.status === "processing").length,
		failed: videos.filter((v) => v.status === "failed").length,
		totalDuration: videos.reduce(
			(sum, video) => sum + (video.duration || 0),
			0,
		),
	};

	if (loading) {
		return <VideosPageSkeleton />;
	}

	return (
		<div className="space-y-6 p-6">
			{/* Page Header */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Video Management
					</h1>
					<p className="text-muted-foreground">
						Manage your video library and monitor processing status
					</p>
					{/* Connection Status Indicator */}
					{process.env.NODE_ENV === "development" && (
						<div className="flex items-center gap-2 mt-2">
							<div
								className={`w-2 h-2 rounded-full ${
									connectionStatus === "connected"
										? "bg-green-500"
										: connectionStatus === "error"
										? "bg-red-500"
										: "bg-yellow-500"
								}`}
							/>
							<span className="text-xs text-muted-foreground">
								Real-time updates: {connectionStatus}
							</span>
						</div>
					)}
				</div>
				<Button asChild>
					<Link href="/admin/videos/upload">
						<Icon
							icon="solar:add-circle-bold-duotone"
							className="mr-2 h-4 w-4"
						/>
						Upload Video
					</Link>
				</Button>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Videos</CardTitle>
						<Icon
							icon="solar:videocamera-record-bold-duotone"
							className="h-4 w-4 text-muted-foreground"
						/>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{videoStats.total}</div>
						<p className="text-xs text-muted-foreground">
							{genres.length} genres available
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Ready</CardTitle>
						<Icon
							icon="solar:check-circle-bold-duotone"
							className="h-4 w-4 text-green-600"
						/>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{videoStats.ready}</div>
						<p className="text-xs text-muted-foreground">Streamable content</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Processing</CardTitle>
						<Icon
							icon="solar:refresh-bold-duotone"
							className="h-4 w-4 text-blue-600"
						/>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{videoStats.processing}</div>
						<p className="text-xs text-muted-foreground">Being processed</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Failed</CardTitle>
						<Icon
							icon="solar:close-circle-bold-duotone"
							className="h-4 w-4 text-red-600"
						/>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{videoStats.failed}</div>
						<p className="text-xs text-muted-foreground">Need attention</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">
							Total Duration
						</CardTitle>
						<Icon
							icon="solar:clock-circle-bold-duotone"
							className="h-4 w-4 text-purple-600"
						/>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">
							{formatDuration(videoStats.totalDuration)}
						</div>
						<p className="text-xs text-muted-foreground">Content time</p>
					</CardContent>
				</Card>
			</div>

			{/* Filters and Search */}
			<Card>
				<CardHeader>
					<CardTitle>Videos</CardTitle>
					<CardDescription>Manage your video library</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col sm:flex-row gap-4 mb-6">
						{/* Search */}
						<div className="flex-1 border-2 rounded-md">
							<div className="relative">
								<Icon
									icon="solar:magnifer-bold-duotone"
									className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
								/>
								<Input
									placeholder="Search videos by title or description..."
									value={searchTerm}
									onChange={(e) => setSearchTerm(e.target.value)}
									className="pl-10"
								/>
							</div>
						</div>

						{/* Status Filter */}
						<CustomDropdown
							options={statusOptions}
							selectedOption={statusFilter}
							onSelect={handleStatusFilter}
							placeholder={
								statusFilter === "all"
									? "All Status"
									: statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)
							}
							variant="outline"
							size="default"
							icon="solar:filter-bold-duotone"
							className="w-[140px] justify-between text-foreground hover:text-foreground hover:bg-accent"
						/>

						{/* Genre Filter */}
						<CustomDropdown
							options={genreOptions}
							selectedOption={
								genreFilter === "all"
									? "all"
									: genres.find((g) => g.id.toString() === genreFilter)?.name ||
									  "all"
							}
							onSelect={handleGenreFilter}
							placeholder={
								genreFilter === "all"
									? "All Genres"
									: genres.find((g) => g.id.toString() === genreFilter)?.name ||
									  "Genre"
							}
							variant="outline"
							size="default"
							icon="solar:tag-bold-duotone"
							className="w-[140px] justify-between text-foreground hover:text-foreground hover:bg-accent"
						/>

						{/* Sort */}
						<CustomDropdown
							options={sortOptions}
							selectedOption={`${
								sortBy === "title"
									? "Title"
									: sortBy === "created_at"
									? sortOrder === "desc"
										? "Newest First"
										: "Oldest First"
									: sortBy === "duration"
									? sortOrder === "desc"
										? "Longest First"
										: "Shortest First"
									: "Sort"
							}`}
							onSelect={handleSortChange}
							placeholder="Sort"
							variant="outline"
							size="default"
							icon="solar:sort-vertical-bold-duotone"
							className="w-[120px] justify-between text-foreground hover:text-foreground hover:bg-accent"
						/>

						{/* Refresh */}
						<Button variant="outline" onClick={fetchData}>
							<Icon icon="solar:refresh-bold-duotone" className="h-4 w-4" />
						</Button>
					</div>

					{/* Videos Table */}
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Video</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Genres</TableHead>
									<TableHead>Quality</TableHead>
									<TableHead>Duration</TableHead>
									<TableHead>Upload Date</TableHead>
									<TableHead>Uploader</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredVideos.length > 0 ? (
									filteredVideos.map((video) => (
										<TableRow key={video.id}>
											<TableCell>
												<div className="flex items-center gap-3">
													<div className="relative">
														<img
															src={
																video.thumbnail_path || "/placeholder-video.jpg"
															}
															alt={video.title}
															className="w-16 h-12 object-cover rounded cursor-pointer border"
															onError={(e) => {
																e.target.src = "/placeholder-video.jpg";
															}}
															onClick={() =>
																window.open(
																	`/video/watch/${video.id}`,
																	"_blank",
																)
															}
														/>
														<div className="absolute bottom-0 right-0 bg-black/75 text-white text-xs px-1 rounded-tl">
															{formatDuration(video.duration)}
														</div>
													</div>
													<div className="min-w-0 flex-1">
														<p className="font-medium truncate max-w-[200px]">
															{video.title}
														</p>
														<p className="text-sm text-muted-foreground truncate max-w-[200px]">
															{video.description || "No description"}
														</p>
													</div>
												</div>
											</TableCell>
											<TableCell>
												<StatusBadge
													type="video"
													status={video.status}
													showIcon={true}
													size="sm"
												/>
											</TableCell>
											<TableCell>{renderGenres(video.genres)}</TableCell>
											<TableCell>
												{renderResolutions(video.resolutions)}
											</TableCell>
											<TableCell>
												<div className="text-sm font-medium">
													{formatDuration(video.duration)}
												</div>
											</TableCell>
											<TableCell>
												<div className="text-sm">
													{formatDate(video.created_at)}
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<UserAvatar
														src={video.user?.profile_picture}
														fallback={
															video.user?.name?.charAt(0).toUpperCase() || "U"
														}
														className="h-8 w-8"
													/>
													<span className="text-sm truncate max-w-[100px]">
														{video.user?.name || "Unknown"}
													</span>
												</div>
											</TableCell>
											<TableCell className="text-right">
												<CustomDropdown
													options={actionOptions}
													onSelect={(action) =>
														handleVideoAction(action, video)
													}
													placeholder=""
													variant="ghost"
													size="sm"
													icon="solar:menu-dots-bold"
													className="h-8 w-8 p-0 text-foreground hover:text-foreground hover:bg-accent"
												/>
											</TableCell>
										</TableRow>
									))
								) : (
									<TableRow>
										<TableCell colSpan={8} className="text-center py-8">
											<div className="flex flex-col items-center gap-2">
												<Icon
													icon="solar:videocamera-record-bold-duotone"
													className="h-8 w-8 text-muted-foreground"
												/>
												<p className="text-muted-foreground">
													{searchTerm ||
													statusFilter !== "all" ||
													genreFilter !== "all"
														? "No videos found matching your criteria"
														: "No videos uploaded yet"}
												</p>
												{!searchTerm &&
													statusFilter === "all" &&
													genreFilter === "all" && (
														<Button asChild className="mt-2">
															<Link href="/admin/videos/upload">
																<Icon
																	icon="solar:add-circle-bold-duotone"
																	className="mr-2 h-4 w-4"
																/>
																Upload First Video
															</Link>
														</Button>
													)}
											</div>
										</TableCell>
									</TableRow>
								)}
							</TableBody>
						</Table>
					</div>

					{/* Results Summary */}
					{filteredVideos.length > 0 && (
						<div className="flex items-center justify-between pt-4">
							<p className="text-sm text-muted-foreground">
								Showing {filteredVideos.length} of {videos.length} videos
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Delete Confirmation Dialog */}
			<CustomAlertDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				alertTitle="Delete Video"
				alertDescription={`Are you sure you want to delete "${videoToDelete?.title}"? This action cannot be undone and will permanently remove the video from your library.`}
				cancelText="Cancel"
				actionText="Delete Video"
				action={handleDeleteConfirm}
			/>
		</div>
	);
}

// Loading skeleton component
function VideosPageSkeleton() {
	return (
		<div className="space-y-6 p-6">
			<div className="flex justify-between items-start">
				<div className="space-y-2">
					<Skeleton className="h-8 w-64" />
					<Skeleton className="h-4 w-96" />
				</div>
				<Skeleton className="h-10 w-32" />
			</div>

			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
				{Array.from({ length: 5 }).map((_, i) => (
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
					<Skeleton className="h-6 w-16" />
					<Skeleton className="h-4 w-48" />
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						<div className="flex gap-4">
							<Skeleton className="h-10 flex-1" />
							<Skeleton className="h-10 w-32" />
							<Skeleton className="h-10 w-32" />
							<Skeleton className="h-10 w-24" />
							<Skeleton className="h-10 w-10" />
						</div>
						<div className="space-y-3">
							{Array.from({ length: 5 }).map((_, i) => (
								<div
									key={i}
									className="flex items-center gap-4 p-4 border rounded">
									<Skeleton className="h-12 w-16 rounded" />
									<div className="flex-1 space-y-1">
										<Skeleton className="h-4 w-48" />
										<Skeleton className="h-3 w-64" />
									</div>
									<Skeleton className="h-6 w-16" />
									<Skeleton className="h-6 w-20" />
									<Skeleton className="h-6 w-16" />
									<Skeleton className="h-4 w-16" />
									<Skeleton className="h-8 w-16" />
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
