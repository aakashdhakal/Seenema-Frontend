"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";

export default function UserAvatar({ src, fallback }) {
	return (
		<Avatar className="w-8 h-8 rounded-full border border-gray-300 shadow-sm overflow-hidden">
			<AvatarImage src={src} alt="User Avatar" />
			<AvatarFallback className="bg-gray-500 text-white w-full h-full flex items-center justify-center rounded-full">
				<img
					src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
						fallback || "User",
					)}&background=000&color=fff&size=128`}
					alt="Profile Picture"
				/>
			</AvatarFallback>
		</Avatar>
	);
}
