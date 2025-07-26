"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AccessDenied() {
	const router = useRouter();

	const handleGoBack = () => {
		router.back();
	};

	return (
		<div className="min-h-screen bg-background flex items-center justify-center p-6">
			<div className="w-full max-w-md">
				<Card className="border-destructive/20 shadow-lg">
					<CardHeader className="text-center pb-6">
						<div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
							<Icon
								icon="solar:shield-cross-bold"
								className="h-10 w-10 text-destructive"
							/>
						</div>
						<CardTitle className="text-2xl font-bold text-destructive">
							Access Denied
						</CardTitle>
						<p className="text-muted-foreground">
							You don't have permission to access this page
						</p>
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="text-center space-y-2">
							<p className="text-sm text-muted-foreground">
								This area is restricted to authorized administrators only.
							</p>
							<p className="text-sm text-muted-foreground">
								If you believe this is an error, please contact support.
							</p>
						</div>

						<div className="space-y-3">
							<Button
								onClick={handleGoBack}
								className="w-full bg-primary hover:bg-primary/90">
								<Icon icon="solar:arrow-left-bold" className="h-4 w-4 mr-2" />
								Go Back
							</Button>
							<Button variant="outline" asChild className="w-full">
								<Link href="/">
									<Icon icon="solar:home-2-bold" className="h-4 w-4 mr-2" />
									Return to Home
								</Link>
							</Button>
						</div>

						<div className="pt-4 border-t">
							<div className="flex items-center justify-center space-x-4 text-xs text-muted-foreground">
								<Link
									href="/contact"
									className="hover:text-foreground transition-colors">
									Contact Support
								</Link>
								<span>•</span>
								<Link
									href="/login"
									className="hover:text-foreground transition-colors">
									Sign In
								</Link>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Additional Info */}
				<div className="mt-6 text-center">
					<div className="inline-flex items-center space-x-2 text-xs text-muted-foreground bg-card/50 backdrop-blur-sm rounded-lg px-3 py-2 border">
						<Icon icon="solar:info-circle-bold" className="h-4 w-4" />
						<span>Error Code: 403 - Forbidden</span>
					</div>
				</div>
			</div>
		</div>
	);
}
