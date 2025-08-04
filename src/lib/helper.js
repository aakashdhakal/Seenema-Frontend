import axios from "./axios";

export const uploadVideo = async (formData, genres, tags, credits) => {
	try {
		const response = await axios.post("/uploadVideo", formData, {
			headers: {
				"Content-Type": "multipart/form-data",
			},
		});
		const data = response.data;
		console.log("Video uploaded successfully:", data);
		await addGenreToVideo(data.video_id, genres);
		await addTagsToVideo(data.video_id, tags);
		await addCreditsToVideo(data.video_id, credits);
		return data;
	} catch (error) {
		console.error("Error uploading video:", error);
		throw error;
	}
};

const addGenreToVideo = async (videoId, genres) => {
	try {
		const response = await axios.post("/genre/add", {
			videoId,
			genres,
		});
		return response.data;
	} catch (error) {
		console.error("Error adding genre to video:", error);
		throw error;
	}
};

const addTagsToVideo = async (videoId, tags) => {
	try {
		const response = await axios.post("/tags/add", {
			videoId,
			tags,
		});
		return response.data;
	} catch (error) {
		console.error("Error adding tags to video:", error);
		throw error;
	}
};

const addCreditsToVideo = async (videoId, credits) => {
	try {
		const response = await axios.post("/people/add-credit", {
			videoId,
			credits,
		});
		return response.data;
	} catch (error) {
		console.error("Error adding credits to video:", error);
		throw error;
	}
};

export const addToWatchList = async (videoId) => {
	try {
		const response = await axios.post("/watchlist/add", { video_id: videoId });
		return response.data;
	} catch (error) {
		console.error("Error adding to watch list:", error);
		throw error;
	}
};

export const removeFromWatchList = async (videoId) => {
	try {
		const response = await axios.delete(`/watchlist/${videoId}`);
		return response.data;
	} catch (error) {
		console.error("Error removing from watch list:", error);
		throw error;
	}
};

export const getWatchList = async () => {
	try {
		const response = await axios.get("/watchlist");
		return response.data;
	} catch (error) {
		console.error("Error fetching watch list:", error);
		throw error;
	}
};

export const checkIfVideoInWatchList = async (videoId) => {
	try {
		const response = await axios.get(`/watchlist/check/${videoId}`);
		return response.data;
	} catch (error) {
		console.error("Error checking if video is in watch list:", error);
		throw error;
	}
};

//notifications api handlers

export const getNotifications = async (page = 1) => {
	try {
		const response = await axios.get("/notifications", {
			params: { page },
		});
		return response.data;
	} catch (error) {
		console.error("Error fetching notifications:", error);
		throw error;
	}
};

export const markNotificationAsRead = async (id) => {
	try {
		const response = await axios.post(`/notifications/${id}/read`);
		return response.data;
	} catch (error) {
		console.error("Error marking notification as read:", error);
		throw error;
	}
};

export const markAllNotificationsAsRead = async () => {
	try {
		const response = await axios.post("/notifications/read-all");
		return response.data;
	} catch (error) {
		console.error("Error marking all notifications as read:", error);
		throw error;
	}
};

export const deleteNotification = async (id) => {
	try {
		const response = await axios.delete(`/notifications/${id}`);
		return response.data;
	} catch (error) {
		console.error("Error deleting notification:", error);
		throw error;
	}
};

export const deleteAllNotifications = async () => {
	try {
		const response = await axios.delete("/notifications/delete-all");
		return response.data;
	} catch (error) {
		console.error("Error deleting all notifications:", error);
		throw error;
	}
};

export const removeFromWatchHistory = async (id) => {
	try {
		const response = await axios.delete(`/history/${id}`);
		return response;
	} catch (error) {
		console.error("Error removing from watchlist:", error);
		throw error;
	}
};

export const removeFromContinueWatching = async (id) => {
	try {
		const response = await axios.delete(`/history/continue-watching/${id}`);
		return response;
	} catch (error) {
		console.error("Error removing from continue watching:", error);
		throw error;
	}
};

export function parseVTT(vttText) {
	const cues = [];
	const lines = vttText.split("\n");

	let currentCue = null;

	lines.forEach((line) => {
		// Skip metadata and empty lines
		if (line.includes("-->")) {
			const [start, end] = line.split(" --> ");
			currentCue = {
				startTime: parseTime(start),
				endTime: parseTime(end),
				text: "",
			};
		} else if (currentCue && line.trim()) {
			currentCue.text += line + "\n";
		} else if (!line.trim() && currentCue) {
			cues.push(currentCue);
			currentCue = null;
		}
	});

	return cues;
}

export function parseTime(timeString) {
	const [hms, ms] = timeString.split(".");
	const [h, m, s] = hms.split(":");
	return +h * 3600 + +m * 60 + +s + +ms / 1000;
}
