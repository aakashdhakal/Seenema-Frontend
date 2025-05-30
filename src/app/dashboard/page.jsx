"use client";
import { useState, useRef } from "react";
import { Icon } from "@iconify/react";

export default function DashboardPage() {
	const [selectedFile, setSelectedFile] = useState(null);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [isUploading, setIsUploading] = useState(false);
	const [uploadStatus, setUploadStatus] = useState(""); // success, error, or empty
	const [videoDetails, setVideoDetails] = useState({
		title: "",
		description: "",
		category: "",
		tags: "",
		thumbnail: null,
	});
	const [dragActive, setDragActive] = useState(false);

	const fileInputRef = useRef(null);
	const thumbnailInputRef = useRef(null);

	const categories = [
		"Entertainment",
		"Education",
		"Gaming",
		"Music",
		"Sports",
		"Technology",
		"Travel",
		"Comedy",
		"Documentary",
		"Other",
	];

	const handleDrag = (e) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	};

	const handleDrop = (e) => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			const file = e.dataTransfer.files[0];
			if (file.type.startsWith("video/")) {
				setSelectedFile(file);
			} else {
				alert("Please select a valid video file");
			}
		}
	};

	const handleFileSelect = (e) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];
			if (file.type.startsWith("video/")) {
				setSelectedFile(file);
			} else {
				alert("Please select a valid video file");
			}
		}
	};

	const handleThumbnailSelect = (e) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];
			if (file.type.startsWith("image/")) {
				setVideoDetails((prev) => ({ ...prev, thumbnail: file }));
			} else {
				alert("Please select a valid image file");
			}
		}
	};

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setVideoDetails((prev) => ({ ...prev, [name]: value }));
	};

	const simulateUpload = () => {
		setIsUploading(true);
		setUploadProgress(0);
		setUploadStatus("");

		const interval = setInterval(() => {
			setUploadProgress((prev) => {
				if (prev >= 100) {
					clearInterval(interval);
					setIsUploading(false);
					setUploadStatus("success");
					// Reset form after successful upload
					setTimeout(() => {
						setSelectedFile(null);
						setVideoDetails({
							title: "",
							description: "",
							category: "",
							tags: "",
							thumbnail: null,
						});
						setUploadProgress(0);
						setUploadStatus("");
					}, 2000);
					return 100;
				}
				return prev + Math.random() * 15;
			});
		}, 200);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!selectedFile) {
			alert("Please select a video file");
			return;
		}

		if (!videoDetails.title.trim()) {
			alert("Please enter a video title");
			return;
		}

		// In a real implementation, you would upload to your server
		// const formData = new FormData();
		// formData.append('video', selectedFile);
		// formData.append('thumbnail', videoDetails.thumbnail);
		// formData.append('title', videoDetails.title);
		// formData.append('description', videoDetails.description);
		// formData.append('category', videoDetails.category);
		// formData.append('tags', videoDetails.tags);

		// For demo purposes, we'll simulate the upload
		simulateUpload();
	};

	const formatFileSize = (bytes) => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	const formatDuration = (seconds) => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs < 10 ? "0" + secs : secs}`;
	};

	return (
		<div className="min-h-screen bg-gray-100 py-8">
			<div className="max-w-4xl mx-auto px-4">
				<div className="bg-white rounded-lg shadow-lg p-6">
					<h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center">
						<Icon icon="mdi:video-plus" className="mr-3 text-blue-600" />
						Upload Video
					</h1>

					<form onSubmit={handleSubmit} className="space-y-6">
						{/* File Upload Area */}
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Video File
							</label>
							<div
								className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
									dragActive
										? "border-blue-500 bg-blue-50"
										: selectedFile
										? "border-green-500 bg-green-50"
										: "border-gray-300 hover:border-gray-400"
								}`}
								onDragEnter={handleDrag}
								onDragLeave={handleDrag}
								onDragOver={handleDrag}
								onDrop={handleDrop}>
								{selectedFile ? (
									<div className="space-y-4">
										<Icon
											icon="mdi:video-check"
											className="mx-auto text-6xl text-green-600"
										/>
										<div>
											<p className="font-medium text-gray-800">
												{selectedFile.name}
											</p>
											<p className="text-sm text-gray-600">
												{formatFileSize(selectedFile.size)}
											</p>
										</div>
										<button
											type="button"
											onClick={() => setSelectedFile(null)}
											className="text-red-600 hover:text-red-800 font-medium">
											Remove File
										</button>
									</div>
								) : (
									<div className="space-y-4">
										<Icon
											icon="mdi:cloud-upload"
											className="mx-auto text-6xl text-gray-400"
										/>
										<div>
											<p className="text-lg font-medium text-gray-600">
												Drop your video here, or{" "}
												<button
													type="button"
													onClick={() => fileInputRef.current?.click()}
													className="text-blue-600 hover:text-blue-800 font-medium">
													browse
												</button>
											</p>
											<p className="text-sm text-gray-500 mt-2">
												Supports: MP4, MOV, AVI, WMV (Max: 2GB)
											</p>
										</div>
									</div>
								)}
								<input
									ref={fileInputRef}
									type="file"
									accept="video/*"
									onChange={handleFileSelect}
									className="hidden"
								/>
							</div>
						</div>

						{/* Video Details */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
							{/* Title */}
							<div className="md:col-span-2">
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Video Title *
								</label>
								<input
									type="text"
									name="title"
									value={videoDetails.title}
									onChange={handleInputChange}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="Enter video title"
									required
								/>
							</div>

							{/* Category */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Category
								</label>
								<select
									name="category"
									value={videoDetails.category}
									onChange={handleInputChange}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
									<option value="">Select Category</option>
									{categories.map((category) => (
										<option key={category} value={category}>
											{category}
										</option>
									))}
								</select>
							</div>

							{/* Tags */}
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Tags
								</label>
								<input
									type="text"
									name="tags"
									value={videoDetails.tags}
									onChange={handleInputChange}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="tag1, tag2, tag3"
								/>
							</div>

							{/* Thumbnail */}
							<div className="md:col-span-2">
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Thumbnail (Optional)
								</label>
								<div className="flex items-center space-x-4">
									<button
										type="button"
										onClick={() => thumbnailInputRef.current?.click()}
										className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2">
										<Icon icon="mdi:image-plus" />
										<span>Choose Thumbnail</span>
									</button>
									{videoDetails.thumbnail && (
										<span className="text-sm text-gray-600">
											{videoDetails.thumbnail.name}
										</span>
									)}
								</div>
								<input
									ref={thumbnailInputRef}
									type="file"
									accept="image/*"
									onChange={handleThumbnailSelect}
									className="hidden"
								/>
							</div>

							{/* Description */}
							<div className="md:col-span-2">
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Description
								</label>
								<textarea
									name="description"
									value={videoDetails.description}
									onChange={handleInputChange}
									rows={4}
									className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
									placeholder="Describe your video..."
								/>
							</div>
						</div>

						{/* Upload Progress */}
						{isUploading && (
							<div className="space-y-2">
								<div className="flex justify-between text-sm">
									<span>Uploading...</span>
									<span>{Math.round(uploadProgress)}%</span>
								</div>
								<div className="w-full bg-gray-200 rounded-full h-2">
									<div
										className="bg-blue-600 h-2 rounded-full transition-all duration-300"
										style={{ width: `${uploadProgress}%` }}
									/>
								</div>
							</div>
						)}

						{/* Success Message */}
						{uploadStatus === "success" && (
							<div className="bg-green-50 border border-green-200 rounded-md p-4 flex items-center">
								<Icon
									icon="mdi:check-circle"
									className="text-green-600 text-xl mr-3"
								/>
								<span className="text-green-800">
									Video uploaded successfully!
								</span>
							</div>
						)}

						{/* Submit Button */}
						<div className="flex justify-end space-x-4">
							<button
								type="button"
								className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
								onClick={() => {
									setSelectedFile(null);
									setVideoDetails({
										title: "",
										description: "",
										category: "",
										tags: "",
										thumbnail: null,
									});
								}}>
								Cancel
							</button>
							<button
								type="submit"
								disabled={isUploading || !selectedFile}
								className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2">
								{isUploading ? (
									<>
										<Icon icon="mdi:loading" className="animate-spin" />
										<span>Uploading...</span>
									</>
								) : (
									<>
										<Icon icon="mdi:upload" />
										<span>Upload Video</span>
									</>
								)}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
