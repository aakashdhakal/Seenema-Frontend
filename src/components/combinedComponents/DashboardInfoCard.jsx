"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

export default function DashboardInfoCard({
	title,
	value,
	subtitle,
	icon,
	iconColor = "text-muted-foreground",
	loading = false,
	className = "",
	onClick,
	...props
}) {
	// Format large numbers
	const formatValue = (val) => {
		if (typeof val !== "number") return val;
		if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
		if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
		return val.toLocaleString();
	};

	return (
		<Card
			className={cn(
				"transition-all duration-200 hover:shadow-md",
				onClick && "cursor-pointer hover:scale-[1.02]",
				className,
			)}
			onClick={onClick}
			{...props}>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">{title}</CardTitle>
				{icon && <Icon icon={icon} className={cn("h-4 w-4", iconColor)} />}
			</CardHeader>
			<CardContent>
				{loading ? (
					<div className="space-y-2">
						<Skeleton className="h-8 w-20" />
						<Skeleton className="h-4 w-32" />
					</div>
				) : (
					<>
						<div className="text-2xl font-bold">{formatValue(value)}</div>
						{subtitle && (
							<p className="text-xs text-muted-foreground">{subtitle}</p>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}
