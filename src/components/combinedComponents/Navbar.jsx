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
			icon: "flowbite:home-solid",
		},
		{
			href: "/movies",
			label: "Movies",
			icon: "fluent:movies-and-tv-24-filled",
		},
		{
			href: "/genres",
			label: "Genres",
			icon: "iconamoon:category-fill",
		},
		{
			href: "/watchlist",
			label: "My List",
			icon: "fluent:bookmark-multiple-20-filled",
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
				<nav className="flex items-center justify-between h-16">
					{/* Logo */}
					<Link href="/home" className="flex items-center space-x-2">
						<div className="flex items-center">
							<Image
								src="/3.png"
								alt="Seenema Logo"
								width={120}
								height={50}
								className="h-10 w-auto"
							/>
						</div>
					</Link>

					{/* Desktop Navigation Links */}
					<div className="hidden md:flex items-center space-x-1">
						{navLinks.map((link) => {
							const isActive = pathname === link.href;

							return (
								<Link
									key={link.href}
									href={link.href}
									className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium ${
										isActive
											? "text-primary bg-primary/10"
											: "text-foreground/70 hover:text-foreground hover:bg-accent/50"
									}`}>
									<Icon
										icon={link.icon}
										className={`w-4 h-4 ${
											isActive ? "text-primary" : "text-foreground/70"
										}`}
									/>
									<span>{link.label}</span>
								</Link>
							);
						})}
					</div>

					{/* Right Side: Search, Profile, Menu */}
					<div className="flex items-center space-x-2">
						{/* Search Button */}
						<Button
							variant="ghost"
							size="sm"
							className="text-foreground/70 hover:text-foreground hover:bg-accent/50 transition-colors">
							<Icon icon="solar:magnifer-bold-duotone" className="w-4 h-4" />
							<span className="sr-only">Search</span>
						</Button>

						{/* User Avatar with Loading State */}
						{loading || !user ? (
							<Skeleton className="h-8 w-8 rounded-full" />
						) : (
							<div className="flex items-center space-x-2">
								<UserAvatar
									src={user.user.profile_picture}
									fallback={user.user.name?.charAt(0).toUpperCase() || "U"}
									className="h-8 w-8"
								/>

								{/* User Menu Button (Desktop) */}
								<Button
									variant="ghost"
									size="sm"
									onClick={() => logout()}
									className="hidden md:flex text-foreground/70 hover:text-foreground hover:bg-accent/50 transition-colors">
									<Icon icon="solar:logout-bold-duotone" className="w-4 h-4" />
									<span className="sr-only">Logout</span>
								</Button>
							</div>
						)}

						{/* Mobile Menu Button */}
						<Button
							variant="ghost"
							size="sm"
							className="md:hidden text-foreground/70 hover:text-foreground hover:bg-accent/50 transition-colors"
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
							<Icon
								icon={
									isMobileMenuOpen
										? "solar:close-square-bold-duotone"
										: "solar:hamburger-menu-bold-duotone"
								}
								className="w-4 h-4"
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
												: "text-foreground/70 hover:text-foreground hover:bg-accent/50"
										}`}
										onClick={() => setIsMobileMenuOpen(false)}>
										<Icon
											icon={link.icon}
											className={`w-5 h-5 ${
												isActive ? "text-primary" : "text-foreground/70"
											}`}
										/>
										<span className="text-base font-medium">{link.label}</span>
									</Link>
								);
							})}

							{/* Mobile Logout */}
							<Button
								variant="ghost"
								onClick={() => {
									logout();
									setIsMobileMenuOpen(false);
								}}
								className="w-full justify-start text-foreground/70 hover:text-foreground hover:bg-accent/50 transition-colors px-3 py-3">
								<Icon
									icon="solar:logout-bold-duotone"
									className="w-5 h-5 mr-3"
								/>
								<span className="text-base font-medium">Logout</span>
							</Button>
						</div>
					</div>
				)}
			</div>
		</header>
	);
}
