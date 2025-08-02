"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

export function DatePicker({
	value,
	onChange,
	placeholder = "Select date",
	disabled = false,
	className = "",
	maxDate,
	minDate,
}) {
	const [open, setOpen] = React.useState(false);

	const handleSelect = (selectedDate) => {
		if (selectedDate) {
			// Format as YYYY-MM-DD for form input compatibility
			const formattedDate = format(selectedDate, "yyyy-MM-dd");
			onChange?.(formattedDate);
		}
		setOpen(false);
	};

	const displayDate = value ? new Date(value) : null;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					disabled={disabled}
					className={`justify-between font-normal ${className} bg-transparent text-sm`}>
					{displayDate ? format(displayDate, "PPP") : placeholder}
					<ChevronDownIcon className="h-4 w-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-auto overflow-hidden p-0 bg-background"
				align="start">
				<Calendar
					mode="single"
					selected={displayDate}
					onSelect={handleSelect}
					captionLayout="dropdown"
					fromYear={1950}
					toYear={new Date().getFullYear()}
					disabled={(date) => {
						if (maxDate && date > maxDate) return true;
						if (minDate && date < minDate) return true;
						return false;
					}}
				/>
			</PopoverContent>
		</Popover>
	);
}
