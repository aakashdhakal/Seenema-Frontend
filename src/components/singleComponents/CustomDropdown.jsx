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

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<Button
					variant={variant}
					size={size}
					disabled={disabled}
					className={`text-white hover:text-primary hover:bg-white/10 ${className}`}>
					{placeholder && (
						<span className="text-sm text-muted-foreground">
							{placeholder ? placeholder : "Select an option"}
						</span>
					)}
					{icon && <Icon icon={icon} className="h-4 w-4" />}
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="bg-card border-border min-w-[120px]"
				align="end">
				{options.map((option, index) => (
					<DropdownMenuItem
						key={`${option}-${index}`}
						onClick={() => handleSelect(option)}
						className={`cursor-pointer hover:bg-accent transition-colors ${
							selectedOption === option
								? "bg-accent text-accent-foreground"
								: ""
						}`}>
						<span className="text-sm">{option}</span>
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
