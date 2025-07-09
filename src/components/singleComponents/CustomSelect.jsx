import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

export default function CustomSelect({ label, options = [], ...rest }) {
	return (
		<Select {...rest}>
			<SelectTrigger className="w-full overflow-hidden">
				{/* Added overflow-hidden */}
				<SelectValue placeholder={label} />
				{/* Added truncate */}
			</SelectTrigger>
			<SelectContent className="w-[var(--radix-select-trigger-width)] max-w-full">
				{options.map((option, index) => (
					<SelectItem
						key={index}
						value={option.value.toString()}
						className="whitespace-normal">
						{option.label}
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	);
}
