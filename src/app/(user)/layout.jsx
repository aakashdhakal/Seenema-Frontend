import Navbar from "@/components/combinedComponents/Navbar";
import Footer from "@/components/combinedComponents/Footer";

export default function UserLayout({ children }) {
	return (
		<div className="dark">
			<Navbar />
			{children}
			<Footer />
		</div>
	);
}
