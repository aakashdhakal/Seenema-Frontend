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
		],
	},
};

export default nextConfig;
