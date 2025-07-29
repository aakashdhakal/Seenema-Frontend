"use client";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export default function CustomAlertDialog(props) {
	return (
		<AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
			<AlertDialogTrigger asChild>
				{props.triggerText && (
					<Button
						variant={props.varient}
						className={props.triggerClassname}
						size={props.size}>
						{props.triggerText}
					</Button>
				)}
			</AlertDialogTrigger>
			<AlertDialogContent className="w-full">
				<AlertDialogHeader>
					<AlertDialogTitle>{props.alertTitle}</AlertDialogTitle>
					<AlertDialogDescription>
						{props.alertDescription}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>{props.cancelText}</AlertDialogCancel>
					<AlertDialogAction asChild>
						<Button variant="destructive" onClick={props.action}>
							{props.actionText}
						</Button>
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
