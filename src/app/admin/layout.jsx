import { SWRConfig } from "swr";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/combinedComponents/adminSidebar";
import AdminNavbar from "@/components/combinedComponents/adminNavbar";
import AdminRoute from "@/context/AdminContext";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function AdminLayout({ children }) {
	return (
		<ThemeProvider
			attribute="class"
			defaultTheme="system"
			enableSystem
			disableTransitionOnChange>
			<main>
				<AdminRoute>
					<SWRConfig>
						<SidebarProvider>
							<AdminSidebar />
							<SidebarInset>
								<AdminNavbar />
								<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
									{children}
								</div>
							</SidebarInset>
						</SidebarProvider>
					</SWRConfig>
				</AdminRoute>
			</main>
		</ThemeProvider>
	);
}
