"use client";
import { Icon } from "@iconify/react";
import Image from "next/image";

export default function PageLoadingComponent({ message = "Loading..." }) {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
			<div className="text-center space-y-6">
				{/* Logo */}
				<div className="mb-8">
					<Image
						src="/3.png"
						alt="StreamFlow"
						width={200}
						height={100}
						className="mx-auto opacity-90"
					/>
				</div>

				{/* Simple Spinner */}
				<div className="flex justify-center">
					<div className="w-12 h-12 border-4 border-white/20 border-t-primary rounded-full animate-spin"></div>
				</div>

				{/* Loading Text */}
				<div className="space-y-2">
					<h3 className="text-white text-lg font-medium">{message}</h3>
					<p className="text-gray-400 text-sm">Please wait...</p>
				</div>
			</div>
		</div>
	);
}
