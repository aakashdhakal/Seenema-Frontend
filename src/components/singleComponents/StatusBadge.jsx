import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";

const statusConfigs = {
	// Video Processing Status
	video: {
		pending: {
			color:
				"bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700",
			icon: "solar:clock-circle-bold-duotone",
		},
		processing: {
			color:
				"bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700",
			icon: "solar:refresh-bold-duotone",
		},
		ready: {
			color:
				"bg-green-100 text-green-800 border border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700",
			icon: "solar:check-circle-bold-duotone",
		},
		failed: {
			color:
				"bg-red-100 text-red-800 border border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700",
			icon: "solar:close-circle-bold-duotone",
		},
		uploaded: {
			color:
				"bg-green-100 text-green-800 border border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700",
			icon: "solar:cloud-upload-bold-duotone",
		},
		private: {
			color:
				"bg-gray-100 text-gray-800 border border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600",
			icon: "solar:lock-bold-duotone",
		},
		public: {
			color:
				"bg-green-100 text-green-800 border border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700",
			icon: "solar:eye-bold-duotone",
		},
	},

	// User Roles
	user: {
		admin: {
			color:
				"bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700",
			icon: "solar:shield-user-bold-duotone",
		},
		user: {
			color:
				"bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700",
			icon: "solar:user-bold-duotone",
		},
		moderator: {
			color:
				"bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700",
			icon: "solar:shield-check-bold-duotone",
		},
		guest: {
			color:
				"bg-gray-100 text-gray-800 border border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600",
			icon: "solar:user-speak-bold-duotone",
		},
	},

	// Account Status
	account: {
		active: {
			color:
				"bg-green-100 text-green-800 border border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700",
			icon: "solar:check-circle-bold-duotone",
		},
		inactive: {
			color:
				"bg-gray-100 text-gray-800 border border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600",
			icon: "solar:pause-circle-bold-duotone",
		},
		suspended: {
			color:
				"bg-red-100 text-red-800 border border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700",
			icon: "solar:forbidden-circle-bold-duotone",
		},
		banned: {
			color:
				"bg-red-100 text-red-800 border border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700",
			icon: "solar:danger-circle-bold-duotone",
		},
	},

	// Email Verification Status
	verification: {
		verified: {
			color:
				"bg-green-100 text-green-800 border border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700",
			icon: "solar:check-circle-bold-duotone",
		},
		unverified: {
			color:
				"bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700",
			icon: "solar:danger-triangle-bold-duotone",
		},
		pending: {
			color:
				"bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700",
			icon: "solar:clock-circle-bold-duotone",
		},
	},

	// Priority/Importance
	priority: {
		low: {
			color:
				"bg-green-100 text-green-800 border border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700",
			icon: "solar:arrow-down-bold-duotone",
		},
		medium: {
			color:
				"bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700",
			icon: "solar:minus-circle-bold-duotone",
		},
		high: {
			color:
				"bg-orange-100 text-orange-800 border border-orange-300 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700",
			icon: "solar:arrow-up-bold-duotone",
		},
		urgent: {
			color:
				"bg-red-100 text-red-800 border border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700",
			icon: "solar:fire-bold-duotone",
		},
	},

	// General Status
	general: {
		success: {
			color:
				"bg-green-100 text-green-800 border border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700",
			icon: "solar:check-circle-bold-duotone",
		},
		error: {
			color:
				"bg-red-100 text-red-800 border border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700",
			icon: "solar:close-circle-bold-duotone",
		},
		warning: {
			color:
				"bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700",
			icon: "solar:danger-triangle-bold-duotone",
		},
		info: {
			color:
				"bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700",
			icon: "solar:info-circle-bold-duotone",
		},
	},

	// Connection Status
	connection: {
		connected: {
			color:
				"bg-green-100 text-green-800 border border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700",
			icon: "solar:wi-fi-router-bold-duotone",
		},
		disconnected: {
			color:
				"bg-red-100 text-red-800 border border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700",
			icon: "solar:wi-fi-router-minimalistic-bold-duotone",
		},
		connecting: {
			color:
				"bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900 dark:text-yellow-200 dark:border-yellow-700",
			icon: "solar:refresh-bold-duotone",
		},
	},

	// Count/Notification badges
	count: {
		notification: {
			color:
				"bg-red-500 text-white border border-red-600 dark:bg-red-600 dark:text-white dark:border-red-500",
			icon: "solar:bell-bold-duotone",
		},
		count: {
			color:
				"bg-gray-500 text-white border border-gray-600 dark:bg-gray-600 dark:text-white dark:border-gray-500",
			icon: "solar:hashtag-bold-duotone",
		},
	},
};

export const StatusBadge = ({
	type = "general",
	status,
	showIcon = false,
	className = "",
	size = "default",
	children,
	...props
}) => {
	const config = statusConfigs[type]?.[status] || statusConfigs.general.info;
	const capitalizedStatus = status?.charAt(0).toUpperCase() + status?.slice(1);

	const sizeClasses = {
		sm: "text-xs px-2 py-0.5",
		default: "text-sm px-2.5 py-1",
		lg: "text-base px-3 py-1.5",
	};

	return (
		<Badge
			variant="default"
			className={cn(
				"font-medium rounded-full inline-flex items-center gap-1.5 transition-none hover:bg-none",
				config.color,
				sizeClasses[size],
				className,
			)}
			{...props}>
			{showIcon && <Icon icon={config.icon} className="h-3 w-3" />}
			{children ? children : capitalizedStatus}
		</Badge>
	);
};

export const StatusIcon = ({
	type = "general",
	status,
	className = "",
	size = "default",
}) => {
	const config = statusConfigs[type]?.[status] || statusConfigs.general.info;

	const sizeClasses = {
		sm: "h-4 w-4",
		default: "h-5 w-5",
		lg: "h-6 w-6",
	};

	return (
		<Icon
			icon={config.icon}
			className={cn("text-gray-500", sizeClasses[size], className)}
		/>
	);
};

export default StatusBadge;
