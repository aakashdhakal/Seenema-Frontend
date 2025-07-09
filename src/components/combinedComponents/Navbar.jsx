"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserAvatar from "../singleComponents/UserAvatar";
import Image from "next/image";
import { useAuthContext } from "@/context/AuthContext";

export default function Navbar() {
	const [isScrolled, setIsScrolled] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const pathname = usePathname();
	const { logout, user, loading } = useAuthContext();

	// Handle hydration
	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 50);
		};

		window.addEventListener("scroll", handleScroll);
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const navLinks = [
		{
			href: "/home",
			label: "Home",
			icon: "fluent:home-28-regular",
		},
		{
			href: "/shows",
			label: "TV Shows",
			icon: "solar:tv-linear",
		},
		{
			href: "/movies",
			label: "Movies",
			icon: "ic:outline-movie",
		},
	];

	if (!mounted) return null;

	return (
		<header
			className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
				isScrolled
					? "bg-background/95 backdrop-blur-md shadow-lg border-b border-border"
					: "bg-gradient-to-b from-background/80 to-transparent"
			}`}>
			<div className="container mx-auto px-4 sm:px-6 lg:px-8">
				<nav className="flex items-center justify-between h-20">
					{/* Logo */}
					<Link href="/home" className="flex items-center space-x-2">
						<div className="flex items-center">
							<Image src="/3.png" alt="Seenema Logo" width={150} height={50} />
						</div>
					</Link>

					{/* Desktop Navigation Links */}
					<div className="hidden md:flex items-center space-x-8">
						{navLinks.map((link) => {
							const isActive = pathname === link.href;

							return (
								<Link
									key={link.href}
									href={link.href}
									className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-200 group ${
										isActive
											? "text-primary bg-primary/10"
											: "text-foreground/80 hover:text-foreground hover:bg-accent"
									}`}>
									<Icon
										icon={link.icon}
										className={`w-4 h-4 transition-transform group-hover:scale-110 ${
											isActive ? "text-primary" : "text-foreground/80"
										}`}
									/>
									<span className="text-sm font-medium">{link.label}</span>
								</Link>
							);
						})}
					</div>

					{/* Right Side: Search, Notifications, Profile */}
					<div className="flex items-center space-x-3">
						{/* Search Button */}
						<Button
							variant="ghost"
							size="icon"
							className="text-foreground/80 hover:text-foreground hover:bg-accent transition-colors">
							<Icon icon="solar:magnifer-bold-duotone" className="w-5 h-5" />
							<span className="sr-only">Search</span>
						</Button>

						{/* Notifications */}
						<Button
							variant="ghost"
							size="icon"
							className="text-foreground/80 hover:text-foreground hover:bg-accent transition-colors relative">
							<Icon icon="solar:bell-bold-duotone" className="w-5 h-5" />
							{/* Notification dot */}
							<div className="absolute -top-1 -right-1 w-3 h-3 bg-destructive rounded-full border-2 border-background"></div>
							<span className="sr-only">Notifications</span>
						</Button>

						{/* logout btn */}
						<Button
							variant="ghost"
							size="icon"
							onClick={() => logout()}
							className="text-foreground/80 hover:text-foreground hover:bg-accent transition-colors">
							<Icon icon="solar:logout-bold-duotone" className="w-5 h-5" />
							<span className="sr-only">Logout</span>
						</Button>

						{/* User Avatar with Loading State */}
						{loading || !user ? (
							<Skeleton className="h-10 w-10 rounded-full" />
						) : (
							<UserAvatar
								src={user.user.profile_picture}
								fallback={user.user.name?.charAt(0).toUpperCase() || "U"}
							/>
						)}

						{/* Mobile Menu Button */}
						<Button
							variant="ghost"
							size="icon"
							className="md:hidden text-foreground/80 hover:text-foreground hover:bg-accent transition-colors"
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
							<Icon
								icon={
									isMobileMenuOpen
										? "solar:close-square-bold-duotone"
										: "solar:hamburger-menu-bold-duotone"
								}
								className="w-5 h-5"
							/>
							<span className="sr-only">Toggle menu</span>
						</Button>
					</div>
				</nav>

				{/* Mobile Navigation Menu */}
				{isMobileMenuOpen && (
					<div className="md:hidden border-t border-border">
						<div className="px-2 pt-2 pb-3 space-y-1 backdrop-blur-md bg-background/95">
							{navLinks.map((link) => {
								const isActive = pathname === link.href;

								return (
									<Link
										key={link.href}
										href={link.href}
										className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
											isActive
												? "text-primary bg-primary/10 border-l-4 border-primary"
												: "text-foreground/80 hover:text-foreground hover:bg-accent"
										}`}
										onClick={() => setIsMobileMenuOpen(false)}>
										<Icon
											icon={link.icon}
											className={`w-5 h-5 ${
												isActive ? "text-primary" : "text-foreground/80"
											}`}
										/>
										<span className="text-base font-medium">{link.label}</span>
									</Link>
								);
							})}
						</div>
					</div>
				)}
			</div>
		</header>
	);
}
