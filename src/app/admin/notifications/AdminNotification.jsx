"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import { toast } from "sonner";
import axios from "@/lib/axios";

export default function AdminNotification() {
	const [title, setTitle] = useState("");
	const [message, setMessage] = useState("");
	const [userId, setUserId] = useState([]); // Optional: for sending to a specific user
	const [loading, setLoading] = useState(false);

	const handleSend = async (e) => {
		e.preventDefault();
		if (!title.trim() || !message.trim()) {
			toast.error("Title and message are required");
			return;
		}
		setLoading(true);
		try {
			await axios.post("/notifications/send", {
				title,
				message,
				user_id: userId || null, // null for all users, or provide userId
			});
			toast.success("Notification sent successfully");
			setTitle("");
			setMessage("");
			setUserId("");
		} catch (err) {
			toast.error(
				err?.response?.data?.message || "Failed to send notification",
			);
		}
		setLoading(false);
	};

	return (
		<div className="max-w-2xl mx-auto py-10 px-4">
			<Card className="shadow-lg">
				<CardHeader className="flex flex-row items-center gap-3 pb-2">
					<Icon
						icon="solar:bell-bold-duotone"
						className="h-7 w-7 text-primary"
					/>
					<CardTitle className="text-2xl font-bold">
						Send Custom Notification
					</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSend} className="space-y-5 mt-2">
						<div>
							<label className="block text-sm font-medium mb-1">
								Title <span className="text-red-500">*</span>
							</label>
							<Input
								placeholder="Notification Title"
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								disabled={loading}
								required
							/>
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">
								Message <span className="text-red-500">*</span>
							</label>
							<Textarea
								placeholder="Notification Message"
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								rows={4}
								disabled={loading}
								required
							/>
						</div>
						<div>
							<label className="block text-sm font-medium mb-1">
								User ID{" "}
								<span className="text-xs text-muted-foreground">
									(leave blank to send to all users)
								</span>
							</label>
							<Input
								placeholder="User ID (optional)"
								value={userId}
								onChange={(e) => setUserId(e.target.value)}
								disabled={loading}
							/>
						</div>
						<Button
							type="submit"
							isLoading={loading}
							className="w-full flex items-center gap-2">
							<Icon icon="solar:send-square-bold-duotone" className="h-5 w-5" />
							Send Notification
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
