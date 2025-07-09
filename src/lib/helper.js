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
		const response = await axios.post("/addGenreToVideo", {
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
		const response = await axios.post("/addTagsToVideo", {
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
		const response = await axios.post("/addCreditsToVideo", {
			videoId,
			credits,
		});
		return response.data;
	} catch (error) {
		console.error("Error adding credits to video:", error);
		throw error;
	}
};
