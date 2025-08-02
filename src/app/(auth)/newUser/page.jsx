"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Icon } from "@iconify/react";
import { useAuthContext } from "@/context/AuthContext";
import CustomSelect from "@/components/singleComponents/CustomSelect";
import { DatePicker } from "@/components/combinedComponents/DatePicker";
import { toast } from "sonner";
import axios from "@/lib/axios";
import Image from "next/image";
import Form from "next/form";
import PageLoadingComponent from "@/components/combinedComponents/PageLoadingComponent";

export default function NewUserProfileSetup() {
	const { user, isLoading, mutate } = useAuthContext();
	const router = useRouter();

	const [mounted, setMounted] = useState(false);
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

	// Handle hydration
	useEffect(() => {
		setMounted(true);
	}, []);

	// Redirect to login if not authenticated & initialize user data
	useEffect(() => {
		if (!isLoading) {
			if (!user) {
				router.replace("/login");
				return;
			}
			setProfileData((prev) => ({
				...prev,
				name: user.name || "",
				email: user.email || "",
				phone: user.phone || "",
				bio: user.bio || "",
				gender: user.gender || "",
				dob: user.dob || "",
				address: user.address || "",
				profile_picture: null,
			}));
		}
	}, [user, isLoading, router]);

	// Cleanup preview URL to prevent memory leaks
	useEffect(() => {
		return () => {
			if (profilePicturePreview) URL.revokeObjectURL(profilePicturePreview);
		};
	}, [profilePicturePreview]);

	const handleInputChange = (field, value) => {
		setProfileData((prev) => ({ ...prev, [field]: value }));
	};

	const handleProfilePictureChange = (e) => {
		const file = e.target.files[0];
		if (file) {
			setProfileData((prev) => ({ ...prev, profile_picture: file }));
			setProfilePicturePreview(URL.createObjectURL(file));
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();

		if (!profileData.name.trim() || !profileData.email.trim()) {
			toast.error("Name and email are required");
			return;
		} else if (!profileData.gender.trim()) {
			toast.error("Gender is required");
			return;
		} else if (!profileData.dob) {
			toast.error("Date of birth is required");
			return;
		}

		setSaving(true);
		try {
			const formData = new FormData();
			Object.entries(profileData).forEach(([key, value]) => {
				if (value && (key !== "profile_picture" || value instanceof File)) {
					formData.append(key, value);
				}
			});

			const response = await axios.post("/user/update", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			await mutate(); // Refresh user data
			toast.success("Profile completed successfully!");
			router.push("/home");
		} catch (error) {
			console.error("Error updating profile:", error);
			toast.error(error.response?.data?.message || "Failed to update profile");
		} finally {
			setSaving(false);
		}
	};

	const handleSkip = () => {
		toast.info("You can complete your profile later from settings");
		router.push("/home");
	};

	if (isLoading || !user || !mounted) {
		return <PageLoadingComponent />;
	}

	return (
		<div className="min-h-screen bg-background flex items-center justify-center px-4 py-6">
			<div className="w-full max-w-2xl">
				{/* Welcome Header */}
				<div className="text-center mb-8">
					<div className="flex items-center justify-center gap-2 mb-4">
						<Icon
							icon="solar:user-plus-bold-duotone"
							className="w-8 h-8 text-primary"
						/>
						<h1 className="text-2xl md:text-3xl font-bold text-foreground">
							Welcome to Seenema!
						</h1>
					</div>
					<p className="text-base text-muted-foreground">
						Let's complete your profile to get started
					</p>
				</div>

				{/* Profile Form Card */}
				<Card className="border-border/50 shadow-lg">
					<CardHeader className="pb-6">
						<CardTitle className="flex items-center gap-2 text-lg">
							<Icon icon="solar:user-bold-duotone" className="w-5 h-5" />
							Complete Your Profile
						</CardTitle>
					</CardHeader>

					<CardContent className="px-8 pb-8">
						<Form onSubmit={handleSubmit} className="space-y-8">
							{/* Profile Picture */}
							<div className="flex flex-col items-center space-y-6">
								<div className="relative group w-32 h-32">
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
									<div
										className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
										onClick={() =>
											document.getElementById("profile-picture").click()
										}>
										<Icon
											icon="solar:camera-bold"
											className="w-6 h-6 text-white"
										/>
									</div>
								</div>
								<Input
									id="profile-picture"
									type="file"
									accept="image/*"
									onChange={handleProfilePictureChange}
									className="hidden"
								/>
							</div>

							{/* Basic Information */}
							<div className="space-y-6">
								<div>
									<Label htmlFor="name" className="text-sm font-medium">
										Full Name <span className="text-destructive">*</span>
									</Label>
									<Input
										id="name"
										value={profileData.name}
										onChange={(e) => handleInputChange("name", e.target.value)}
										placeholder="Enter your full name"
										required
										className="mt-2 h-11"
									/>
								</div>

								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									<div>
										<Label htmlFor="email" className="text-sm font-medium">
											Email Address <span className="text-destructive">*</span>
										</Label>
										<Input
											id="email"
											type="email"
											value={profileData.email}
											onChange={(e) =>
												handleInputChange("email", e.target.value)
											}
											placeholder="Enter your email"
											required
											className="mt-2 h-11"
											disabled
										/>
									</div>
									<div>
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
											placeholder="9876543210"
											className="mt-2 h-11"
										/>
									</div>
								</div>
							</div>

							{/* Personal Details */}
							<div className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
									<div>
										<Label htmlFor="gender" className="text-sm font-medium">
											Gender <span className="text-destructive">*</span>
										</Label>
										<div className="mt-2">
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
									</div>

									<div>
										<Label htmlFor="dob" className="text-sm font-medium">
											Date of Birth <span className="text-destructive">*</span>
										</Label>
										<div className="mt-2">
											<DatePicker
												value={profileData.dob}
												onChange={(date) => handleInputChange("dob", date)}
												placeholder="Select your birth date"
												maxDate={new Date()}
												className="w-full"
											/>
										</div>
									</div>
								</div>

								<div>
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
										className="mt-2 h-11"
									/>
								</div>

								<div>
									<Label htmlFor="bio" className="text-sm font-medium">
										Bio (Optional)
									</Label>
									<Textarea
										id="bio"
										value={profileData.bio}
										onChange={(e) => handleInputChange("bio", e.target.value)}
										placeholder="Tell us a little about yourself..."
										className="mt-2 resize-none min-h-[100px]"
										rows={4}
										maxLength={255}
									/>
									<p className="text-xs text-muted-foreground mt-2">
										{profileData.bio.length}/255 characters
									</p>
								</div>
							</div>

							{/* Actions */}
							<div className="flex justify-end gap-4 mt-8">
								<Button
									type="button"
									variant="outline"
									onClick={handleSkip}
									className={"p-[1.2rem]"}>
									Skip for Now
								</Button>
								<Button
									type="submit"
									variant="default"
									isLoading={saving}
									loadingText={"Saving..."}>
									Save Profile
								</Button>
							</div>
						</Form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
