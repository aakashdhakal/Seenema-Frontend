"use client";

import { useState, useEffect, useMemo } from "react";
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

	// Pagination states (simplified like products page)
	const [page, setPage] = useState(1);
	const itemsPerPage = 10; // Fixed like in products page

	const { user } = useAuthContext();

	// Fetch data
	useEffect(() => {
		fetchData();
	}, []);

	// Setup Laravel Reverb notifications
	useEffect(() => {
		if (!user?.id) return;

		const conn = echo.connector?.pusher?.connection;
		if (conn) {
			conn.bind("connected", () => setConnectionStatus("connected"));
			conn.bind("disconnected", () => setConnectionStatus("disconnected"));
			conn.bind("error", () => setConnectionStatus("error"));
		}

		const adminChannel = echo
			.private("admin.notifications")
			.listen(".video.processing.status", handleVideoStatusUpdate);

		return () => {
			adminChannel.stopListening(".video.processing.status");
			echo.leaveChannel("admin.notifications");
		};
	}, [user?.id]);

	// Handle video status updates in real-time
	const handleVideoStatusUpdate = (data) => {
		console.log("Video status update received:", data);
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
				axiosInstance.get("/video/all"),
				axiosInstance.get("/genre/get"),
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

	// Filter and sort videos (similar to products page)
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

	// Pagination calculation (same as products page)
	const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);
	const paginatedVideos = filteredVideos.slice(
		(page - 1) * itemsPerPage,
		page * itemsPerPage,
	);
	const startItem =
		filteredVideos.length > 0 ? (page - 1) * itemsPerPage + 1 : 0;
	const endItem = Math.min(page * itemsPerPage, filteredVideos.length);

	// Reset to first page when filters change
	useEffect(() => {
		setPage(1);
	}, [searchTerm, statusFilter, genreFilter, sortBy, sortOrder]);

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
			await axiosInstance.delete(`/video/${videoId}`);
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

	// Clear all filters
	const clearFilters = () => {
		setSearchTerm("");
		setStatusFilter("all");
		setGenreFilter("all");
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

	const actionOptions = ["Watch Video", "Edit Video", "Delete Video"];

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
								{Array.from({ length: itemsPerPage }).map((_, i) => (
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
					<Link rel="preload" href="/admin/videos/upload">
						<Icon icon="ion:cloud-upload" width="1.2em" height="1.2em" />
						Upload Video
					</Link>
				</Button>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Total Videos</CardTitle>
						<Icon icon="majesticons:video" width="1.5em" height="1.5em" />
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
							icon="lets-icons:check-round-fill"
							width="1.8em"
							height="1.8em"
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
						<Icon icon="mdi:folder-refresh" width="1.5em" height="1.5em" />
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
							icon="icon-park-outline:link-cloud-faild"
							width="1.7em"
							height="1.7em"
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
						<Icon icon="weui:time-filled" width="1.5em" height="1.5em" />
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
			<div className="flex flex-col sm:flex-row gap-3">
				<div className="relative flex-grow">
					<Icon
						icon="ri:search-line"
						className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
					/>
					<Input
						placeholder="Search videos by title or description..."
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
						className="pl-10"
					/>
				</div>
				<div className="flex gap-3">
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
						icon="iconoir:filter-solid"
						className="w-[140px] justify-between text-foreground hover:text-foreground hover:bg-accent"
					/>

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
						icon="mdi:tag"
						className="w-[140px] justify-between text-foreground hover:text-foreground hover:bg-accent"
					/>

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
						icon="mi:sort"
						className="w-[150px] justify-between text-foreground hover:text-foreground hover:bg-accent"
					/>

					<Button variant="outline" onClick={fetchData}>
						<Icon icon="eva:refresh-fill" className="h-4 w-4" />
					</Button>
				</div>
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
						{filteredVideos.length === 0 ? (
							// Empty state
							<TableRow>
								<TableCell colSpan={8} className="text-center py-12">
									<div className="flex flex-col items-center gap-3">
										<Icon
											icon="solar:videocamera-record-bold-duotone"
											className="h-12 w-12 text-gray-300"
										/>
										<h3 className="text-lg font-medium text-gray-900">
											No videos found
										</h3>
										<p className="text-gray-500 max-w-md mx-auto">
											{searchTerm ||
											statusFilter !== "all" ||
											genreFilter !== "all"
												? "Try adjusting your search or filters to find what you're looking for."
												: "Get started by uploading your first video to the library."}
										</p>
										{(searchTerm ||
											statusFilter !== "all" ||
											genreFilter !== "all") && (
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
							// Video list
							paginatedVideos.map((video) => (
								<TableRow key={video.id}>
									<TableCell>
										<div className="flex items-center gap-3">
											<div className="relative">
												<img
													src={video.thumbnail_path || "/placeholder-video.jpg"}
													alt={video.title}
													className="w-16 h-12 object-cover rounded cursor-pointer border"
													onError={(e) => {
														e.target.src = "/placeholder-video.jpg";
													}}
													onClick={() =>
														window.open(`/video/watch/${video.id}`, "_blank")
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
									<TableCell>{renderResolutions(video.resolutions)}</TableCell>
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
											onSelect={(action) => handleVideoAction(action, video)}
											placeholder=""
											variant="ghost"
											size="sm"
											icon="solar:menu-dots-bold"
											className="h-8 w-8 p-0 text-foreground hover:text-foreground hover:bg-accent"
										/>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</div>

			{/* Pagination */}
			{!loading && filteredVideos.length > 0 && (
				<div className="flex justify-between items-center py-4">
					<div className="text-sm text-muted-foreground">
						Showing {startItem} to {endItem} of {filteredVideos.length} videos
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
				alertTitle="Delete Video"
				alertDescription={`Are you sure you want to delete "${videoToDelete?.title}"? This action cannot be undone and will permanently remove the video from your library.`}
				cancelText="Cancel"
				actionText="Delete Video"
				action={handleDeleteConfirm}
			/>
		</div>
	);
}
