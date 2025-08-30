/** @type {import('next').NextConfig} */
const nextConfig = {
	async rewrites() {
		return [
			{
				source: "/api/:path*",
				destination: "http://localhost:8000/api/:path*",
			},
		];
	},
	images: {
		domains: [
			"localhost",
			"image.tmdb.org",
			"www.themoviedb.org",
			"i.imgur.com",
			"avatars.githubusercontent.com",
			"lh3.googleusercontent.com",
			"res.cloudinary.com",
			"seenemaapi.aakashdhakal.com.np",
			"seenema.aakashdhakal.com.np",
			"ui-avatars.com",
		],
	},
};

export default nextConfig;
