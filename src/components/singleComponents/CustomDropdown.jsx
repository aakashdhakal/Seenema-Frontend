"use client";
import {
	Dropdown,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function CustomDropdown({ options, selectedOption, onSelect }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="text-white hover:text-primary hover:bg-white/10">
					<span className="text-sm">{selectedOption}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="bg-card border-border">
				{options.map((option) => (
					<DropdownMenuItem
						key={option}
						onClick={() => onSelect(option)}
						className={`cursor-pointer hover:bg-accent ${
							selectedOption === option ? "bg-accent" : ""
						}`}>
						{option}
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
