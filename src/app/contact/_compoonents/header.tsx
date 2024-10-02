import Link from 'next/link'

export default function Header() {
    return (
        <header className="py-4 px-6 bg-white">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold">quarter.digital</Link>
                <nav>
                    <ul className="flex space-x-6">
                        <li><Link href="/projects">Projects</Link></li>
                        <li><Link href="/services">Services</Link></li>
                        <li><Link href="/our-story">Our Story</Link></li>
                        <li><Link href="/blog">Blog</Link></li>
                    </ul>
                </nav>
                <Link href="/contact" className="bg-blue-600 text-white px-4 py-2 rounded">Contact</Link>
            </div>
        </header>
    )
}