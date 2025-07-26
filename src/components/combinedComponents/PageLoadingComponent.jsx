"use client";
import { Icon } from "@iconify/react";
import Image from "next/image";

export default function PageLoadingComponent() {
	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
			<div className="text-center space-y-6">
				{/* Logo */}
				<div className="mb-8">
					<Image
						src="/4.png"
						alt="StreamFlow"
						width={100}
						height={100}
						className="mx-auto opacity-90"
					/>
				</div>

				{/* Simple Spinner */}
				<div className="flex justify-center">
					<div className="w-12 h-12 border-4 border-white/20 border-t-primary rounded-full animate-spin"></div>
				</div>
			</div>
		</div>
	);
}
