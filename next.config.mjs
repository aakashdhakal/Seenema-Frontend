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
			"localhost:8000",
			"image.tmdb.org",
			"www.themoviedb.org",
			"i.imgur.com",
		],
	},
};

export default nextConfig;
