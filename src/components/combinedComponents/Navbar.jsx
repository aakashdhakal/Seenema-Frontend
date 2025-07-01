"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserAvatar from "../singleComponents/UserAvatar";
import Image from "next/image";
import { useTheme } from "next-themes";

export default function Navbar() {
	const [isScrolled, setIsScrolled] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const pathname = usePathname();
	const { theme, setTheme } = useTheme();

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
					? theme === "dark"
						? "bg-slate-950/95 backdrop-blur-md shadow-lg border-b border-slate-800"
						: "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200"
					: theme === "dark"
					? "bg-gradient-to-b from-slate-950/80 to-transparent"
					: "bg-gradient-to-b from-white/80 to-transparent"
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
											: theme === "dark"
											? "text-slate-300 hover:text-white hover:bg-slate-800/50"
											: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
									}`}>
									<Icon
										icon={link.icon}
										className={`w-4 h-4 transition-transform group-hover:scale-110 ${
											isActive
												? "text-primary"
												: theme === "dark"
												? "text-slate-300"
												: "text-gray-600"
										}`}
									/>
									<span className="text-sm font-medium">{link.label}</span>
								</Link>
							);
						})}
					</div>

					{/* Right Side: Search, Notifications, Profile */}
					<div className="flex items-center space-x-3">
						{/* Theme Toggle Button */}
						<Button
							variant="ghost"
							size="icon"
							className={`transition-colors ${
								theme === "dark"
									? "text-slate-300 hover:text-white hover:bg-slate-800/50"
									: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
							}`}
							onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
							<Icon
								icon={
									theme === "dark"
										? "solar:sun-bold-duotone"
										: "solar:moon-bold-duotone"
								}
								className="w-5 h-5"
							/>
							<span className="sr-only">Toggle Theme</span>
						</Button>

						{/* Search Button */}
						<Button
							variant="ghost"
							size="icon"
							className={`transition-colors ${
								theme === "dark"
									? "text-slate-300 hover:text-white hover:bg-slate-800/50"
									: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
							}`}>
							<Icon icon="solar:magnifer-bold-duotone" className="w-5 h-5" />
							<span className="sr-only">Search</span>
						</Button>

						{/* Notifications */}
						<Button
							variant="ghost"
							size="icon"
							className={`transition-colors relative ${
								theme === "dark"
									? "text-slate-300 hover:text-white hover:bg-slate-800/50"
									: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
							}`}>
							<Icon icon="solar:bell-bold-duotone" className="w-5 h-5" />
							{/* Notification dot */}
							<div
								className={`absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 ${
									theme === "dark" ? "border-slate-950" : "border-white"
								}`}></div>
							<span className="sr-only">Notifications</span>
						</Button>

						{/* User Avatar */}
						<UserAvatar src="https://avatar.iran.liara.run/public" />
						<Button
							variant="ghost"
							size="icon"
							className={`transition-colors relative ${
								theme === "dark"
									? "text-slate-300 hover:text-white hover:bg-slate-800/50"
									: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
							}`}>
							<Icon icon="solar:bell-bold-duotone" className="w-5 h-5" />
							{/* Notification dot */}
							<div
								className={`absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 ${
									theme === "dark" ? "border-slate-950" : "border-white"
								}`}></div>
							<span className="sr-only">Notifications</span>
						</Button>

						{/* Mobile Menu Button */}
						<Button
							variant="ghost"
							size="icon"
							className={`md:hidden transition-colors ${
								theme === "dark"
									? "text-slate-300 hover:text-white hover:bg-slate-800/50"
									: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
							}`}
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
					<div
						className={`md:hidden border-t ${
							theme === "dark" ? "border-slate-800" : "border-gray-200"
						}`}>
						<div
							className={`px-2 pt-2 pb-3 space-y-1 backdrop-blur-md ${
								theme === "dark" ? "bg-slate-950/95" : "bg-white/95"
							}`}>
							{navLinks.map((link) => {
								const isActive = pathname === link.href;

								return (
									<Link
										key={link.href}
										href={link.href}
										className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
											isActive
												? "text-primary bg-primary/10 border-l-4 border-primary"
												: theme === "dark"
												? "text-slate-300 hover:text-white hover:bg-slate-800/50"
												: "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
										}`}
										onClick={() => setIsMobileMenuOpen(false)}>
										<Icon
											icon={link.icon}
											className={`w-5 h-5 ${
												isActive
													? "text-primary"
													: theme === "dark"
													? "text-slate-300"
													: "text-gray-600"
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
