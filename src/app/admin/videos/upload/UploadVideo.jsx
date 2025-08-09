"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
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
import { Progress } from "@/components/ui/progress";

// Constants
const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024; // 10GB
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_VIDEO_FORMATS = {
	"video/*": [".mp4", ".avi", ".mkv", ".mov", ".wmv", ".flv", ".webm"],
};

// Static data
const CONTENT_RATINGS = [
	{ value: "G", label: "G - General Audiences" },
	{ value: "PG", label: "PG - Parental Guidance" },
	{ value: "PG-13", label: "PG-13 - Parents Strongly Cautioned" },
	{ value: "R", label: "R - Restricted" },
	{ value: "NC-17", label: "NC-17 - Adults Only" },
];

const LANGUAGES = [
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
	{ value: "np", label: "Nepali" },
];

const STEPS = [
	{ id: 1, title: "Upload Video", icon: "material-symbols:cloud-upload" },
	{ id: 2, title: "Basic Details", icon: "clarity:details-solid" },
	{ id: 3, title: "Advanced Details", icon: "mdi:account-details-outline" },
	{ id: 4, title: "Review & Publish", icon: "icon-park-outline:preview-open" },
];

// Initial form state
const INITIAL_FORM_DATA = {
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
	runtime: "",
	subtitle: null,
};

const INITIAL_CREDIT_INPUT = {
	selectedPerson: "",
	creditedAs: "",
};

const INITIAL_NEW_PERSON_FORM = {
	name: "",
	biography: "",
	profileImage: null,
};

export default function VideoUploadPage() {
	const router = useRouter();

	// Core states
	const [currentStep, setCurrentStep] = useState(1);
	const [uploadedFile, setUploadedFile] = useState(null);
	const [previewUrl, setPreviewUrl] = useState(null);
	const [uploading, setUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);

	// Data states
	const [people, setPeople] = useState([]);
	const [availableGenres, setAvailableGenres] = useState([]);
	const [formData, setFormData] = useState(INITIAL_FORM_DATA);

	// UI states
	const [creditDialogOpen, setCreditDialogOpen] = useState(false);
	const [genreInput, setGenreInput] = useState("");
	const [tagInput, setTagInput] = useState("");
	const [isCreatingPerson, setIsCreatingPerson] = useState(false);

	// Input states
	const [creditInput, setCreditInput] = useState(INITIAL_CREDIT_INPUT);
	const [newPersonForm, setNewPersonForm] = useState(INITIAL_NEW_PERSON_FORM);

	// Preview states
	const [posterPreview, setPosterPreview] = useState(null);
	const [backdropPreview, setBackdropPreview] = useState(null);

	// Memoized values for performance
	const availableGenreOptions = useMemo(
		() =>
			availableGenres
				.filter((genreName) => !formData.genres.includes(genreName))
				.map((genreName) => ({
					value: genreName,
					label: genreName,
				})),
		[availableGenres, formData.genres],
	);

	const peopleOptions = useMemo(
		() =>
			people.map((person) => ({
				value: person.id,
				label: person.name,
			})),
		[people],
	);

	const selectedPerson = useMemo(
		() => people.find((p) => p.id === parseInt(creditInput.selectedPerson)),
		[people, creditInput.selectedPerson],
	);

	/**
	 * Fetch initial data on component mount
	 */
	useEffect(() => {
		const fetchInitialData = async () => {
			try {
				const [peopleResponse, genresResponse] = await Promise.all([
					axios.get("/people/get"),
					axios.get("/genre/get"),
				]);

				setPeople(peopleResponse.data);
				setAvailableGenres(genresResponse.data.map((genre) => genre.name));
			} catch (error) {
				console.error("Error fetching initial data:", error);
				toast.error("Failed to load initial data. Please refresh the page.");
			}
		};

		fetchInitialData();
	}, []);

	/**
	 * Clean up object URLs on component unmount
	 */
	useEffect(() => {
		return () => {
			if (previewUrl) {
				URL.revokeObjectURL(previewUrl);
			}
			if (posterPreview) {
				URL.revokeObjectURL(posterPreview);
			}
			if (backdropPreview) {
				URL.revokeObjectURL(backdropPreview);
			}
		};
	}, [previewUrl, posterPreview, backdropPreview]);

	/**
	 * Format video duration from seconds to readable format
	 */
	const formatDuration = (durationInSeconds) => {
		const duration = Math.floor(durationInSeconds);
		const hours = Math.floor(duration / 3600);
		const minutes = Math.floor((duration % 3600) / 60);
		const seconds = duration % 60;

		return hours > 0
			? `${hours}h ${minutes}m ${seconds}s`
			: `${minutes}m ${seconds}s`;
	};

	/**
	 * Extract filename without extension and format it
	 */
	const formatFileName = (fileName) => {
		return fileName.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
	};

	/**
	 * Handle file drop for video upload
	 */
	const onDrop = useCallback((acceptedFiles) => {
		const file = acceptedFiles[0];
		if (!file) return;

		// Validate file size
		if (file.size > MAX_FILE_SIZE) {
			toast.error("File size must be less than 10GB");
			return;
		}

		// Set file and create preview
		setUploadedFile(file);
		const videoUrl = URL.createObjectURL(file);
		setPreviewUrl(videoUrl);
		setCurrentStep(2);

		// Extract video metadata
		const video = document.createElement("video");
		video.src = videoUrl;
		video.onloadedmetadata = () => {
			const formattedDuration = formatDuration(video.duration);
			const formattedTitle = formatFileName(file.name);

			setFormData((prev) => ({
				...prev,
				runtime: formattedDuration,
				title: formattedTitle,
			}));
		};

		// Handle video loading errors
		video.onerror = () => {
			console.error("Error loading video metadata");
			toast.error("Error reading video file. Please try another file.");
		};
	}, []);

	/**
	 * Dropzone configuration
	 */
	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept: ACCEPTED_VIDEO_FORMATS,
		maxFiles: 1,
	});

	/**
	 * Generic form input handler
	 */
	const handleInputChange = useCallback((field, value) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
	}, []);

	/**
	 * Add genre to form data
	 */
	const addGenre = useCallback(
		(genreValue) => {
			const genreName =
				typeof genreValue === "string" ? genreValue.trim() : null;

			if (!genreName) {
				toast.error("Please enter a valid genre name");
				return;
			}

			if (formData.genres.includes(genreName)) {
				toast.error("This genre is already added");
				return;
			}

			setFormData((prev) => ({
				...prev,
				genres: [...prev.genres, genreName],
			}));
			setGenreInput("");
		},
		[formData.genres],
	);

	/**
	 * Remove genre from form data
	 */
	const removeGenre = useCallback((genreToRemove) => {
		setFormData((prev) => ({
			...prev,
			genres: prev.genres.filter((genre) => genre !== genreToRemove),
		}));
	}, []);

	/**
	 * Add tag to form data
	 */
	const addTag = useCallback(() => {
		const trimmedTag = tagInput.trim();

		if (!trimmedTag) {
			toast.error("Please enter a valid tag");
			return;
		}

		if (formData.tags.includes(trimmedTag)) {
			toast.error("This tag is already added");
			return;
		}

		setFormData((prev) => ({
			...prev,
			tags: [...prev.tags, trimmedTag],
		}));
		setTagInput("");
	}, [tagInput, formData.tags]);

	/**
	 * Remove tag from form data
	 */
	const removeTag = useCallback((tagToRemove) => {
		setFormData((prev) => ({
			...prev,
			tags: prev.tags.filter((tag) => tag !== tagToRemove),
		}));
	}, []);

	/**
	 * Add credit (person) to form data
	 */
	const handleAddCredit = useCallback(() => {
		if (!creditInput.selectedPerson) {
			toast.error("Please select a person");
			return;
		}

		const person = people.find(
			(p) => p.id === parseInt(creditInput.selectedPerson),
		);
		if (!person) {
			toast.error("Selected person not found");
			return;
		}

		// Check for existing credit
		const existingCredit = formData.credits?.find(
			(credit) => credit.person_id === parseInt(creditInput.selectedPerson),
		);

		if (existingCredit) {
			toast.error("This person is already added to credits");
			return;
		}

		const newCredit = {
			person_id: parseInt(creditInput.selectedPerson),
			person_name: person.name,
			credited_as: creditInput.creditedAs,
		};

		setFormData((prev) => ({
			...prev,
			credits: [...(prev.credits || []), newCredit],
		}));

		setCreditInput(INITIAL_CREDIT_INPUT);
		toast.success(`${person.name} added to credits`);
	}, [creditInput, people, formData.credits]);

	/**
	 * Remove credit from form data
	 */
	const removeCredit = useCallback((personId) => {
		setFormData((prev) => ({
			...prev,
			credits:
				prev.credits?.filter((credit) => credit.person_id !== personId) || [],
		}));
	}, []);

	/**
	 * Create new person and add to people list
	 */
	const handleCreatePerson = async () => {
		if (!newPersonForm.name.trim()) {
			toast.error("Please enter a person's name");
			return;
		}

		setIsCreatingPerson(true);

		try {
			const personData = new FormData();
			personData.append("name", newPersonForm.name.trim());
			personData.append("biography", newPersonForm.biography.trim());

			if (newPersonForm.profileImage) {
				personData.append("profile_picture", newPersonForm.profileImage);
			}

			const response = await axios.post("/people/create", personData);
			const newPerson = response.data;

			// Update people list and select the new person
			setPeople((prev) => [...prev, newPerson]);
			setCreditInput((prev) => ({
				...prev,
				selectedPerson: newPerson.id.toString(),
			}));

			// Reset form and close dialog
			setNewPersonForm(INITIAL_NEW_PERSON_FORM);
			setCreditDialogOpen(false);

			toast.success("Person added successfully!");
		} catch (error) {
			console.error("Error creating person:", error);
			const errorMessage =
				error.response?.data?.message || "Failed to create person";
			toast.error(errorMessage);
		} finally {
			setIsCreatingPerson(false);
		}
	};

	/**
	 * Handle image upload (poster, backdrop, profile)
	 */
	const handleImageUpload = useCallback((field, file) => {
		if (!file) return;

		// Validate file type
		if (!file.type.startsWith("image/")) {
			toast.error("Please select a valid image file");
			return;
		}

		setFormData((prev) => ({ ...prev, [field]: file }));

		const previewUrl = URL.createObjectURL(file);
		if (field === "poster") {
			setPosterPreview(previewUrl);
		} else if (field === "backdrop") {
			setBackdropPreview(previewUrl);
		}
	}, []);

	/**
	 * Validate form data before submission
	 */
	const validateFormData = () => {
		const requiredFields = [
			{ field: uploadedFile, message: "Please upload a video file" },
			{ field: formData.title.trim(), message: "Please enter a video title" },
			{ field: formData.poster, message: "Please upload a poster image" },
			{ field: formData.backdrop, message: "Please upload a backdrop image" },
			{
				field: formData.genres.length > 0,
				message: "Please add at least one genre",
			},
		];

		for (const { field, message } of requiredFields) {
			if (!field) {
				toast.error(message);
				return false;
			}
		}

		return true;
	};

	/**
	 * Upload video file in chunks with progress tracking
	 */
	const uploadVideoInChunks = async (videoId, file) => {
		const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

		for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
			const start = chunkIndex * CHUNK_SIZE;
			const end = Math.min(start + CHUNK_SIZE, file.size);
			const chunk = file.slice(start, end);

			const chunkFormData = new FormData();
			chunkFormData.append("video_id", videoId);
			chunkFormData.append("chunk", chunk, file.name);
			chunkFormData.append("is_last", chunkIndex === totalChunks - 1);

			try {
				await axios.post("/video/chunk/upload", chunkFormData);
				const progress = Math.round((end / file.size) * 100);
				setUploadProgress(progress);
			} catch (error) {
				throw new Error(
					`Failed to upload chunk ${chunkIndex + 1}/${totalChunks}`,
				);
			}
		}
	};

	/**
	 * Add related data (genres, tags, credits) to video
	 */
	const addRelatedData = async (videoId) => {
		const promises = [];

		if (formData.genres.length > 0) {
			promises.push(
				axios.post("/genre/add", {
					videoId,
					genres: formData.genres,
				}),
			);
		}

		if (formData.tags.length > 0) {
			promises.push(
				axios.post("/tags/add", {
					videoId,
					tags: formData.tags,
				}),
			);
		}

		if (formData.credits.length > 0) {
			promises.push(
				axios.post("/people/add-credit", {
					videoId,
					credits: formData.credits,
				}),
			);
		}

		await Promise.all(promises);
	};

	/**
	 * Main form submission handler
	 */
	const handleSubmit = async () => {
		// Validate form data
		if (!validateFormData()) return;

		setUploading(true);
		setUploadProgress(0);

		try {
			// Step 1: Create video entry with metadata
			const metadataFormData = new FormData();
			metadataFormData.append("title", formData.title.trim());
			metadataFormData.append("description", formData.description.trim());
			metadataFormData.append("poster", formData.poster);
			metadataFormData.append("backdrop", formData.backdrop);
			metadataFormData.append("original_filename", uploadedFile.name);
			metadataFormData.append("releaseYear", formData.releaseYear.toString());
			metadataFormData.append("contentRating", formData.contentRating);
			metadataFormData.append("visibility", formData.visibility);
			metadataFormData.append("language", formData.language);

			if (formData.subtitle) {
				metadataFormData.append("subtitle", formData.subtitle);
			}

			const createResponse = await axios.post(
				"/video/create",
				metadataFormData,
			);
			const { video_id } = createResponse.data;

			// Step 2: Upload video file in chunks
			await uploadVideoInChunks(video_id, uploadedFile);

			// Step 3: Add related data (genres, tags, credits)
			await addRelatedData(video_id);

			toast.success("Upload complete! Your video is now being processed.");
			router.push("/admin/videos");
		} catch (error) {
			console.error("Upload error:", error);
			const errorMessage =
				error.response?.data?.message || "An error occurred during upload";
			toast.error(errorMessage);
		} finally {
			setUploading(false);
			setUploadProgress(0);
		}
	};

	/**
	 * Handle step navigation with validation
	 */
	const goToStep = useCallback(
		(step) => {
			if (step < 1 || step > 4) return;

			// Add validation for specific steps if needed
			if (step === 2 && !uploadedFile) {
				toast.error("Please upload a video first");
				return;
			}

			setCurrentStep(step);
		},
		[uploadedFile],
	);

	/**
	 * Reset form to initial state
	 */
	const resetForm = useCallback(() => {
		setFormData(INITIAL_FORM_DATA);
		setCreditInput(INITIAL_CREDIT_INPUT);
		setNewPersonForm(INITIAL_NEW_PERSON_FORM);
		setGenreInput("");
		setTagInput("");
		setCurrentStep(1);
		setUploadedFile(null);
		setPreviewUrl(null);
		setPosterPreview(null);
		setBackdropPreview(null);
		setUploadProgress(0);
	}, []);

	/**
	 * Handle genre input key press
	 */
	const handleGenreKeyPress = useCallback(
		(event) => {
			if (event.key === "Enter") {
				event.preventDefault();
				if (genreInput.trim()) {
					addGenre(genreInput.trim());
				}
			}
		},
		[genreInput, addGenre],
	);

	/**
	 * Handle tag input key press
	 */
	const handleTagKeyPress = useCallback(
		(event) => {
			if (event.key === "Enter") {
				event.preventDefault();
				addTag();
			}
		},
		[addTag],
	);

	/**
	 * Handle subtitle file removal
	 */
	const removeSubtitle = useCallback((event) => {
		event.stopPropagation();
		setFormData((prev) => ({ ...prev, subtitle: null }));
	}, []);

	return (
		<div className="container mx-auto px-4 py-8 max-w-6xl">
			{/* Header Section */}
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
					{STEPS.map((step, index) => (
						<div key={step.id} className="flex items-center">
							<div
								className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
									currentStep >= step.id
										? "bg-primary border-primary text-primary-foreground"
										: "border bg-background text-muted-foreground"
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
							{index < STEPS.length - 1 && (
								<div
									className={`w-24 h-0.5 mx-4 ${
										currentStep > step.id ? "bg-primary" : "bg-border"
									}`}
								/>
							)}
						</div>
					))}
				</div>
			</div>

			{/* Upload Progress Overlay */}
			{uploading && (
				<div className="fixed inset-0 bg-black/60 z-50 flex flex-col items-center justify-center">
					<div className="bg-card p-8 rounded-lg shadow-xl w-full max-w-md text-center">
						<h2 className="text-2xl font-bold mb-4 text-foreground">
							Uploading Video
						</h2>
						<p className="text-muted-foreground mb-6">
							Please wait while we upload your file. Do not close this window.
						</p>
						<Progress value={uploadProgress} className="w-full" />
						<p className="text-lg font-semibold mt-4 text-primary">
							{uploadProgress}%
						</p>
					</div>
				</div>
			)}

			{/* Step 1: File Upload */}
			{currentStep === 1 && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center">
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
								icon="streamline:insert-cloud-video-solid"
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
								{/* Title */}
								<div className="md:col-span-2 space-y-2">
									<Label htmlFor="title">Title *</Label>
									<Input
										id="title"
										value={formData.title}
										onChange={(e) => handleInputChange("title", e.target.value)}
										placeholder="Enter video title"
									/>
								</div>

								{/* Description */}
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

									{/* Genre Input */}
									<div className="flex gap-2 mb-2">
										<Input
											value={genreInput}
											onChange={(e) => setGenreInput(e.target.value)}
											placeholder="Type genre name..."
											onKeyPress={handleGenreKeyPress}
											className="flex-1"
										/>
										<Button
											onClick={() => addGenre(genreInput.trim())}
											variant="outline"
											disabled={!genreInput.trim()}>
											<Icon icon="mingcute:add-fill" className="h-4 w-4" />
										</Button>
									</div>

									{/* Existing Genres Dropdown */}
									{availableGenreOptions.length > 0 && (
										<div className="mb-2">
											<ComboBox
												items={availableGenreOptions}
												value=""
												onValueChange={(value) => addGenre(value)}
												placeholder="Or select from existing genres..."
												searchPlaceholder="Search existing genres"
												emptyMessage="No existing genres found"
												className="w-full"
											/>
										</div>
									)}

									{/* Selected Genres */}
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
														parseInt(e.target.value) ||
															new Date().getFullYear(),
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
												options={CONTENT_RATINGS}
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
												options={LANGUAGES}
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
										onKeyPress={handleTagKeyPress}
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

							{/* Navigation */}
							<div className="flex justify-between">
								<Button variant="outline" onClick={() => goToStep(1)}>
									<Icon icon="solar:arrow-left-bold" className="mr-2 h-4 w-4" />
									Back
								</Button>
								<Button onClick={() => goToStep(3)}>
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
									{/* Poster Upload */}
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
														icon="majesticons:image-plus"
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

									{/* Backdrop & Subtitle Upload */}
									<div className="space-y-4">
										{/* Backdrop Upload */}
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
															icon="majesticons:image-plus"
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

										{/* Subtitle Upload */}
										<div className="space-y-2">
											<Label>Subtitle (optional)</Label>
											<Input
												id="subtitle"
												type="file"
												accept=".srt,.vtt"
												onChange={(e) =>
													setFormData((prev) => ({
														...prev,
														subtitle: e.target.files[0],
													}))
												}
												className="hidden"
											/>
											<div
												className="w-full h-12 flex items-center justify-center bg-muted rounded border shadow-md cursor-pointer hover:bg-muted/80 transition-colors"
												onClick={() =>
													document.getElementById("subtitle").click()
												}>
												{formData.subtitle ? (
													<div className="flex items-center gap-2 w-full justify-between px-4">
														<span className="text-sm text-foreground truncate">
															{formData.subtitle.name}
														</span>
														<Button
															variant="ghost"
															size="icon"
															className="h-6 w-6"
															onClick={removeSubtitle}
															title="Remove subtitle"
															tabIndex={-1}>
															<Icon
																icon="akar-icons:cross"
																className="h-4 w-4 text-muted-foreground"
															/>
														</Button>
													</div>
												) : (
													<div className="flex items-center gap-2 text-muted-foreground">
														<Icon
															icon="ic:baseline-subtitles"
															className="h-5 w-5"
														/>
														<span className="text-sm font-medium">
															Upload Subtitle (.srt, .vtt)
														</span>
													</div>
												)}
											</div>
											<p className="text-xs text-muted-foreground">
												Optional: Upload subtitle file (.srt or .vtt)
											</p>
										</div>
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
								{/* Add Credit Form */}
								<div className="space-y-4 p-4 border rounded-lg bg-muted/30">
									<div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
										<div className="lg:col-span-2 space-y-4">
											{/* Person Selection */}
											<div className="space-y-2">
												<Label>Select Person</Label>
												<ComboBox
													items={peopleOptions}
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

											{/* Credited As */}
											<div className="space-y-2">
												<Label htmlFor="creditedAs">Credited As</Label>
												<Input
													id="creditedAs"
													value={creditInput.creditedAs}
													onChange={(e) =>
														setCreditInput((prev) => ({
															...prev,
															creditedAs: e.target.value,
														}))
													}
													placeholder="Character name, specific title..."
												/>
											</div>

											{/* Add Credit Button */}
											<Button
												onClick={handleAddCredit}
												className="w-full"
												variant="outline"
												disabled={!creditInput.selectedPerson}>
												<Icon
													icon="mingcute:add-fill"
													className="h-4 w-4 mr-2"
												/>
												Add Credit
											</Button>
										</div>

										{/* Person Preview */}
										<div className="lg:col-span-1">
											<div className="w-full h-48 bg-muted rounded-lg border overflow-hidden">
												{selectedPerson ? (
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

								{/* Added Credits List */}
								{formData.credits && formData.credits.length > 0 && (
									<div>
										<Label className="text-sm font-medium">Added Credits</Label>
										<div className="mt-2 flex flex-wrap gap-2">
											{formData.credits.map((credit) => (
												<Badge
													key={credit.person_id}
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

					{/* Navigation */}
					<div className="flex justify-between">
						<Button variant="outline" onClick={() => goToStep(2)}>
							<Icon icon="solar:arrow-left-bold" className="mr-2 h-4 w-4" />
							Back
						</Button>
						<Button onClick={() => goToStep(4)}>
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
							{/* Basic Information Review */}
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
												LANGUAGES.find((l) => l.value === formData.language)
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

							{/* Media Assets Review */}
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
									{formData.subtitle && (
										<div className="text-center">
											<Label className="text-sm font-medium text-muted-foreground">
												Subtitle
											</Label>
											<div className="flex items-center gap-2 mt-2 p-2 bg-muted rounded">
												<Icon
													icon="ic:baseline-subtitles"
													className="h-4 w-4"
												/>
												<span className="text-xs truncate">
													{formData.subtitle.name}
												</span>
											</div>
										</div>
									)}
									{!posterPreview && !backdropPreview && !formData.subtitle && (
										<p className="text-sm text-muted-foreground">
											No media assets uploaded
										</p>
									)}
								</div>
							</div>

							{/* Tags Review */}
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

							{/* Cast & Crew Review */}
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
										{formData.credits.map((credit) => (
											<Badge
												key={credit.person_id}
												variant="outline"
												className="text-xs">
												{credit.person_name}
												{credit.credited_as && ` (${credit.credited_as})`}
											</Badge>
										))}
									</div>
								</div>
							)}

							{/* File Information Review */}
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

					{/* Final Action Buttons */}
					<div className="flex justify-between">
						<Button variant="outline" onClick={() => goToStep(3)}>
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
									resetForm();
									toast.success("Upload cancelled");
									router.push("/admin/videos");
								}}
							/>
							<Button
								onClick={handleSubmit}
								className="min-w-[160px]"
								disabled={uploading}>
								{uploading ? (
									<div className="flex items-center">
										<Icon
											icon="svg-spinners:180-ring-with-bg"
											className="mr-2 h-4 w-4"
										/>
										<span>Uploading...</span>
									</div>
								) : (
									<>
										<Icon
											icon="solar:upload-bold-duotone"
											className="mr-2 h-4 w-4"
										/>
										Upload & Publish
									</>
								)}
							</Button>
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
						{/* Profile Image Upload */}
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
							{/* Name Input */}
							<div>
								<Label htmlFor="personName" className="text-sm font-medium">
									Name *
								</Label>
								<Input
									id="personName"
									value={newPersonForm.name}
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

							{/* Biography Input */}
							<div className="flex-1">
								<Label htmlFor="personBio" className="text-sm font-medium">
									Biography
								</Label>
								<Textarea
									id="personBio"
									value={newPersonForm.biography}
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

					{/* Dialog Footer */}
					<DialogFooter className="mt-6">
						<Button
							variant="outline"
							onClick={() => {
								setCreditDialogOpen(false);
								setNewPersonForm(INITIAL_NEW_PERSON_FORM);
							}}>
							Cancel
						</Button>
						<Button
							onClick={handleCreatePerson}
							disabled={isCreatingPerson || !newPersonForm.name.trim()}>
							{isCreatingPerson ? (
								<div className="flex items-center">
									<Icon
										icon="svg-spinners:180-ring-with-bg"
										className="mr-2 h-4 w-4"
									/>
									<span>Creating...</span>
								</div>
							) : (
								"Create Person"
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
