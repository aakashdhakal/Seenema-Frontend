import { SWRConfig } from "swr";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/combinedComponents/adminSidebar";
import AdminNavbar from "@/components/combinedComponents/adminNavbar";

export default function RootLayout({ children }) {
	return (
		<main>
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
		</main>
	);
}
