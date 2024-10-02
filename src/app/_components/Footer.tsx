import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-gray-800 text-white py-8">
            <div className="container mx-auto px-6 text-center">
                <p>&copy; {new Date().getFullYear()} Lead Full Stack Developer. All rights reserved.</p>
                <nav className="flex justify-center gap-4 mt-4">
                    <Link href="#" className="text-xs underline-offset-4 hover:underline">Privacy</Link>
                    <Link href="#" className="text-xs underline-offset-4 hover:underline">Terms</Link>
                </nav>
            </div>
        </footer>
    )
}