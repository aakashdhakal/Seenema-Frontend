"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import axios from "@/lib/axios";
import CustomSelect from "@/components/singleComponents/CustomSelect";
import ComboBox from "@/components/singleComponents/ComboBox";
import CustomAlertDialog from "@/components/singleComponents/CustomAlertDialog";
import UserAvatar from "@/components/singleComponents/UserAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { deleteVideo } from "@/lib/utils";

export default function VideoDetails() {
	const router = useRouter();
	const params = useParams();
	const videoId = params.id;

	// States
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [isEditing, setIsEditing] = useState(false);
	const [video, setVideo] = useState(null);
	const [people, setPeople] = useState([]);
	const [availableGenres, setAvailableGenres] = useState([]);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [creditDialogOpen, setCreditDialogOpen] = useState(false);
	const [isCreatingPerson, setIsCreatingPerson] = useState(false);

	// Form states
	const [formData, setFormData] = useState({
		title: "",
		description: "",
		genres: [],
		tags: [],
		poster: null,
		backdrop: null,
		contentRating: "",
		visibility: "public",
		language: "en",
		credits: [],
		releaseYear: new Date().getFullYear(),
	});

	// Input states for adding items
	const [genreInput, setGenreInput] = useState("");
	const [tagInput, setTagInput] = useState("");
	const [creditInput, setCreditInput] = useState({
		selectedPerson: "",
		creditedAs: "",
	});

	// New person form
	const [newPersonForm, setNewPersonForm] = useState({
		name: "",
		biography: "",
		profileImage: null,
	});

	// Image previews
	const [posterPreview, setPosterPreview] = useState(null);
	const [backdropPreview, setBackdropPreview] = useState(null);

	// Static data
	const contentRatings = [
		{ value: "G", label: "G - General Audiences" },
		{ value: "PG", label: "PG - Parental Guidance" },
		{ value: "PG-13", label: "PG-13 - Parents Strongly Cautioned" },
		{ value: "R", label: "R - Restricted" },
		{ value: "NC-17", label: "NC-17 - Adults Only" },
	];

	const languages = [
		{ value: "en", label: "English" },
		{ value: "es", label: "Spanish" },
		{ value: "fr", label: "French" },
		{ value: "de", label: "German" },
		{ value: "it", label: "Italian" },
		{ value: "ja", label: "Japanese" },
		{ value: "ko", label: "Korean" },
		{ value: "zh", label: "Chinese" },
		{ value: "hi", label: "Hindi" },
		{ value: "ar", label: "Arabic" },
	];

	// Fetch video data and related data
	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			try {
				const [videoRes, peopleRes, genresRes] = await Promise.all([
					axios.get(`/video/${videoId}`),
					axios.get("/people/get"),
					axios.get("/genre/get"),
				]);

				const videoData = videoRes.data;
				setVideo(videoData);
				setPeople(peopleRes.data);
				setAvailableGenres(genresRes.data.map((g) => g.name));

				// Set form data based on actual data structure
				setFormData({
					title: videoData.title || "",
					description: videoData.description || "",
					genres: videoData.genres?.map((g) => g.name) || [],
					tags: videoData.tags?.map((t) => t.name) || [],
					poster: null,
					backdrop: null,
					contentRating: videoData.content_rating || "",
					visibility: videoData.visibility || "public",
					language: videoData.language || "en",
					// Convert people to credits format for editing
					credits:
						videoData.people?.map((person) => ({
							person_id: person.id,
							person_name: person.name,
							credited_as: person.pivot?.credited_as || "",
						})) || [],
					releaseYear:
						parseInt(videoData.release_year) || new Date().getFullYear(),
				});

				// Set image previews from existing data
				if (videoData.thumbnail_path) {
					setPosterPreview(videoData.thumbnail_path);
				}
				if (videoData.backdrop_path) {
					setBackdropPreview(videoData.backdrop_path);
				}
			} catch (error) {
				console.error("Error fetching video data:", error);
				toast.error("Failed to load video data");
				router.push("/admin/videos");
			} finally {
				setLoading(false);
			}
		};

		if (videoId) {
			fetchData();
		}
	}, [videoId, router]);

	// Utility functions
	const formatDuration = (seconds) => {
		if (!seconds) return "N/A";
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		}
		return `${minutes}m`;
	};

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
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

	// Form handlers
	const handleInputChange = (field, value) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	};

	// Genre management
	const addGenre = (genreValue) => {
		let genreName;
		if (availableGenres.includes(genreValue)) {
			genreName = genreValue;
		} else {
			genreName = typeof genreValue === "string" ? genreValue.trim() : null;
		}

		if (genreName && !formData.genres.includes(genreName)) {
			setFormData((prev) => ({
				...prev,
				genres: [...prev.genres, genreName],
			}));
			setGenreInput("");
		}
	};

	const removeGenre = (genreToRemove) => {
		setFormData((prev) => ({
			...prev,
			genres: prev.genres.filter((g) => g !== genreToRemove),
		}));
	};

	// Tag management
	const addTag = () => {
		if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
			setFormData((prev) => ({
				...prev,
				tags: [...prev.tags, tagInput.trim()],
			}));
			setTagInput("");
		}
	};

	const removeTag = (tagToRemove) => {
		setFormData((prev) => ({
			...prev,
			tags: prev.tags.filter((tag) => tag !== tagToRemove),
		}));
	};

	// Credits management
	const handleAddCredit = () => {
		if (!creditInput.selectedPerson) {
			toast.error("Please select a person");
			return;
		}

		const person = people.find(
			(p) => p.id === parseInt(creditInput.selectedPerson),
		);
		if (!person) return;

		const existingCredit = formData.credits?.find(
			(c) => c.person_id === parseInt(creditInput.selectedPerson),
		);

		if (!existingCredit) {
			setFormData((prev) => ({
				...prev,
				credits: [
					...(prev.credits || []),
					{
						person_id: parseInt(creditInput.selectedPerson),
						person_name: person.name,
						credited_as: creditInput.creditedAs,
					},
				],
			}));
			setCreditInput({ selectedPerson: "", creditedAs: "" });
		} else {
			toast.error("This person is already credited");
		}
	};

	const removeCredit = (personId) => {
		setFormData((prev) => ({
			...prev,
			credits: prev.credits?.filter((c) => !(c.person_id === personId)) || [],
		}));
	};

	// Image upload handler
	const handleImageUpload = (field, file) => {
		if (file) {
			setFormData((prev) => ({
				...prev,
				[field]: file,
			}));

			const previewUrl = URL.createObjectURL(file);
			if (field === "poster") {
				setPosterPreview(previewUrl);
			} else if (field === "backdrop") {
				setBackdropPreview(previewUrl);
			}
		}
	};

	// Create new person
	const handleCreatePerson = async () => {
		setIsCreatingPerson(true);
		if (!newPersonForm.name.trim()) {
			toast.error("Please enter a name");
			setIsCreatingPerson(false);
			return;
		}

		try {
			const personData = new FormData();
			personData.append("name", newPersonForm.name);
			personData.append("biography", newPersonForm.biography);
			if (newPersonForm.profileImage) {
				personData.append("profile_picture", newPersonForm.profileImage);
			}

			const response = await axios.post("/people/create", personData, {
				headers: { "Content-Type": "multipart/form-data" },
			});

			const newPerson = response.data;
			setPeople((prev) => [...prev, newPerson]);
			setCreditInput((prev) => ({ ...prev, selectedPerson: newPerson.id }));
			setNewPersonForm({ name: "", biography: "", profileImage: null });
			setCreditDialogOpen(false);
			toast.success("Person added successfully!");
		} catch (error) {
			console.error("Error creating person:", error);
			toast.error("Failed to add person. Please try again.");
		}
		setIsCreatingPerson(false);
	};

	// Save changes
	const handleSave = async () => {
		setSaving(true);

		try {
			const updateData = new FormData();

			// Append text data
			updateData.append("title", formData.title);
			updateData.append("description", formData.description);
			updateData.append("content_rating", formData.contentRating);
			updateData.append("visibility", formData.visibility);
			updateData.append("language", formData.language);
			updateData.append("release_year", formData.releaseYear);
			updateData.append("genres", JSON.stringify(formData.genres));
			updateData.append("tags", JSON.stringify(formData.tags));
			updateData.append("credits", JSON.stringify(formData.credits));

			// Append image files if new ones were uploaded
			if (formData.poster instanceof File) {
				updateData.append("poster", formData.poster);
			}
			if (formData.backdrop instanceof File) {
				updateData.append("backdrop", formData.backdrop);
			}

			const response = await axios.post(`/updateVideo/${videoId}`, updateData, {
				headers: { "Content-Type": "multipart/form-data" },
			});

			// Update local video data
			setVideo(response.data);
			setIsEditing(false);
			toast.success("Video updated successfully!");
		} catch (error) {
			console.error("Error updating video:", error);
			toast.error("Failed to update video. Please try again.");
		}
		setSaving(false);
	};

	// Delete video
	const handleDeleteVideo = async () => {
		try {
			const res = await deleteVideo(videoId);
			if (!res) {
				toast.error("Failed to delete video.");
				return;
			}
			toast.success("Video deleted successfully.");
			router.push("/admin/videos");
		} catch (error) {
			toast.error("Failed to delete video.");
		}
	};

	// Cancel edit
	const handleCancelEdit = () => {
		// Reset form data to original video data
		setFormData({
			title: video.title || "",
			description: video.description || "",
			genres: video.genres?.map((g) => g.name) || [],
			tags: video.tags?.map((t) => t.name) || [],
			poster: null,
			backdrop: null,
			contentRating: video.content_rating || "",
			visibility: video.visibility || "public",
			language: video.language || "en",
			credits:
				video.people?.map((person) => ({
					person_id: person.id,
					person_name: person.name,
					credited_as: person.pivot?.credited_as || "",
				})) || [],
			releaseYear: parseInt(video.release_year) || new Date().getFullYear(),
		});

		// Reset image previews
		setPosterPreview(video.thumbnail_path);
		setBackdropPreview(video.backdrop_path);

		setIsEditing(false);
	};

	if (loading) {
		return (
			<div className="container mx-auto px-4 py-8 max-w-6xl">
				<div className="mb-8">
					<Skeleton className="h-8 w-64 mb-4" />
					<Skeleton className="h-12 w-96" />
				</div>
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2 space-y-6">
						<Card>
							<CardHeader>
								<Skeleton className="h-6 w-32" />
							</CardHeader>
							<CardContent className="space-y-4">
								<Skeleton className="h-4 w-full" />
								<Skeleton className="h-4 w-3/4" />
								<Skeleton className="h-20 w-full" />
							</CardContent>
						</Card>
					</div>
					<div>
						<Card>
							<CardContent className="p-0">
								<Skeleton className="w-full h-64" />
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		);
	}

	if (!video) {
		return (
			<div className="container mx-auto px-4 py-8 max-w-6xl">
				<div className="text-center">
					<Icon
						icon="solar:videocamera-record-bold-duotone"
						className="mx-auto h-12 w-12 text-muted-foreground mb-4"
					/>
					<h3 className="text-lg font-medium">Video not found</h3>
					<p className="text-muted-foreground mb-4">
						The video you're looking for doesn't exist.
					</p>
					<Button onClick={() => router.push("/admin/videos")}>
						<Icon icon="solar:arrow-left-bold" className="mr-2 h-4 w-4" />
						Back to Videos
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto px-4 py-8 max-w-6xl">
			{/* Header */}
			<div className="mb-8">
				<Button
					variant="ghost"
					onClick={() => router.push("/admin/videos")}
					className="mb-4">
					<Icon icon="solar:arrow-left-bold" className="mr-2 h-4 w-4" />
					Back to Videos
				</Button>

				<div className="flex items-center justify-between">
					<div>
						<h1 className="text-3xl font-bold">
							{isEditing ? "Edit Video" : "Video Details"}
						</h1>
						<p className="text-muted-foreground">
							{isEditing
								? "Modify video information"
								: "View and manage video details"}
						</p>
					</div>

					<div className="flex items-center gap-2">
						{getStatusBadge(video.status)}
						{!isEditing ? (
							<div className="flex gap-2">
								<Button
									variant="outline"
									onClick={() =>
										window.open(`/video/watch/${video.id}`, "_blank")
									}>
									<Icon icon="solar:play-bold" className="mr-2 h-4 w-4" />
									Preview
								</Button>
								<Button onClick={() => setIsEditing(true)}>
									<Icon icon="solar:pen-bold" className="mr-2 h-4 w-4" />
									Edit
								</Button>
								<Button
									variant="destructive"
									onClick={() => setDeleteDialogOpen(true)}>
									<Icon icon="solar:trash-bold" className="mr-2 h-4 w-4" />
									Delete
								</Button>
							</div>
						) : (
							<div className="flex gap-2">
								<Button variant="outline" onClick={handleCancelEdit}>
									Cancel
								</Button>
								<Button
									onClick={handleSave}
									isLoading={saving}
									loadingText="Saving...">
									<Icon icon="solar:diskette-bold" className="mr-2 h-4 w-4" />
									Save Changes
								</Button>
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Main Content */}
				<div className="lg:col-span-2 space-y-6">
					{/* Basic Information */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center">
								<Icon
									icon="solar:document-text-bold"
									className="mr-2 h-5 w-5"
								/>
								Basic Information
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="md:col-span-2">
									<Label htmlFor="title">Title</Label>
									{isEditing ? (
										<Input
											id="title"
											value={formData.title}
											onChange={(e) =>
												handleInputChange("title", e.target.value)
											}
											placeholder="Enter video title"
											className="mt-2"
										/>
									) : (
										<p className="text-lg font-medium mt-1">{video.title}</p>
									)}
								</div>

								<div className="md:col-span-2">
									<Label htmlFor="description">Description</Label>
									{isEditing ? (
										<Textarea
											id="description"
											value={formData.description}
											onChange={(e) =>
												handleInputChange("description", e.target.value)
											}
											placeholder="Enter video description"
											rows={4}
											className="resize-none mt-2"
										/>
									) : (
										<p className="text-muted-foreground mt-1">
											{video.description || "No description provided"}
										</p>
									)}
								</div>

								<div>
									<Label>Release Year</Label>
									{isEditing ? (
										<Input
											type="number"
											value={formData.releaseYear}
											onChange={(e) =>
												handleInputChange(
													"releaseYear",
													parseInt(e.target.value),
												)
											}
											min="1900"
											max={new Date().getFullYear()}
											className="mt-2"
										/>
									) : (
										<p className="mt-1">
											{video.release_year || "Not specified"}
										</p>
									)}
								</div>

								<div>
									<Label>Content Rating</Label>
									{isEditing ? (
										<div className="mt-2">
											<CustomSelect
												value={formData.contentRating}
												onValueChange={(value) =>
													handleInputChange("contentRating", value)
												}
												options={contentRatings}
												label="Select Content Rating"
											/>
										</div>
									) : (
										<p className="mt-1">
											{video.content_rating || "Not rated"}
										</p>
									)}
								</div>

								<div>
									<Label>Language</Label>
									{isEditing ? (
										<div className="mt-2">
											<CustomSelect
												value={formData.language}
												onValueChange={(value) =>
													handleInputChange("language", value)
												}
												options={languages}
												label="Select Language"
											/>
										</div>
									) : (
										<p className="mt-1">
											{languages.find((l) => l.value === video.language)
												?.label || video.language}
										</p>
									)}
								</div>

								<div>
									<Label>Visibility</Label>
									{isEditing ? (
										<div className="mt-2">
											<CustomSelect
												value={formData.visibility}
												onValueChange={(value) =>
													handleInputChange("visibility", value)
												}
												options={[
													{ value: "public", label: "Public" },
													{ value: "unlisted", label: "Unlisted" },
													{ value: "private", label: "Private" },
												]}
												label="Select Visibility"
											/>
										</div>
									) : (
										<Badge variant="outline" className="mt-1 capitalize">
											{video.visibility}
										</Badge>
									)}
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Genres */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center">
								<Icon icon="solar:camera-bold" className="mr-2 h-5 w-5" />
								Genres
							</CardTitle>
						</CardHeader>
						<CardContent>
							{isEditing ? (
								<div className="space-y-4">
									<div className="flex gap-2">
										<Input
											value={genreInput}
											onChange={(e) => setGenreInput(e.target.value)}
											placeholder="Type genre name..."
											onKeyPress={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													if (genreInput.trim()) {
														addGenre(genreInput.trim());
													}
												}
											}}
											className="flex-1"
										/>
										<Button
											onClick={() => {
												if (genreInput.trim()) {
													addGenre(genreInput.trim());
												}
											}}
											variant="outline"
											disabled={!genreInput.trim()}>
											<Icon icon="mingcute:add-fill" className="h-4 w-4" />
										</Button>
									</div>

									{availableGenres.length > 0 && (
										<ComboBox
											items={availableGenres
												.filter(
													(genreName) => !formData.genres.includes(genreName),
												)
												.map((genreName) => ({
													value: genreName,
													label: genreName,
												}))}
											value=""
											onValueChange={(value) => addGenre(value)}
											placeholder="Or select from existing genres..."
											searchPlaceholder="Search existing genres"
											emptyMessage="No existing genres found"
											className="w-full"
										/>
									)}

									<div className="flex flex-wrap gap-2">
										{formData.genres.map((genreName, index) => (
											<Badge
												key={index}
												variant="secondary"
												className="flex items-center gap-1">
												{genreName}
												<Button
													variant="ghost"
													className="p-0 h-6 w-6"
													onClick={() => removeGenre(genreName)}>
													<Icon
														icon="akar-icons:cross"
														className="h-2 w-2 text-muted-foreground"
													/>
												</Button>
											</Badge>
										))}
									</div>
								</div>
							) : (
								<div className="flex flex-wrap gap-2">
									{video.genres?.length > 0 ? (
										video.genres.map((genre, index) => (
											<Badge key={index} variant="secondary">
												{genre.name}
											</Badge>
										))
									) : (
										<p className="text-muted-foreground">No genres assigned</p>
									)}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Tags */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center">
								<Icon icon="solar:tag-bold" className="mr-2 h-5 w-5" />
								Tags
							</CardTitle>
						</CardHeader>
						<CardContent>
							{isEditing ? (
								<div className="space-y-4">
									<div className="flex gap-2">
										<Input
											value={tagInput}
											onChange={(e) => setTagInput(e.target.value)}
											placeholder="Type tag name..."
											onKeyPress={(e) =>
												e.key === "Enter" && (e.preventDefault(), addTag())
											}
										/>
										<Button
											onClick={addTag}
											variant="outline"
											disabled={!tagInput.trim()}>
											<Icon icon="mingcute:add-fill" className="h-4 w-4" />
										</Button>
									</div>
									<div className="flex flex-wrap gap-2">
										{formData.tags.map((tagName, index) => (
											<Badge
												key={index}
												variant="secondary"
												className="flex items-center gap-1">
												{tagName}
												<Button
													variant="ghost"
													className="p-0 h-6 w-6"
													onClick={() => removeTag(tagName)}>
													<Icon
														icon="akar-icons:cross"
														className="h-2 w-2 text-muted-foreground"
													/>
												</Button>
											</Badge>
										))}
									</div>
								</div>
							) : (
								<div className="flex flex-wrap gap-2">
									{video.tags?.length > 0 ? (
										video.tags.map((tag, index) => (
											<Badge key={index} variant="outline">
												{tag.name}
											</Badge>
										))
									) : (
										<p className="text-muted-foreground">No tags assigned</p>
									)}
								</div>
							)}
						</CardContent>
					</Card>

					{/* Cast & Crew */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center justify-between">
								<div className="flex items-center">
									<Icon
										icon="solar:users-group-two-rounded-bold"
										className="mr-2 h-5 w-5"
									/>
									Cast & Crew
								</div>
								{isEditing && (
									<Button
										variant="outline"
										size="sm"
										onClick={() => setCreditDialogOpen(true)}>
										<Icon
											icon="solar:add-circle-bold"
											className="h-4 w-4 mr-2"
										/>
										Add Person
									</Button>
								)}
							</CardTitle>
						</CardHeader>
						<CardContent>
							{isEditing ? (
								<div className="space-y-4">
									<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
										<div className="space-y-2">
											<Label>Select Person</Label>
											<ComboBox
												items={people.map((p) => ({
													value: p.id,
													label: p.name,
												}))}
												value={creditInput.selectedPerson}
												onValueChange={(value) =>
													setCreditInput((prev) => ({
														...prev,
														selectedPerson: value,
													}))
												}
												placeholder="Select Person"
												searchPlaceholder="Search Person"
												emptyMessage="No person Found"
												className="w-full"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="creditedAs">Credited As</Label>
											<Input
												id="creditedAs"
												value={creditInput.creditedAs ?? ""}
												onChange={(e) =>
													setCreditInput((prev) => ({
														...prev,
														creditedAs: e.target.value,
													}))
												}
												placeholder="Character name, role..."
											/>
										</div>
										<div className="lg:col-span-2">
											<Button
												onClick={handleAddCredit}
												className="w-full"
												variant="outline">
												<Icon
													icon="mingcute:add-fill"
													className="h-4 w-4 mr-2"
												/>
												Add Credit
											</Button>
										</div>
									</div>

									{formData.credits && formData.credits.length > 0 && (
										<div className="grid gap-3">
											{formData.credits.map((credit, index) => (
												<div
													key={`${credit.person_id}-${index}`}
													className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
													<div className="flex items-center gap-3">
														<UserAvatar
															src={
																people.find((p) => p.id === credit.person_id)
																	?.profile_picture
															}
															size="sm"
														/>
														<div>
															<p className="font-medium">
																{credit.person_name}
															</p>
															{credit.credited_as && (
																<p className="text-sm text-muted-foreground">
																	{credit.credited_as}
																</p>
															)}
														</div>
													</div>
													<Button
														variant="ghost"
														size="sm"
														onClick={() => removeCredit(credit.person_id)}
														className="text-red-500 hover:text-red-700 hover:bg-red-50">
														<Icon
															icon="solar:trash-bin-minimalistic-bold"
															className="h-4 w-4"
														/>
													</Button>
												</div>
											))}
										</div>
									)}
								</div>
							) : (
								<div className="space-y-4">
									{video.people?.length > 0 ? (
										<div className="grid gap-4">
											{video.people.map((person, index) => (
												<div
													key={index}
													className="flex items-center gap-3 p-3 border rounded-lg">
													<UserAvatar src={person.profile_picture} size="md" />
													<div>
														<p className="font-medium">{person.name}</p>
														{person.pivot?.credited_as && (
															<p className="text-sm text-muted-foreground">
																{person.pivot.credited_as}
															</p>
														)}
													</div>
												</div>
											))}
										</div>
									) : (
										<p className="text-muted-foreground">
											No cast & crew assigned
										</p>
									)}
								</div>
							)}
						</CardContent>
					</Card>

					{/* File Information */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center">
								<Icon icon="solar:file-bold" className="mr-2 h-5 w-5" />
								File Information
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div>
									<Label className="text-sm font-medium text-muted-foreground">
										Duration
									</Label>
									<p className="text-lg font-medium mt-1">
										{formatDuration(video.duration)}
									</p>
								</div>
								<div>
									<Label className="text-sm font-medium text-muted-foreground">
										Resolution
									</Label>
									<div className="mt-1">
										{video.resolutions?.length > 0 ? (
											<div className="flex flex-wrap gap-1">
												{video.resolutions.map((resolution, index) => (
													<Badge
														key={index}
														variant="outline"
														className="text-xs">
														{resolution}
													</Badge>
												))}
											</div>
										) : (
											<p className="text-muted-foreground">Processing...</p>
										)}
									</div>
								</div>
								<div>
									<Label className="text-sm font-medium text-muted-foreground">
										Upload Date
									</Label>
									<p className="text-sm mt-1">{formatDate(video.created_at)}</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					{/* Video Preview */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center">
								<Icon icon="solar:play-bold" className="mr-2 h-5 w-5" />
								Video Preview
							</CardTitle>
						</CardHeader>
						<CardContent className="p-0">
							<div className="relative aspect-video">
								<img
									src={video.thumbnail_path || "/placeholder-video.jpg"}
									alt={video.title}
									className="w-full h-full object-cover rounded-b-lg cursor-pointer"
									onClick={() =>
										window.open(`/video/watch/${video.id}`, "_blank")
									}
									onError={(e) => {
										e.target.src = "/placeholder-video.jpg";
									}}
								/>
								<div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-b-lg">
									<Button
										size="lg"
										className="bg-white/20 backdrop-blur-sm hover:bg-white/30"
										onClick={() =>
											window.open(`/video/watch/${video.id}`, "_blank")
										}>
										<Icon icon="solar:play-bold" className="h-8 w-8" />
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Media Assets */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center">
								<Icon icon="solar:gallery-bold" className="mr-2 h-5 w-5" />
								Media Assets
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							{/* Poster */}
							<div>
								<Label>Poster</Label>
								{isEditing ? (
									<div>
										<Input
											id="poster"
											type="file"
											accept="image/*"
											onChange={(e) =>
												handleImageUpload("poster", e.target.files[0])
											}
											className="hidden"
										/>
										<div
											className="w-full h-48 flex items-center justify-center bg-muted rounded border cursor-pointer hover:bg-muted/80 transition-colors mt-2"
											onClick={() => document.getElementById("poster").click()}>
											{posterPreview ? (
												<img
													src={posterPreview}
													alt="Poster preview"
													className="w-full h-full object-cover rounded"
												/>
											) : (
												<div className="flex flex-col items-center justify-center text-center p-4">
													<Icon
														icon="solar:cloud-upload-bold-duotone"
														className="h-8 w-8 text-muted-foreground mb-2"
													/>
													<span className="text-sm font-medium text-muted-foreground">
														Upload Poster
													</span>
												</div>
											)}
										</div>
									</div>
								) : (
									<div className="mt-2">
										{video.thumbnail_path ? (
											<img
												src={video.thumbnail_path}
												alt="Poster"
												className="w-full h-48 object-cover rounded border"
											/>
										) : (
											<div className="w-full h-48 flex items-center justify-center bg-muted rounded border">
												<p className="text-muted-foreground text-sm">
													No poster
												</p>
											</div>
										)}
									</div>
								)}
							</div>

							{/* Backdrop */}
							<div>
								<Label>Backdrop</Label>
								{isEditing ? (
									<div>
										<Input
											id="backdrop"
											type="file"
											accept="image/*"
											onChange={(e) =>
												handleImageUpload("backdrop", e.target.files[0])
											}
											className="hidden"
										/>
										<div
											className="w-full h-32 flex items-center justify-center bg-muted rounded border cursor-pointer hover:bg-muted/80 transition-colors mt-2"
											onClick={() =>
												document.getElementById("backdrop").click()
											}>
											{backdropPreview ? (
												<img
													src={backdropPreview}
													alt="Backdrop preview"
													className="w-full h-full object-cover rounded"
												/>
											) : (
												<div className="flex flex-col items-center justify-center text-center p-4">
													<Icon
														icon="solar:cloud-upload-bold-duotone"
														className="h-8 w-8 text-muted-foreground mb-2"
													/>
													<span className="text-sm font-medium text-muted-foreground">
														Upload Backdrop
													</span>
												</div>
											)}
										</div>
									</div>
								) : (
									<div className="mt-2">
										{video.backdrop_path ? (
											<img
												src={video.backdrop_path}
												alt="Backdrop"
												className="w-full h-32 object-cover rounded border"
											/>
										) : (
											<div className="w-full h-32 flex items-center justify-center bg-muted rounded border">
												<p className="text-muted-foreground text-sm">
													No backdrop
												</p>
											</div>
										)}
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Statistics */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center">
								<Icon icon="solar:chart-bold" className="mr-2 h-5 w-5" />
								Statistics
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">Video ID</span>
								<Badge variant="outline">{video.id}</Badge>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">Slug</span>
								<span className="text-sm font-mono">{video.slug}</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">Status</span>
								{getStatusBadge(video.status)}
							</div>
							<div className="flex justify-between items-center">
								<span className="text-sm text-muted-foreground">User ID</span>
								<Badge variant="outline">{video.user_id}</Badge>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>

			{/* Delete Confirmation Dialog */}
			{deleteDialogOpen && (
				<CustomAlertDialog
					open={deleteDialogOpen}
					onOpenChange={setDeleteDialogOpen}
					alertTitle="Delete Video"
					alertDescription="Are you sure you want to delete this video? This action cannot be undone and all associated data will be permanently removed."
					actionText="Delete"
					cancelText="Cancel"
					varient="destructive"
					action={handleDeleteVideo}
				/>
			)}

			{/* Add Person Dialog */}
			<Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
				<DialogContent className="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Add New Person</DialogTitle>
					</DialogHeader>
					<div className="flex gap-6 min-h-[300px]">
						<div className="flex-shrink-0 w-48">
							<Input
								id="personImage"
								type="file"
								accept="image/*"
								onChange={(e) =>
									setNewPersonForm((prev) => ({
										...prev,
										profileImage: e.target.files[0],
									}))
								}
								className="hidden"
							/>
							<div
								className="w-full h-full min-h-[280px] flex items-center justify-center bg-muted rounded-lg border cursor-pointer hover:bg-muted/80 transition-colors mt-2"
								onClick={() => document.getElementById("personImage").click()}>
								{newPersonForm.profileImage ? (
									<img
										src={URL.createObjectURL(newPersonForm.profileImage)}
										alt="Profile preview"
										className="w-full h-full object-cover rounded-lg"
									/>
								) : (
									<div className="flex flex-col items-center justify-center text-center p-4">
										<Icon
											icon="solar:user-plus-bold"
											className="h-16 w-16 text-muted-foreground mb-3"
										/>
										<span className="text-sm font-medium text-muted-foreground">
											Upload Photo
										</span>
									</div>
								)}
							</div>
						</div>

						<div className="flex-1 space-y-4">
							<div>
								<Label htmlFor="personName">Name *</Label>
								<Input
									id="personName"
									value={newPersonForm.name ?? ""}
									onChange={(e) =>
										setNewPersonForm((prev) => ({
											...prev,
											name: e.target.value,
										}))
									}
									placeholder="Enter person's name"
									className="mt-2"
								/>
							</div>
							<div className="flex-1">
								<Label htmlFor="personBio">Biography</Label>
								<Textarea
									id="personBio"
									value={newPersonForm.biography ?? ""}
									onChange={(e) =>
										setNewPersonForm((prev) => ({
											...prev,
											biography: e.target.value,
										}))
									}
									placeholder="Enter biography (optional)"
									rows={8}
									className="resize-none mt-2 h-[200px]"
								/>
							</div>
						</div>
					</div>
					<DialogFooter className="mt-6">
						<Button
							variant="outline"
							onClick={() => {
								setCreditDialogOpen(false);
								setNewPersonForm({
									name: "",
									biography: "",
									profileImage: null,
								});
							}}>
							Cancel
						</Button>
						<Button
							onClick={handleCreatePerson}
							isLoading={isCreatingPerson}
							loadingText="Creating...">
							Create Person
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
