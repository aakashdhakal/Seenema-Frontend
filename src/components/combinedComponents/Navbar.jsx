"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import UserAvatar from "../singleComponents/UserAvatar";
import Image from "next/image";

export default function Navbar() {
	const [isScrolled, setIsScrolled] = useState(false);
	const pathname = usePathname();

	useEffect(() => {
		const handleScroll = () => {
			setIsScrolled(window.scrollY > 50);
		};

		window.addEventListener("scroll", handleScroll);
		// Clean up the event listener on component unmount
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	const navLinks = [
		{ href: "/", label: "Home" },
		{ href: "/shows", label: "TV Shows" },
		{ href: "/movies", label: "Movies" },
	];

	return (
		<header
			className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
				isScrolled
					? "bg-background/90 backdrop-blur-md shadow-emerald"
					: "bg-gradient-to-b from-background/80 to-transparent"
			}`}>
			<div className=" px-4 sm:px-6 lg:px-8">
				<nav className="flex items-center justify-between h-20">
					{/* Left Side: Logo & Nav Links */}
					<Link href="/">
						<Image src={"/3.png"} alt="Seenema Logo" width={150} height={20} />
					</Link>

					{/* Desktop Navigation Links */}
					<div className="hidden md:flex items-center space-x-6 font-nunito">
						{navLinks.map((link) => (
							<Button
								key={link.href}
								variant="link"
								asChild
								className={`p-0 text-md transition-colors   ${
									pathname === link.href
										? "text-primary font-bold"
										: "text-muted-foreground hover:text-foreground"
								}`}>
								<Link href={link.href}>{link.label}</Link>
							</Button>
						))}
					</div>

					{/* Right Side: Actions & Profile */}
					<div className="flex items-center space-x-2 sm:space-x-4">
						<Button
							variant="ghost"
							size="icon"
							className="text-muted-foreground hover:text-primary">
							<Icon icon="stash:search" width="2em" height="2em" />{" "}
							<span className="sr-only">Search</span>
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="text-muted-foreground hover:text-primary">
							<Icon icon="solar:bell-bold" className="w-5 h-5" />
							<span className="sr-only">Notifications</span>
						</Button>

						<UserAvatar src="https://avatar.iran.liara.run/public" />
					</div>
				</nav>
			</div>
		</header>
	);
}
