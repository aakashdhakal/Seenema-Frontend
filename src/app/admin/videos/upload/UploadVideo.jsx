"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import axios from "@/lib/axios";
import CustomAlertDialog from "@/components/singleComponents/CustomAlertDialog";
import CustomSelect from "@/components/singleComponents/CustomSelect";
import ComboBox from "@/components/singleComponents/ComboBox";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { uploadVideo } from "@/lib/helper";

export default function VideoUploadPage() {
	const router = useRouter();

	// States
	const [currentStep, setCurrentStep] = useState(1);
	const [uploadedFile, setUploadedFile] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);
	const [people, setPeople] = useState([]);
	const [availableGenres, setAvailableGenres] = useState([]);
	const [creditDialogOpen, setCreditDialogOpen] = useState(false);
	const [genreInput, setGenreInput] = useState("");
	const [tagInput, setTagInput] = useState("");

	// Form data - store actual File objects for images
	const [formData, setFormData] = useState({
		title: "",
		description: "",
		genres: [],
		tags: [],
		poster: null, // Store actual File object
		backdrop: null, // Store actual File object
		contentRating: "",
		visibility: "public",
		language: "en",
		credits: [],
		releaseYear: new Date().getFullYear(),
		runtime: "",
	});

	// Separate preview states for images
	const [posterPreview, setPosterPreview] = useState(null);
	const [backdropPreview, setBackdropPreview] = useState(null);

	// Credit input - added role field
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

	const roleOptions = [
		{ value: "actor", label: "Actor" },
		{ value: "director", label: "Director" },
		{ value: "producer", label: "Producer" },
		{ value: "writer", label: "Writer" },
		{ value: "cinematographer", label: "Cinematographer" },
		{ value: "editor", label: "Editor" },
		{ value: "composer", label: "Composer" },
		{ value: "other", label: "Other" },
	];

	const steps = [
		{ id: 1, title: "Upload Video", icon: "material-symbols:cloud-upload" },
		{ id: 2, title: "Basic Details", icon: "clarity:details-solid" },
		{ id: 3, title: "Advanced Details", icon: "mdi:account-details-outline" },
		{
			id: 4,
			title: "Review & Publish",
			icon: "icon-park-outline:preview-open",
		},
	];

	// Fetch data
	useEffect(() => {
		const fetchData = async () => {
			try {
				const [peopleRes, genresRes] = await Promise.all([
					axios.get("/getPeople"),
					axios.get("/getGenres"),
				]);
				setPeople(peopleRes.data);
				setAvailableGenres(genresRes.data.map((g) => g.name));
			} catch (error) {
				console.error("Error fetching data:", error);
			}
		};
		fetchData();
	}, []);

	// File upload
	const onDrop = useCallback((acceptedFiles) => {
		const file = acceptedFiles[0];
		if (file) {
			if (file.size > 10 * 1024 * 1024 * 1024) {
				toast.error("File size must be less than 10GB");
				return;
			}

			setUploadedFile(file);
			const videoUrl = URL.createObjectURL(file);
			setPreviewUrl(videoUrl);
			setCurrentStep(2);

			// Extract video metadata
			const video = document.createElement("video");
			video.src = videoUrl;
			video.onloadedmetadata = () => {
				const duration = Math.floor(video.duration);
				const hours = Math.floor(duration / 3600);
				const minutes = Math.floor((duration % 3600) / 60);
				const seconds = duration % 60;

				setFormData((prev) => ({
					...prev,
					runtime:
						hours > 0
							? `${hours}h ${minutes}m ${seconds}s`
							: `${minutes}m ${seconds}s`,
					title: file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " "),
				}));
			};
		}
	}, []);

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: {
			"video/*": [".mp4", ".avi", ".mkv", ".mov", ".wmv", ".flv", ".webm"],
		},
		maxFiles: 1,
	});

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
			toast.error("This person already has this role");
		}
	};

	const removeCredit = (personId) => {
		setFormData((prev) => ({
			...prev,
			credits: prev.credits?.filter((c) => !(c.person_id === personId)) || [],
		}));
	};

	// Create new person
	const handleCreatePerson = async () => {
		if (!newPersonForm.name.trim()) {
			toast.error("Please enter a name");
			return;
		}

		try {
			const personData = new FormData();
			personData.append("name", newPersonForm.name);
			personData.append("biography", newPersonForm.biography);
			if (newPersonForm.profileImage) {
				personData.append("profile_picture", newPersonForm.profileImage);
			}

			const response = await axios.post("/addPerson", personData, {
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
	};

	// FIXED: Image upload handler - stores File object and creates preview
	const handleImageUpload = (field, file) => {
		if (file) {
			// Store the actual File object in formData
			setFormData((prev) => ({
				...prev,
				[field]: file,
			}));

			// Create preview URL and store in separate state
			const previewUrl = URL.createObjectURL(file);
			if (field === "poster") {
				setPosterPreview(previewUrl);
			} else if (field === "backdrop") {
				setBackdropPreview(previewUrl);
			}
		}
	};

	// FIXED: Form submission
	const handleSubmit = async () => {
		// Validation
		if (!uploadedFile) {
			toast.error("Please select a video file");
			return;
		}
		if (!formData.title.trim()) {
			toast.error("Please enter a video title");
			return;
		}
		if (!formData.genres || formData.genres.length === 0) {
			toast.error("Please add at least one genre");
			return;
		}
		if (!formData.poster) {
			toast.error("Please upload a poster image");
			return;
		}
		if (!formData.backdrop) {
			toast.error("Please upload a backdrop image");
			return;
		}

		try {
			const uploadFormData = new FormData();

			// Append files
			uploadFormData.append("video", uploadedFile);
			uploadFormData.append("poster", formData.poster); // File object
			uploadFormData.append("backdrop", formData.backdrop); // File object

			// Append text data
			uploadFormData.append("title", formData.title);
			uploadFormData.append("description", formData.description);
			uploadFormData.append("contentRating", formData.contentRating);
			uploadFormData.append("visibility", formData.visibility);
			uploadFormData.append("language", formData.language);
			uploadFormData.append("credits", JSON.stringify(formData.credits));
			uploadFormData.append("releaseYear", formData.releaseYear);

			const response = await uploadVideo(
				uploadFormData,
				formData.genres,
				formData.tags,
				formData.credits,
			);
			toast.success("Video uploaded successfully!");
			router.push("/admin/videos");
		} catch (error) {
			console.error("Upload error:", error);
			const errorMessage =
				error.response?.data?.message ||
				"Failed to upload video. Please try again.";
			toast.error(errorMessage);
		}
	};

	return (
		<div className="container mx-auto px-4 py-8 max-w-6xl">
			{/* Header */}
			<div className="mb-8">
				<Button variant="ghost" onClick={() => router.back()} className="mb-4">
					<Icon icon="solar:arrow-left-bold" className="mr-2 h-4 w-4" />
					Back to Videos
				</Button>
				<h1 className="text-3xl font-bold">Upload Video</h1>
			</div>

			{/* Progress Steps */}
			<div className="mb-8">
				<div className="flex items-center justify-between">
					{steps.map((step, index) => (
						<div key={step.id} className="flex items-center">
							<div
								className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
									currentStep >= step.id
										? "bg-primary border-primary text-primary-foreground"
										: "border-muted bg-background text-muted-foreground"
								}`}>
								{currentStep > step.id ? (
									<Icon icon="mingcute:check-fill" className="w-5 h-5" />
								) : (
									<Icon icon={step.icon} className="w-5 h-5" />
								)}
							</div>
							<div className="ml-3">
								<p
									className={`text-sm font-medium ${
										currentStep >= step.id
											? "text-foreground"
											: "text-muted-foreground"
									}`}>
									{step.title}
								</p>
							</div>
							{index < steps.length - 1 && (
								<div
									className={`w-24 h-0.5 mx-4 ${
										currentStep > step.id ? "bg-primary" : "bg-muted"
									}`}
								/>
							)}
						</div>
					))}
				</div>
			</div>

			{/* Step 1: File Upload */}
			{currentStep === 1 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center">
							<Icon
								icon="solar:cloud-upload-bold-duotone"
								className="mr-2 h-5 w-5"
							/>
							Select Video File
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div
							{...getRootProps()}
							className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
								isDragActive
									? "border-primary bg-primary/5"
									: "border-muted-foreground/25 hover:border-primary/50"
							}`}>
							<input {...getInputProps()} />
							<Icon
								icon="solar:cloud-upload-bold-duotone"
								className="mx-auto h-12 w-12 text-muted-foreground mb-4"
							/>
							<h3 className="text-lg font-medium mb-2">
								{isDragActive
									? "Drop your video here"
									: "Drag & drop your video here"}
							</h3>
							<p className="text-muted-foreground mb-4">
								or click to browse files
							</p>
							<div className="flex flex-wrap justify-center gap-2 text-sm text-muted-foreground">
								{["MP4", "AVI", "MKV", "MOV", "WMV", "WebM"].map((format) => (
									<Badge key={format} variant="outline">
										{format}
									</Badge>
								))}
							</div>
							<p className="text-xs text-muted-foreground mt-4">
								Maximum file size: 10GB
							</p>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Step 2: Basic Details */}
			{currentStep === 2 && (
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Video Preview */}
					<Card className="lg:col-span-1">
						<CardHeader>
							<CardTitle>Video Preview</CardTitle>
						</CardHeader>
						<CardContent>
							{previewUrl && (
								<div className="space-y-4">
									<video
										src={previewUrl}
										controls
										className="w-full rounded-lg"
										style={{ maxHeight: "200px" }}
									/>
									<div className="text-sm text-muted-foreground">
										<p>File: {uploadedFile?.name}</p>
										<p>
											Size: {(uploadedFile?.size / (1024 * 1024)).toFixed(2)} MB
										</p>
										<p>Duration: {formData.runtime}</p>
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Basic Information */}
					<Card className="lg:col-span-2">
						<CardHeader>
							<CardTitle>Basic Information</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="md:col-span-2 space-y-2">
									<Label htmlFor="title">Title *</Label>
									<Input
										id="title"
										value={formData.title}
										onChange={(e) => handleInputChange("title", e.target.value)}
										placeholder="Enter video title"
									/>
								</div>
								<div className="md:col-span-2 space-y-2">
									<Label htmlFor="description">Description</Label>
									<Textarea
										id="description"
										value={formData.description}
										onChange={(e) =>
											handleInputChange("description", e.target.value)
										}
										placeholder="Describe your video content..."
										rows={5}
										className="resize-none"
									/>
								</div>

								{/* Genres */}
								<div className="md:col-span-2 space-y-2">
									<Label htmlFor="genres">Genres *</Label>
									<div className="flex gap-2 mb-2">
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
										<div className="mb-2">
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
										</div>
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

									{formData.genres.length === 0 && (
										<p className="text-xs text-muted-foreground">
											Please add at least one genre
										</p>
									)}
								</div>

								{/* Release Year, Content Rating, Language */}
								<div className="md:col-span-2 space-y-2">
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
										<div className="space-y-2">
											<Label htmlFor="releaseYear">Release Year</Label>
											<Input
												id="releaseYear"
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
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="contentRating">Content Rating</Label>
											<CustomSelect
												value={formData.contentRating}
												onValueChange={(value) =>
													handleInputChange("contentRating", value)
												}
												options={contentRatings}
												label="Select Content Rating"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="language">Language</Label>
											<CustomSelect
												value={formData.language}
												onValueChange={(value) =>
													handleInputChange("language", value)
												}
												options={languages}
												label="Select Language"
											/>
										</div>
									</div>
								</div>
							</div>

							{/* Tags */}
							<div className="space-y-2">
								<Label htmlFor="tags">Tags</Label>
								<div className="flex gap-2 mb-2">
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

							<div className="flex justify-between">
								<Button variant="outline" onClick={() => setCurrentStep(1)}>
									<Icon icon="solar:arrow-left-bold" className="mr-2 h-4 w-4" />
									Back
								</Button>
								<Button onClick={() => setCurrentStep(3)}>
									Next
									<Icon
										icon="solar:arrow-right-bold"
										className="ml-2 h-4 w-4"
									/>
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>
			)}

			{/* Step 3: Advanced Settings */}
			{currentStep === 3 && (
				<div className="space-y-6">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
						{/* Media Assets */}
						<Card>
							<CardHeader>
								<CardTitle>Media Assets</CardTitle>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									{/* FIXED: Poster Upload */}
									<div className="space-y-2">
										<Label>Poster *</Label>
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
											className="w-full h-72 flex items-center justify-center bg-muted rounded border shadow-md cursor-pointer hover:bg-muted/80 transition-colors"
											style={{ aspectRatio: "2/3" }}
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
													<span className="text-xs text-muted-foreground mt-1">
														Click to select image
													</span>
												</div>
											)}
										</div>
										<p className="text-xs text-muted-foreground">
											Recommended: 2:3 aspect ratio (e.g., 400x600px)
										</p>
									</div>

									{/* FIXED: Backdrop Upload */}
									<div className="space-y-2">
										<Label>Backdrop *</Label>
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
											className="w-full h-40 flex items-center justify-center bg-muted rounded border shadow-md cursor-pointer hover:bg-muted/80 transition-colors"
											style={{ aspectRatio: "16/9" }}
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
													<span className="text-xs text-muted-foreground mt-1">
														Click to select image
													</span>
												</div>
											)}
										</div>
										<p className="text-xs text-muted-foreground">
											Recommended: 16:9 aspect ratio (e.g., 1920x1080px)
										</p>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Cast & Crew */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center justify-between">
									Cast & Crew
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
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="space-y-4 p-4 border rounded-lg bg-muted/30">
									<div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
										<div className="lg:col-span-2 space-y-4">
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
													placeholder="Character name, specific title..."
												/>
											</div>
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
										<div className="lg:col-span-1">
											<div className="w-full h-48 bg-muted rounded-lg border overflow-hidden">
												{creditInput.selectedPerson ? (
													(() => {
														const selectedPerson = people.find(
															(p) =>
																p.id === parseInt(creditInput.selectedPerson),
														);
														return selectedPerson ? (
															<div className="w-full h-full flex flex-col">
																<div className="flex-1 flex items-center justify-center bg-muted">
																	{selectedPerson.profile_picture ? (
																		<img
																			src={selectedPerson.profile_picture}
																			alt={selectedPerson.name}
																			className="w-full h-full object-cover"
																		/>
																	) : (
																		<div className="flex flex-col items-center justify-center text-center p-4">
																			<Icon
																				icon="solar:user-bold"
																				className="h-12 w-12 text-muted-foreground mb-2"
																			/>
																			<span className="text-sm text-muted-foreground">
																				No Photo
																			</span>
																		</div>
																	)}
																</div>
															</div>
														) : null;
													})()
												) : (
													<div className="w-full h-full flex items-center justify-center">
														<div className="text-center">
															<Icon
																icon="solar:user-plus-bold"
																className="h-12 w-12 text-muted-foreground mb-2 mx-auto"
															/>
															<span className="text-sm text-muted-foreground">
																Select a person to preview
															</span>
														</div>
													</div>
												)}
											</div>
										</div>
									</div>
								</div>

								{formData.credits && formData.credits.length > 0 && (
									<div>
										<Label className="text-sm font-medium">Added Credits</Label>
										<div className="mt-2 flex flex-wrap gap-2">
											{formData.credits.map((credit, index) => (
												<Badge
													key={`${credit.person_id}`}
													variant="secondary"
													className="flex items-center gap-1">
													<span className="font-medium">
														{credit.person_name}
														{credit.credited_as && ` (${credit.credited_as})`}
													</span>
													<Button
														variant="ghost"
														className="p-0 h-6 w-6"
														onClick={() => removeCredit(credit.person_id)}>
														<Icon
															icon="akar-icons:cross"
															className="h-2 w-2 text-muted-foreground"
														/>
													</Button>
												</Badge>
											))}
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					</div>

					{/* Privacy & Settings */}
					<Card>
						<CardHeader>
							<CardTitle>Privacy & Settings</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								<Label htmlFor="visibility">Visibility</Label>
								<CustomSelect
									id="visibility"
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
						</CardContent>
					</Card>

					<div className="flex justify-between">
						<Button variant="outline" onClick={() => setCurrentStep(2)}>
							<Icon icon="solar:arrow-left-bold" className="mr-2 h-4 w-4" />
							Back
						</Button>
						<Button onClick={() => setCurrentStep(4)}>
							Next
							<Icon icon="solar:arrow-right-bold" className="ml-2 h-4 w-4" />
						</Button>
					</div>
				</div>
			)}

			{/* Step 4: Review & Publish */}
			{currentStep === 4 && (
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>Review & Publish</CardTitle>
							<p className="text-muted-foreground">
								Confirm your video details before publishing
							</p>
						</CardHeader>
						<CardContent className="space-y-8">
							{/* Basic Information */}
							<div>
								<h3 className="text-lg font-semibold mb-4 flex items-center">
									<Icon
										icon="solar:document-text-bold"
										className="h-5 w-5 mr-2"
									/>
									Basic Information
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
									<div>
										<Label className="text-sm font-medium text-muted-foreground">
											Title
										</Label>
										<p className="text-sm mt-1">{formData.title}</p>
									</div>
									<div>
										<Label className="text-sm font-medium text-muted-foreground">
											Genres
										</Label>
										<div className="flex flex-wrap gap-1 mt-1">
											{formData.genres.map((genreName, index) => (
												<Badge
													key={index}
													variant="outline"
													className="text-xs">
													{genreName}
												</Badge>
											))}
										</div>
									</div>
									<div>
										<Label className="text-sm font-medium text-muted-foreground">
											Language
										</Label>
										<p className="text-sm mt-1">
											{
												languages.find((l) => l.value === formData.language)
													?.label
											}
										</p>
									</div>
									<div>
										<Label className="text-sm font-medium text-muted-foreground">
											Content Rating
										</Label>
										<p className="text-sm mt-1">
											{formData.contentRating || "Not specified"}
										</p>
									</div>
									<div>
										<Label className="text-sm font-medium text-muted-foreground">
											Release Year
										</Label>
										<p className="text-sm mt-1">{formData.releaseYear}</p>
									</div>
									<div>
										<Label className="text-sm font-medium text-muted-foreground">
											Visibility
										</Label>
										<p className="text-sm mt-1 capitalize">
											{formData.visibility}
										</p>
									</div>
									{formData.description && (
										<div className="md:col-span-2">
											<Label className="text-sm font-medium text-muted-foreground">
												Description
											</Label>
											<p className="text-sm mt-1 line-clamp-3">
												{formData.description}
											</p>
										</div>
									)}
								</div>
							</div>

							{/* Media Assets */}
							<div>
								<h3 className="text-lg font-semibold mb-4 flex items-center">
									<Icon icon="solar:gallery-bold" className="h-5 w-5 mr-2" />
									Media Assets
								</h3>
								<div className="flex gap-6 p-4 bg-muted/30 rounded-lg">
									{posterPreview && (
										<div className="text-center">
											<Label className="text-sm font-medium text-muted-foreground">
												Poster
											</Label>
											<img
												src={posterPreview}
												alt="Poster"
												className="w-20 h-30 object-cover rounded mt-2"
												style={{ aspectRatio: "2/3" }}
											/>
										</div>
									)}
									{backdropPreview && (
										<div className="text-center">
											<Label className="text-sm font-medium text-muted-foreground">
												Backdrop
											</Label>
											<img
												src={backdropPreview}
												alt="Backdrop"
												className="w-28 h-16 object-cover rounded mt-2"
												style={{ aspectRatio: "16/9" }}
											/>
										</div>
									)}
									{!posterPreview && !backdropPreview && (
										<p className="text-sm text-muted-foreground">
											No media assets uploaded
										</p>
									)}
								</div>
							</div>

							{/* Tags */}
							{formData.tags.length > 0 && (
								<div>
									<h3 className="text-lg font-semibold mb-4 flex items-center">
										<Icon icon="solar:tag-bold" className="h-5 w-5 mr-2" />
										Tags
									</h3>
									<div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg">
										{formData.tags.map((tagName, index) => (
											<Badge key={index} variant="secondary">
												{tagName}
											</Badge>
										))}
									</div>
								</div>
							)}

							{/* Cast & Crew */}
							{formData.credits && formData.credits.length > 0 && (
								<div>
									<h3 className="text-lg font-semibold mb-4 flex items-center">
										<Icon
											icon="solar:users-group-two-rounded-bold"
											className="h-5 w-5 mr-2"
										/>
										Cast & Crew
									</h3>
									<div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg">
										{formData.credits.map((credit, index) => (
											<Badge key={index} variant="outline" className="text-xs">
												{credit.person_name}
												{credit.credited_as && ` (${credit.credited_as})`}
											</Badge>
										))}
									</div>
								</div>
							)}

							{/* File Information */}
							{uploadedFile && (
								<div>
									<h3 className="text-lg font-semibold mb-4 flex items-center">
										<Icon icon="solar:file-bold" className="h-5 w-5 mr-2" />
										File Information
									</h3>
									<div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
										<div>
											<Label className="text-sm font-medium text-muted-foreground">
												File Name
											</Label>
											<p className="text-sm mt-1 truncate">
												{uploadedFile.name}
											</p>
										</div>
										<div>
											<Label className="text-sm font-medium text-muted-foreground">
												File Size
											</Label>
											<p className="text-sm mt-1">
												{(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
											</p>
										</div>
										<div>
											<Label className="text-sm font-medium text-muted-foreground">
												Duration
											</Label>
											<p className="text-sm mt-1">
												{formData.runtime || "Processing..."}
											</p>
										</div>
									</div>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Action Buttons */}
					<div className="flex justify-between">
						<Button variant="outline" onClick={() => setCurrentStep(3)}>
							<Icon icon="solar:arrow-left-bold" className="mr-2 h-4 w-4" />
							Back
						</Button>
						<div className="flex gap-2">
							<CustomAlertDialog
								trigger={
									<Button variant="destructive">
										<Icon icon="solar:trash-bold" className="mr-2 h-4 w-4" />
										Cancel Upload
									</Button>
								}
								title="Cancel Upload"
								description="Are you sure you want to cancel this upload? All progress will be lost."
								onConfirm={() => {
									toast.success("Upload cancelled");
									router.push("/admin/videos");
								}}
							/>
							<Button onClick={handleSubmit} className="min-w-[140px]"></Button>
						</div>
					</div>
				</div>
			)}

			{/* Add Person Dialog */}
			<Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
				<DialogContent className="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Add New Person</DialogTitle>
					</DialogHeader>
					<div className="flex gap-6 min-h-[300px]">
						{/* Profile Image */}
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
										<span className="text-xs text-muted-foreground mt-1">
											Click to select image
										</span>
									</div>
								)}
							</div>
						</div>

						{/* Form Fields */}
						<div className="flex-1 space-y-4">
							<div>
								<Label htmlFor="personName" className="text-sm font-medium">
									Name *
								</Label>
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
								<Label htmlFor="personBio" className="text-sm font-medium">
									Biography
								</Label>
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
						<Button onClick={handleCreatePerson}>Create Person</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
