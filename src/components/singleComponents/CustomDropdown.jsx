"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { useState } from "react";

export default function CustomDropdown({
	options,
	selectedOption,
	onSelect,
	placeholder,
	className = "",
	variant = "ghost",
	size = "sm",
	icon,
	disabled = false,
}) {
	const [isOpen, setIsOpen] = useState(false);

	const handleSelect = (option) => {
		onSelect(option);
		setIsOpen(false);
	};

	const capitalizeFirst = (text) => {
		if (!text) return text;
		if (typeof text !== "string") return text;
		return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
	};

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
			<DropdownMenuTrigger asChild>
				<Button
					variant={variant}
					size={size}
					disabled={disabled}
					className={`text-white hover:text-foreground hover:bg-secondary ${className}`}>
					{icon && <Icon icon={icon} className="h-4 w-4 ml-1.5" />}
					<span className="text-sm">
						{capitalizeFirst(selectedOption) || placeholder}
					</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="bg-card border-border  w-[var(--radix-dropdown-menu-trigger-width)] min-w-max">
				{options.map((option, index) => (
					<DropdownMenuItem
						key={`${option}-${index}`}
						onClick={() => handleSelect(option)}
						className={`cursor-pointer hover:bg-accent transition-colors ${
							selectedOption === option
								? "bg-accent text-accent-foreground"
								: ""
						}`}>
						<span className="text-sm">{capitalizeFirst(option)}</span>
						{selectedOption === option && (
							<Icon
								icon="solar:check-bold"
								className="ml-auto h-3 w-3 text-primary"
							/>
						)}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
