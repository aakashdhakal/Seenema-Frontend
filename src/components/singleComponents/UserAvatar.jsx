"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";

export default function UserAvatar({ src }) {
	return (
		<Avatar className="w-9 h-9 rounded-full border border-gray-300 shadow-sm">
			<AvatarImage src={src} alt="User Avatar" />
			<AvatarFallback className="bg-gray-500 text-white w-full h-full flex items-center justify-center rounded-full">
				<span className="text-sm">U</span>
			</AvatarFallback>
		</Avatar>
	);
}
