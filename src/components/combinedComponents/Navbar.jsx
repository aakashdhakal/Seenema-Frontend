"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import UserAvatar from "../singleComponents/UserAvatar";
import Image from "next/image";
import { useAuthContext } from "@/context/AuthContext";
import NotificationComponent from "./NotificationComponent";

export default function Navbar() {
	const [isScrolled, setIsScrolled] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [mounted, setMounted] = useState(false);
	const pathname = usePathname();
	const router = useRouter();
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
			href: "/",
			label: "Home",
			icon: "material-symbols:home-outline",
		},
		{
			href: "/movies",
			label: "Movies",
			icon: "material-symbols:movie-outline",
		},
		{
			href: "/watchlist",
			label: "My List",
			icon: "material-symbols:bookmark-outline",
		},
	];

	const handleSearch = (e) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			router.push(`/search/${encodeURIComponent(searchQuery.trim())}`);
			setSearchQuery("");
			setIsMobileMenuOpen(false);
		}
	};

	const handleLogout = () => {
		logout();
		setIsMobileMenuOpen(false);
	};

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
					<Link
						rel="preload"
						href="/"
						className="flex items-center space-x-2 flex-shrink-0">
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
					<div className="hidden lg:flex items-center space-x-1">
						{navLinks.map((link) => {
							const isActive = pathname === link.href;

							return (
								<Link
									rel="preload"
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

					{/* Search Bar & Right Side Controls */}
					<div className="flex items-center space-x-3">
						{/* Search Bar - Always Visible on Desktop */}
						<div className="hidden md:flex items-center">
							<form onSubmit={handleSearch} className="relative">
								<div className="relative w-80">
									<Input
										type="text"
										placeholder="Search movies, shows..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="pr-12 bg-background/80 border-border/50 focus:border-primary transition-colors"
									/>
									<Button
										type="submit"
										size="sm"
										variant="ghost"
										className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0 text-foreground/70 hover:text-foreground z-10 pointer-events-auto">
										<Icon icon="material-symbols:search" className="w-4 h-4" />
									</Button>
								</div>
							</form>
						</div>
						{/* Notifications Dropdown */}
						<NotificationComponent />

						{/* Divider */}

						{/* User Profile Dropdown */}
						{loading || !user ? (
							<Skeleton className="h-8 w-8 rounded-full" />
						) : (
							<DropdownMenu modal={false}>
								<DropdownMenuTrigger asChild>
									{loading ? (
										<Skeleton className="h-8 w-8 rounded-full" />
									) : (
										<Button
											variant="ghost"
											className="relative h-8 w-8 rounded-full p-0 hover:bg-accent/50 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
											<UserAvatar
												src={user.profile_picture}
												fallback={user.name}
												className="h-8 w-8"
											/>
										</Button>
									)}
								</DropdownMenuTrigger>
								<DropdownMenuContent
									className="w-40 mt-2 ml-2"
									align="end"
									forceMount>
									<DropdownMenuLabel className="font-normal">
										<div className="flex flex-col space-y-1 justify-center">
											<p className="text-sm font-medium leading-none text-center">
												{user.name || "User"}
											</p>
										</div>
									</DropdownMenuLabel>
									<DropdownMenuSeparator />
									{user.role === "admin" && (
										<DropdownMenuItem asChild>
											<Link
												rel="preload"
												href="/admin"
												className="cursor-pointer">
												<Icon
													icon="material-symbols:admin-panel-settings"
													className="mr-2 h-4 w-4"
												/>
												<span>Admin Panel</span>
											</Link>
										</DropdownMenuItem>
									)}
									<DropdownMenuItem asChild>
										<Link
											rel="preload"
											href="/profile"
											className="cursor-pointer">
											<Icon
												icon="material-symbols:person-outline"
												className="mr-2 h-4 w-4"
											/>
											<span>Profile</span>
										</Link>
									</DropdownMenuItem>

									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={handleLogout}
										className={"cursor-pointer"}>
										<Icon
											icon="material-symbols:logout"
											className="mr-2 h-4 w-4"
										/>
										<span>Log out</span>
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						)}

						{/* Mobile Menu Button */}
						<Button
							variant="ghost"
							size="sm"
							className="lg:hidden text-foreground/70 hover:text-foreground hover:bg-accent/50 transition-colors"
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
							<Icon
								icon={
									isMobileMenuOpen
										? "material-symbols:close"
										: "material-symbols:menu"
								}
								className="w-4 h-4"
							/>
							<span className="sr-only">Toggle menu</span>
						</Button>
					</div>
				</nav>

				{/* Mobile Navigation Menu */}
				{isMobileMenuOpen && (
					<div className="lg:hidden border-t border-border">
						<div className="px-2 pt-2 pb-3 space-y-1 backdrop-blur-md bg-background/95">
							{/* Mobile Search */}
							<div className="px-3 py-2">
								<form onSubmit={handleSearch} className="relative">
									<Input
										type="text"
										placeholder="Search movies, shows..."
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										className="pr-10 bg-background/80 border-border/50 focus:border-primary transition-colors"
									/>
									<Button
										type="submit"
										size="sm"
										variant="ghost"
										className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-foreground/70 hover:text-foreground">
										<Icon icon="material-symbols:search" className="w-4 h-4" />
									</Button>
								</form>
							</div>

							{/* Mobile Nav Links */}
							{navLinks.map((link) => {
								const isActive = pathname === link.href;

								return (
									<Link
										rel="preload"
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

							{/* Mobile Profile Links */}
							<div className="border-t border-border pt-2 mt-2">
								<Link
									rel="preload"
									href="/profile"
									className="flex items-center space-x-3 px-3 py-3 rounded-lg text-foreground/70 hover:text-foreground hover:bg-accent/50 transition-all duration-200"
									onClick={() => setIsMobileMenuOpen(false)}>
									<Icon
										icon="material-symbols:person-outline"
										className="w-5 h-5"
									/>
									<span className="text-base font-medium">Profile</span>
								</Link>

								<Button
									variant="ghost"
									onClick={handleLogout}
									className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors px-3 py-3 h-auto">
									<Icon
										icon="material-symbols:logout"
										className="w-5 h-5 mr-3"
									/>
									<span className="text-base font-medium">Logout</span>
								</Button>
							</div>
						</div>
					</div>
				)}
			</div>
		</header>
	);
}
