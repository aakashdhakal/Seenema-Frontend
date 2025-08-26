"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/context/AuthContext";
import Link from "next/link";

export default function SuspendedPage() {
	const router = useRouter();
	const { logout } = useAuthContext();

	const handleLogout = async () => {
		await logout();
		router.push("/");
	};

	const handleSupport = () => {
		// You can replace this with your actual support contact method
		window.location.href =
			"mailto:support@seenema.aakashdhakal.com.np?subject=Account Suspension Appeal";
	};

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-6">
			<div className="w-full max-w-md">
				<Card className="border-orange-500/20 shadow-lg">
					<CardHeader className="text-center pb-6">
						<div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-orange-500/10">
							<Icon
								icon="solar:shield-warning-bold"
								className="h-10 w-10 text-orange-500"
							/>
						</div>
						<CardTitle className="text-2xl font-bold text-orange-600">
							Account Suspended
						</CardTitle>
						<p className="text-muted-foreground">
							Your account has been temporarily suspended
						</p>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-4">
							<div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
								<div className="flex items-start space-x-3">
									<Icon
										icon="solar:info-circle-bold"
										className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0"
									/>
									<div className="space-y-2">
										<h3 className="font-semibold text-orange-800 dark:text-orange-300">
											Why was my account suspended?
										</h3>
										<p className="text-sm text-orange-700 dark:text-orange-400">
											Your account has been suspended due to a violation of our
											community guidelines or terms of service.
										</p>
									</div>
								</div>
							</div>

							<div className="space-y-3">
								<h3 className="font-semibold text-foreground">
									What happens next?
								</h3>
								<ul className="space-y-2 text-sm text-muted-foreground">
									<li className="flex items-start space-x-2">
										<Icon
											icon="solar:check-circle-bold"
											className="w-4 h-4 mt-0.5 text-green-600"
										/>
										<span>Our team will review your account</span>
									</li>
									<li className="flex items-start space-x-2">
										<Icon
											icon="solar:clock-circle-bold"
											className="w-4 h-4 mt-0.5 text-blue-600"
										/>
										<span>Review typically takes 1-3 business days</span>
									</li>
									<li className="flex items-start space-x-2">
										<Icon
											icon="solar:letter-bold"
											className="w-4 h-4 mt-0.5 text-purple-600"
										/>
										<span>You'll receive an email with the outcome</span>
									</li>
								</ul>
							</div>
						</div>

						<div className="space-y-3">
							<Button
								onClick={handleSupport}
								className="w-full bg-orange-500 hover:bg-orange-600 text-white">
								<Icon icon="solar:support-bold" className="h-4 w-4 mr-2" />
								Contact Support
							</Button>
							<Button
								onClick={handleLogout}
								variant="outline"
								className="w-full">
								<Icon icon="solar:logout-2-bold" className="h-4 w-4 mr-2" />
								Sign Out
							</Button>
						</div>
					</CardContent>
				</Card>

				{/* Additional Info */}
				<div className="mt-6 text-center">
					<div className="inline-flex items-center space-x-2 text-xs text-muted-foreground bg-card/50 backdrop-blur-sm rounded-lg px-3 py-2 border">
						<Icon icon="solar:danger-triangle-bold" className="h-4 w-4" />
						<span>Account Status: Temporarily Suspended</span>
					</div>
				</div>
			</div>
		</div>
	);
}
