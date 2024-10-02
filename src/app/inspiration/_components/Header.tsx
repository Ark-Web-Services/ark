
import Link from 'next/link'

export default function Header() {
    return (
        <header className="py-4 px-6 bg-white">
            <nav className="flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold">ark web studio</Link>
                <div className="space-x-4">
                    <Link href="/projects">Projects</Link>
                    <Link href="/services">Services</Link>
                    <Link href="/blog">Blog</Link>
                    <Link href="/contact" className="bg-blue-600 text-white px-4 py-2 rounded">Contact</Link>
                </div>
            </nav>
        </header>
    )
}