import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Icon } from "@iconify/react";

export default function ComboBox({
	items = [],
	value,
	onValueChange,
	placeholder = "Choose item",
	searchPlaceholder = "Search items...",
	emptyMessage = "No item found.",
	className = "",
}) {
	const [open, setOpen] = useState(false);

	const selectedItem = items.find(
		(item) => item.value?.toString() === value?.toString(),
	);
	return (
		<Popover open={open} onOpenChange={setOpen} className="w-full">
			<PopoverTrigger asChild>
				<Button variant="outline" className={`justify-between  ${className}`}>
					{selectedItem ? selectedItem.label : placeholder}
					<Icon icon="solar:alt-arrow-down-bold" className="h-4 w-4" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
				<Command>
					<CommandInput placeholder={searchPlaceholder} />
					<CommandList>
						<CommandEmpty>{emptyMessage}</CommandEmpty>
						<CommandGroup>
							{items.map((item) => (
								<CommandItem
									key={item.value}
									value={item.label}
									onSelect={() => {
										onValueChange(item.value);
										setOpen(false);
									}}>
									{item.label}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
