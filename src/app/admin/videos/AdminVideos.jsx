"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import UserAvatar from "@/components/singleComponents/UserAvatar";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

import CustomDropdown from "@/components/singleComponents/CustomDropdown";
import { Icon } from "@iconify/react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import axios from "@/lib/axios";
import Link from "next/link";
import DashboardInfoCard from "@/components/combinedComponents/DashboardInfoCard";
import CustomSelect from "@/components/singleComponents/CustomSelect";
import CustomAlertDialog from "@/components/singleComponents/CustomAlertDialog";
import { deleteVideo } from "@/lib/utils";

export default function AdminVideos() {
	const [videos, setVideos] = useState([]);
	const [genres, setGenres] = useState([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [statusFilter, setStatusFilter] = useState("all");
	const [genreFilter, setGenreFilter] = useState("all");
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedVideo, setSelectedVideo] = useState(null);

	// Fetch videos and genres from API
	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const [videosResponse, genresResponse] = await Promise.all([
					axios.get("/getAllVideos"),
					axios.get("/getGenres"),
				]);

				setVideos(videosResponse.data);
				setGenres(genresResponse.data);
			} catch (error) {
				console.error("Error fetching data:", error);
				toast.error("Failed to load videos and genres.");
			} finally {
				setLoading(false);
			}
		};

		fetchData();
	}, []);

	// Filter videos based on search and filters
	const filteredVideos = videos.filter((video) => {
		const matchesSearch =
			video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			video.description.toLowerCase().includes(searchQuery.toLowerCase());
		const matchesStatus =
			statusFilter === "all" || video.status === statusFilter;

		// Check if video has the selected genre
		const matchesGenre =
			genreFilter === "all" ||
			(video.genres &&
				video.genres.some((genre) => genre.id.toString() === genreFilter));

		return matchesSearch && matchesStatus && matchesGenre;
	});

	// Format duration from seconds to readable format
	const formatDuration = (seconds) => {
		if (!seconds) return "N/A";
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		}
		return `${minutes}m`;
	};

	// Format date
	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const getStatusBadge = (status) => {
		const statusConfig = {
			ready: { color: "bg-green-100 text-green-800", label: "Ready" },
			processing: { color: "bg-blue-100 text-blue-800", label: "Processing" },
			failed: { color: "bg-red-100 text-red-800", label: "Failed" },
			pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
		};
		const config = statusConfig[status] || {
			color: "bg-gray-100 text-gray-800",
			label: status,
		};
		return <Badge className={`${config.color} border-0`}>{config.label}</Badge>;
	};

	const getResolutionsBadge = (resolutions) => {
		if (!resolutions || resolutions.length === 0)
			return <Badge variant="outline">No resolutions</Badge>;
		const highestRes = resolutions[resolutions.length - 1];
		return (
			<div className="flex items-center gap-1">
				<Badge className="bg-blue-100 text-blue-800 border-0 text-xs">
					Up to {highestRes}
				</Badge>
			</div>
		);
	};

	// Render video genres as badges
	const renderGenres = (videoGenres) => {
		if (!videoGenres || videoGenres.length === 0) {
			return <Badge variant="outline">No genres</Badge>;
		}

		if (videoGenres.length === 1) {
			return <Badge variant="secondary">{videoGenres[0].name}</Badge>;
		}

		// Show first genre and count if more than one
		return (
			<div className="flex items-center gap-1">
				<Badge variant="secondary">{videoGenres[0].name.toUpperCase()}</Badge>
				{videoGenres.length > 1 && (
					<Badge variant="outline" className="text-xs">
						+{videoGenres.length - 1}
					</Badge>
				)}
			</div>
		);
	};

	const handleDeleteVideo = async (videoId) => {
		try {
			const res = await deleteVideo(videoId);
			if (!res) {
				toast.error("Failed to delete video.");
				return;
			}
			setVideos((prev) => prev.filter((video) => video.id !== videoId));
			toast.success("Video deleted successfully.");
		} catch (error) {
			toast.error("Failed to delete video.");
		}
	};

	// Get unique genre count for stats
	const uniqueGenreCount = genres.length;

	return (
		<div className="space-y-6 pt-4">
			{/* Header */}
			<div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div>
					<h1 className="text-3xl font-bold tracking-tight">
						Video Management
					</h1>
					<p className="text-muted-foreground">
						Manage your video library, upload new content, and monitor
						processing status.
					</p>
				</div>
				<Button variant={"default"} asChild>
					<Link href="/admin/videos/upload">
						<Icon icon="basil:add-outline" className="w-6 h-6" />
						Upload Video
					</Link>
				</Button>
			</div>

			{/* Stats Cards */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<DashboardInfoCard
					title="Total Videos"
					value={videos.length}
					subtitle={`${uniqueGenreCount} genres available`}
					icon="solar:videocamera-record-bold-duotone"
					loading={loading}
				/>
				<DashboardInfoCard
					title="Ready Videos"
					value={videos.filter((v) => v.status === "ready").length}
					subtitle="Streamable content"
					icon="solar:check-circle-bold-duotone"
					iconColor="text-green-600"
					loading={loading}
				/>
				<DashboardInfoCard
					title="Processing"
					value={videos.filter((v) => v.status === "processing").length}
					subtitle="Being processed"
					icon="solar:clock-circle-bold-duotone"
					iconColor="text-blue-600"
					loading={loading}
				/>
				<DashboardInfoCard
					title="Total Duration"
					value={formatDuration(
						videos.reduce((sum, video) => sum + (video.duration || 0), 0),
					)}
					subtitle="Total content time"
					icon="solar:time-bold-duotone"
					iconColor="text-purple-600"
					loading={loading}
				/>
			</div>

			{/* Filters */}
			<Card>
				<CardContent className="">
					<div className="flex flex-col gap-4 md:flex-row md:items-center">
						<div className="flex-1">
							<div className="relative">
								<Icon
									icon="solar:magnifer-bold-duotone"
									className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
								/>
								<Input
									placeholder="Search videos..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="pl-10"
								/>
							</div>
						</div>
						<div className="flex gap-2">
							<CustomSelect
								label="Status"
								value={statusFilter}
								onValueChange={setStatusFilter}
								options={[
									{ value: "all", label: "All Status" },
									{ value: "ready", label: "Ready" },
									{ value: "processing", label: "Processing" },
									{ value: "failed", label: "Failed" },
									{ value: "pending", label: "Pending" },
								]}
							/>
							<CustomSelect
								label="Genre"
								value={genreFilter}
								onValueChange={setGenreFilter}
								options={[
									{ value: "all", label: "All Genres" },
									...genres.map((genre) => ({
										value: genre.id.toString(),
										label: genre.name,
									})),
								]}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Videos Table */}
			<Card className={"py-0 p-2"}>
				<CardContent className="p-0">
					{loading ? (
						<div className="p-6">
							{[...Array(5)].map((_, i) => (
								<div key={i} className="flex items-center space-x-4 mb-4">
									<Skeleton className="h-16 w-28 rounded" />
									<div className="space-y-2 flex-1">
										<Skeleton className="h-4 w-3/4" />
										<Skeleton className="h-3 w-1/2" />
									</div>
									<Skeleton className="h-8 w-20" />
								</div>
							))}
						</div>
					) : filteredVideos.length === 0 ? (
						<div className="p-8 text-center">
							<Icon
								icon="solar:videocamera-record-bold-duotone"
								className="mx-auto h-12 w-12 text-muted-foreground"
							/>
							<h3 className="mt-2 text-sm font-medium">No videos found</h3>
							<p className="mt-1 text-sm text-muted-foreground">
								{searchQuery || statusFilter !== "all" || genreFilter !== "all"
									? "Try adjusting your search or filters"
									: "Get started by uploading your first video"}
							</p>
							{!searchQuery &&
								statusFilter === "all" &&
								genreFilter === "all" && (
									<Button asChild className="mt-4">
										<Link href="/admin/videos/upload">
											<Icon
												icon="solar:add-circle-bold-duotone"
												className="mr-2 h-4 w-4"
											/>
											Upload Video
										</Link>
									</Button>
								)}
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>ID</TableHead>
									<TableHead>Details</TableHead>
									<TableHead>Genres</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Resolutions</TableHead>
									<TableHead>Duration</TableHead>
									<TableHead>Upload Date</TableHead>
									<TableHead>Uploaded By</TableHead>
									<TableHead className={"text-right"}>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredVideos.map((video) => (
									<TableRow key={video.id}>
										<TableCell>
											<span>{video.id}</span>
										</TableCell>
										<TableCell>
											<div className="flex items-center space-x-3">
												<div className="relative">
													<img
														src={
															video.thumbnail_path || "/placeholder-video.jpg"
														}
														alt={video.title}
														className="w-16 h-full object-cover rounded border cursor-pointer"
														onError={(e) => {
															e.target.src = "/placeholder-video.jpg";
														}}
														onClick={() => {
															window.open(`/video/play/${video.id}`, "_blank");
														}}
													/>
													<div className="absolute bottom-0 right-0 bg-black/75 text-white text-xs px-1 rounded-tl">
														{formatDuration(video.duration)}
													</div>
												</div>
												<div className="min-w-0 flex-1">
													<p className="font-medium truncate">{video.title}</p>
													<p className="text-sm text-muted-foreground truncate">
														{video.description?.substring(0, 60)}
														{video.description?.length > 60 ? "..." : ""}
													</p>
												</div>
											</div>
										</TableCell>
										<TableCell>{renderGenres(video.genres)}</TableCell>
										<TableCell>{getStatusBadge(video.status)}</TableCell>
										<TableCell>
											{getResolutionsBadge(video.resolutions)}
										</TableCell>
										<TableCell>
											<div className="text-sm font-medium text-center">
												{formatDuration(video.duration)}
											</div>
										</TableCell>
										<TableCell>
											<div className="text-sm">
												{formatDate(video.created_at)}
											</div>
										</TableCell>
										<TableCell>
											<div
												className="flex items-center justify-center gap-2 mr-9"
												title={video.user?.name}>
												<UserAvatar
													src={video.user?.profile_picture}
													size="sm"
													className="cursor-pointer"
													onClick={() => {
														window.open(
															`/admin/users/${video.user?.id}`,
															"_blank",
														);
													}}
												/>
											</div>
										</TableCell>
										<TableCell className="text-right">
											<CustomDropdown
												options={["Edit", "Delete"]}
												icon="mage:dots"
												onSelect={(action) => {
													if (action === "Edit") {
														window.location.href = `/admin/videos/edit/${video.id}`;
													} else if (action === "Delete") {
														setSelectedVideo(video);
														setDeleteDialogOpen(true);
													}
												}}
											/>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
			{deleteDialogOpen && (
				<CustomAlertDialog
					open={deleteDialogOpen}
					onOpenChange={setDeleteDialogOpen}
					alertTitle="Delete Video"
					alertDescription="Are you sure you want to delete this video? This action cannot be undone?"
					actionText="Delete"
					cancelText="Cancel"
					varient="destructive"
					action={() => handleDeleteVideo(selectedVideo.id)}
				/>
			)}
		</div>
	);
}
