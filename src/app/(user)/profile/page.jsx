"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Icon } from "@iconify/react";
import { useAuthContext } from "@/context/AuthContext";
import PageLoadingComponent from "@/components/combinedComponents/PageLoadingComponent";
import CustomDropdown from "@/components/singleComponents/CustomDropdown";
import { DatePicker } from "@/components/combinedComponents/DatePicker";
import { toast } from "sonner";
import axios from "@/lib/axios";
import Image from "next/image";
import CustomSelect from "@/components/singleComponents/CustomSelect";

export default function ProfilePage() {
	const { user, isLoading, mutate } = useAuthContext();
	const router = useRouter();
	const [mounted, setMounted] = useState(false);
	const [editing, setEditing] = useState(false);
	const [saving, setSaving] = useState(false);
	const [profileData, setProfileData] = useState({
		name: "",
		email: "",
		phone: "",
		bio: "",
		gender: "",
		dob: "",
		address: "",
		profile_picture: null,
	});
	const [profilePicturePreview, setProfilePicturePreview] = useState(null);
	const [stats, setStats] = useState({
		total_videos_watched: 0,
		total_watch_time: 0,
		total_saved_videos: 0,
		incomplete_videos_count: 0,
	});

	const genderOptions = ["male", "female", "other"];

	// Handle hydration
	useEffect(() => {
		setMounted(true);
	}, []);

	// Redirect to login if not authenticated
	useEffect(() => {
		if (!isLoading && !user) {
			router.replace("/login");
			return;
		}
	}, [user, isLoading, router]);

	// Set profile data when user is available
	useEffect(() => {
		if (user) {
			setProfileData({
				name: user.name || "",
				email: user.email || "",
				phone: user.phone || "",
				bio: user.bio || "",
				gender: user.gender || "",
				dob: user.dob || "",
				address: user.address || "",
				profile_picture: null,
			});
		}
		const fetchStats = async () => {
			try {
				const res = await axios.get("/history/stats");
				setStats(res.data);
			} catch (err) {
				setStats({ total_videos_watched: 0, total_watch_time: 0 });
			}
		};
		if (user) fetchStats();
	}, [user]);

	// Handle input changes
	const handleInputChange = (field, value) => {
		setProfileData((prev) => ({ ...prev, [field]: value }));
	};

	// Handle profile picture upload
	const handleProfilePictureChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			if (file.size > 5 * 1024 * 1024) {
				toast.error("File size must be less than 5MB");
				return;
			}

			if (!file.type.startsWith("image/")) {
				toast.error("Please select a valid image file");
				return;
			}

			setProfileData((prev) => ({ ...prev, profile_picture: file }));
			const previewUrl = URL.createObjectURL(file);
			setProfilePicturePreview(previewUrl);
		}
	};

	// Handle save
	const handleSave = async () => {
		if (!profileData.name.trim()) {
			toast.error("Name is required");
			return;
		}

		setSaving(true);
		try {
			const formData = new FormData();
			Object.keys(profileData).forEach((key) => {
				if (profileData[key] && key !== "profile_picture" && key !== "email") {
					formData.append(key, profileData[key]);
				}
			});

			if (profileData.profile_picture) {
				formData.append("profile_picture", profileData.profile_picture);
			}

			const response = await axios.post("/user/update", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});

			await mutate();
			setEditing(false);
			setProfilePicturePreview(null);
			toast.success("Profile updated successfully!");
		} catch (error) {
			console.error("Error updating profile:", error);
			toast.error(error.response?.data?.message || "Failed to update profile");
		} finally {
			setSaving(false);
		}
	};

	// Handle cancel
	const handleCancel = () => {
		setProfileData({
			name: user.name || "",
			email: user.email || "",
			phone: user.phone || "",
			bio: user.bio || "",
			gender: user.gender || "",
			dob: user.dob || "",
			address: user.address || "",
			profile_picture: null,
		});
		setProfilePicturePreview(null);
		setEditing(false);
	};

	// Format date
	const formatDate = (dateString) => {
		if (!dateString) return "Not set";
		return new Date(dateString).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});
	};

	// Calculate age
	const calculateAge = (dob) => {
		if (!dob) return null;
		const birthDate = new Date(dob);
		const today = new Date();
		let age = today.getFullYear() - birthDate.getFullYear();
		const monthDiff = today.getMonth() - birthDate.getMonth();
		if (
			monthDiff < 0 ||
			(monthDiff === 0 && today.getDate() < birthDate.getDate())
		) {
			age--;
		}
		return age;
	};

	if (isLoading || !user || !mounted) {
		return <PageLoadingComponent />;
	}

	return (
		<div className="min-h-screen bg-background pt-16">
			<div className="border-b bg-card">
				<div className="container mx-auto max-w-6xl px-6 py-8">
					<div className="flex flex-col lg:flex-row gap-8 items-start">
						{/* Avatar */}
						<div className="relative mx-auto lg:mx-0">
							<div className="relative group border-primary border-2 rounded-full w-24 h-24 overflow-hidden">
								<Image
									src={
										profilePicturePreview ||
										user.profile_picture ||
										`https://ui-avatars.com/api/?name=${encodeURIComponent(
											user.name || "User",
										)}&background=000&color=fff&size=128`
									}
									alt="Profile Picture"
									className="w-full h-full object-cover rounded-full border-4 border-border"
									width={128}
									height={128}
								/>
								{editing && (
									<>
										<div
											className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
											onClick={() =>
												document.getElementById("profile-picture").click()
											}>
											<Icon
												icon="solar:camera-bold"
												className="w-5 h-5 text-white"
											/>
										</div>
										<Input
											id="profile-picture"
											type="file"
											accept="image/*"
											onChange={handleProfilePictureChange}
											className="hidden"
										/>
									</>
								)}
							</div>
						</div>

						{/* User Info */}
						<div className="flex-1 text-center lg:text-left">
							<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
								<div className="space-y-3">
									<div className="flex items-center justify-center lg:justify-start gap-2">
										<h1 className="text-3xl font-bold">
											{user.name || "User"}
										</h1>
									</div>
									<div className="space-y-1">
										<p className="text-muted-foreground flex items-center justify-center lg:justify-start gap-2">
											<Icon icon="solar:letter-bold" className="w-4 h-4" />
											{user.email}
										</p>
										<p className="text-sm text-muted-foreground">
											Member since {formatDate(user.created_at)}
										</p>
									</div>
								</div>

								{/* Action Buttons */}
								<div className="flex flex-col sm:flex-row gap-3">
									{!editing ? (
										<Button onClick={() => setEditing(true)} size="default">
											<Icon icon="solar:pen-bold" className="w-4 h-4 mr-2" />
											Edit Profile
										</Button>
									) : (
										<>
											<Button
												onClick={handleSave}
												disabled={saving}
												size="default">
												{saving ? (
													<Icon
														icon="solar:refresh-circle-bold"
														className="w-4 h-4 mr-2 animate-spin"
													/>
												) : (
													<Icon
														icon="solar:check-circle-bold"
														className="w-4 h-4 mr-2"
													/>
												)}
												{saving ? "Saving..." : "Save Changes"}
											</Button>
											<Button
												variant="outline"
												onClick={handleCancel}
												disabled={saving}
												size="default">
												Cancel
											</Button>
										</>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			{/* Main Content */}
			<div className="container mx-auto max-w-6xl px-6 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* Profile Information */}
					<div className="lg:col-span-2">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Icon icon="solar:user-bold" className="w-5 h-5" />
									Profile Information
								</CardTitle>
							</CardHeader>
							<CardContent>
								{editing ? (
									<div className="space-y-6">
										{/* Name */}
										<div className="space-y-2">
											<Label htmlFor="name" className="text-sm font-medium">
												Full Name <span className="text-destructive">*</span>
											</Label>
											<Input
												id="name"
												value={profileData.name}
												onChange={(e) =>
													handleInputChange("name", e.target.value)
												}
												placeholder="Enter your full name"
												className="h-10"
											/>
										</div>

										{/* Email (Disabled) */}
										<div className="space-y-2">
											<Label htmlFor="email" className="text-sm font-medium">
												Email Address
											</Label>
											<div className="relative">
												<Input
													id="email"
													type="email"
													value={profileData.email}
													disabled
													className="h-10 bg-muted/50 pr-10"
												/>
												<Icon
													icon="solar:lock-bold"
													className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
												/>
											</div>
											<p className="text-xs text-muted-foreground">
												Email cannot be changed
											</p>
										</div>

										{/* Phone */}
										<div className="space-y-2">
											<Label htmlFor="phone" className="text-sm font-medium">
												Phone Number
											</Label>
											<Input
												id="phone"
												type="tel"
												value={profileData.phone}
												onChange={(e) =>
													handleInputChange("phone", e.target.value)
												}
												placeholder="+1 (555) 000-0000"
												className="h-10"
											/>
										</div>

										{/* Gender & DOB */}
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div className="space-y-2">
												<Label htmlFor="gender" className="text-sm font-medium">
													Gender
												</Label>
												<CustomSelect
													label="Select Gender"
													options={[
														{ value: "male", label: "Male" },
														{ value: "female", label: "Female" },
														{ value: "other", label: "Other" },
													]}
													value={profileData.gender}
													onValueChange={(value) =>
														handleInputChange("gender", value)
													}
													className="p-4"
												/>
											</div>
											<div className="space-y-2">
												<Label htmlFor="dob" className="text-sm font-medium">
													Date of Birth
												</Label>
												<DatePicker
													value={profileData.dob}
													onChange={(date) => handleInputChange("dob", date)}
													placeholder="Select birth date"
													maxDate={new Date()}
													className="w-full h-10"
												/>
											</div>
										</div>

										{/* Address */}
										<div className="space-y-2">
											<Label htmlFor="address" className="text-sm font-medium">
												Address
											</Label>
											<Input
												id="address"
												value={profileData.address}
												onChange={(e) =>
													handleInputChange("address", e.target.value)
												}
												placeholder="Enter your address"
												className="h-10"
											/>
										</div>

										{/* Bio */}
										<div className="space-y-2">
											<Label htmlFor="bio" className="text-sm font-medium">
												Bio
											</Label>
											<Textarea
												id="bio"
												value={profileData.bio}
												onChange={(e) =>
													handleInputChange("bio", e.target.value)
												}
												placeholder="Tell us about yourself..."
												className="resize-none"
												rows={4}
												maxLength={255}
											/>
											<p className="text-xs text-muted-foreground">
												{profileData.bio.length}/255 characters
											</p>
										</div>
									</div>
								) : (
									<div className="space-y-6">
										<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
											<div className="space-y-3">
												<div>
													<Label className="text-sm text-muted-foreground">
														Name
													</Label>
													<p className="font-medium">
														{user.name || "Not set"}
													</p>
												</div>
												<div>
													<Label className="text-sm text-muted-foreground">
														Phone
													</Label>
													<p className="font-medium">
														{user.phone || "Not set"}
													</p>
												</div>
												<div>
													<Label className="text-sm text-muted-foreground">
														Gender
													</Label>
													<p className="font-medium capitalize">
														{user.gender || "Not set"}
													</p>
												</div>
											</div>
											<div className="space-y-3">
												<div>
													<Label className="text-sm text-muted-foreground flex items-center gap-2">
														Email
														<Icon icon="solar:lock-bold" className="w-3 h-3" />
													</Label>
													<p className="font-medium">{user.email}</p>
												</div>
												<div>
													<Label className="text-sm text-muted-foreground">
														Age
													</Label>
													<p className="font-medium">
														{user.dob
															? `${calculateAge(user.dob)} years old`
															: "Not set"}
													</p>
												</div>
												<div>
													<Label className="text-sm text-muted-foreground">
														Date of Birth
													</Label>
													<p className="font-medium">{formatDate(user.dob)}</p>
												</div>
											</div>
										</div>
										<Separator />
										<div className="space-y-3">
											<div>
												<Label className="text-sm text-muted-foreground">
													Address
												</Label>
												<p className="font-medium">
													{user.address || "Not set"}
												</p>
											</div>
											<div>
												<Label className="text-sm text-muted-foreground">
													Bio
												</Label>
												<p className="text-sm leading-relaxed">
													{user.bio || "No bio added yet."}
												</p>
											</div>
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					</div>

					{/* Sidebar */}
					<div className="space-y-6">
						{/* Statistics */}
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Icon icon="solar:chart-bold" className="w-5 h-5" />
									Activity Statistics
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-2 gap-4">
									<div className="text-center p-4 border rounded-lg">
										<Icon
											icon="solar:play-circle-bold"
											className="w-6 h-6 mx-auto mb-2 text-muted-foreground"
										/>
										<div className="text-xl font-semibold">
											{stats.total_videos_watched}
										</div>
										<div className="text-xs text-muted-foreground">
											Videos Watched
										</div>
									</div>
									<div className="text-center p-4 border rounded-lg">
										<Icon
											icon="solar:clock-circle-bold"
											className="w-6 h-6 mx-auto mb-2 text-muted-foreground"
										/>
										<div className="text-xl font-semibold">
											{Math.floor(stats.total_watch_time / 3600)}h{" "}
											{Math.floor((stats.total_watch_time % 3600) / 60)}m
										</div>
										<div className="text-xs text-muted-foreground">
											Watch Time
										</div>
									</div>
									<div className="text-center p-4 border rounded-lg">
										<Icon
											icon="solar:bookmark-bold"
											className="w-6 h-6 mx-auto mb-2 text-muted-foreground"
										/>
										<div className="text-xl font-semibold">
											{stats.total_saved_videos}
										</div>
										<div className="text-xs text-muted-foreground">Saved</div>
									</div>
									<div className="text-center p-4 border rounded-lg">
										<Icon
											icon="solar:close-circle-bold"
											className="w-6 h-6 mx-auto mb-2 text-muted-foreground"
										/>
										<div className="text-xl font-semibold">
											{stats.incomplete_videos_count}
										</div>
										<div className="text-xs text-muted-foreground">
											Incomplete Videos
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
						{/* Account Status */}
						<Card className={"flex"}>
							<CardHeader>
								<CardTitle className="flex items-center gap-2 justify-between">
									<div className="flex items-center gap-2">
										<Icon icon="solar:calendar-bold" className="w-5 h-5" />
										Account State
									</div>
									<Badge
										variant={
											user.status === "active" ? "default" : "destructive"
										}
										className="capitalize">
										{user.status}
									</Badge>
								</CardTitle>
							</CardHeader>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
