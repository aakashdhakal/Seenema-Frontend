"use client";

import Link from "next/link";
import { Icon } from "@iconify/react";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

export default function Footer() {
	const currentYear = new Date().getFullYear();

	const footerLinks = {
		explore: [
			{ name: "Home", href: "/" },
			{ name: "Movies", href: "/movies" },
			{ name: "Genres", href: "/genres" },
			{ name: "Popular", href: "/video/popular" },
		],
		support: [
			{ name: "Help Center", href: "/" },
			{ name: "Contact Us", href: "/" },
			{ name: "FAQ", href: "/faq" },
			{ name: "Report Issue", href: "/" },
		],
		legal: [
			{ name: "Terms of Service", href: "/" },
			{ name: "Privacy Policy", href: "/" },
			{ name: "Cookie Policy", href: "/" },
		],
	};

	const socialLinks = [
		{
			name: "Facebook",
			href: "https://facebook.com/seenema",
			icon: "solar:facebook-bold",
		},
		{
			name: "Twitter",
			href: "https://twitter.com/seenema",
			icon: "solar:twitter-bold",
		},
		{
			name: "Instagram",
			href: "https://instagram.com/seenema",
			icon: "solar:instagram-bold",
		},
		{
			name: "YouTube",
			href: "https://youtube.com/seenema",
			icon: "solar:youtube-bold",
		},
	];

	return (
		<footer className="bg-background border-t border-border">
			{/* Main Footer Content */}
			<div className="container mx-auto px-6 py-12">
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
					{/* Brand Section */}
					<div className="lg:col-span-2">
						<Link
							rel="preload"
							href="/"
							className="flex items-center gap-3 mb-6">
							<Image
								src="/4.png"
								alt="Seenema Logo"
								width={40}
								height={40}
								className="w-10 h-10 object-contain"
							/>
							<span className="text-2xl font-bold text-foreground">
								Seenema
							</span>
						</Link>

						<p className="text-muted-foreground mb-6 leading-relaxed">
							Your ultimate destination for premium streaming entertainment.
							Discover thousands of movies, TV shows, and exclusive content.
						</p>

						{/* Social Links */}
						<div className="flex gap-4">
							{socialLinks.map((social, index) => (
								<Link
									rel="preload"
									key={index}
									href={social.href}
									target="_blank"
									rel="noopener noreferrer"
									className="text-muted-foreground hover:text-primary transition-colors duration-200">
									<Icon icon={social.icon} className="w-6 h-6" />
									<span className="sr-only">{social.name}</span>
								</Link>
							))}
						</div>
					</div>

					{/* Links Sections */}
					<div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-8">
						{/* Explore */}
						<div>
							<h4 className="text-lg font-semibold mb-4 text-foreground">
								Explore
							</h4>
							<ul className="space-y-3">
								{footerLinks.explore.map((link, index) => (
									<li key={index}>
										<Link
											rel="preload"
											href={link.href}
											className="text-muted-foreground hover:text-primary transition-colors duration-200">
											{link.name}
										</Link>
									</li>
								))}
							</ul>
						</div>

						{/* Support */}
						<div>
							<h4 className="text-lg font-semibold mb-4 text-foreground">
								Support
							</h4>
							<ul className="space-y-3">
								{footerLinks.support.map((link, index) => (
									<li key={index}>
										<Link
											rel="preload"
											href={link.href}
											className="text-muted-foreground hover:text-primary transition-colors duration-200">
											{link.name}
										</Link>
									</li>
								))}
							</ul>
						</div>

						{/* Legal */}
						<div>
							<h4 className="text-lg font-semibold mb-4 text-foreground">
								Legal
							</h4>
							<ul className="space-y-3">
								{footerLinks.legal.map((link, index) => (
									<li key={index}>
										<Link
											rel="preload"
											href={link.href}
											className="text-muted-foreground hover:text-primary transition-colors duration-200">
											{link.name}
										</Link>
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
			</div>

			<Separator />

			{/* Bottom Bar */}
			<div className="container mx-auto px-6 py-6">
				<div className="flex flex-col md:flex-row justify-between items-center gap-4">
					<div className="flex items-center gap-4">
						<p className="text-sm text-muted-foreground">
							© {currentYear} Seenema. All rights reserved.
						</p>
					</div>

					<div className="flex items-center gap-6 text-sm text-muted-foreground">
						<div className="flex items-center gap-2">
							<Icon icon="solar:help-bold" className="w-4 h-4" />
							<Link
								rel="preload"
								href="/help"
								className="hover:text-primary transition-colors">
								Help
							</Link>
						</div>
						<div className="flex items-center gap-2">
							<Icon icon="solar:shield-check-bold" className="w-4 h-4" />
							<span>Secure</span>
						</div>
					</div>
				</div>
			</div>
		</footer>
	);
}
