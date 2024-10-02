
import Link from 'next/link'

export default function Footer() {
    return (
        <footer className="bg-gray-100 py-12 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-4 gap-8">
                    <div>
                        <h3 className="font-bold mb-4">quarter.digital</h3>
                        <p className="text-sm text-gray-600">Quarter Digital is your partnership-driven Webflow agency dedicated to crafting unique and high-converting digital experiences.</p>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Services</h4>
                        <ul className="space-y-2">
                            <li><Link href="/services/webflow">Webflow development</Link></li>
                            <li><Link href="/services/web-design">Web design</Link></li>
                            <li><Link href="/services/branding">Branding</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Quick links</h4>
                        <ul className="space-y-2">
                            <li><Link href="/">Home</Link></li>
                            <li><Link href="/projects">Projects</Link></li>
                            <li><Link href="/about">About Us</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold mb-4">Contact</h4>
                        <p className="text-sm text-gray-600">hello@quarter.digital</p>
                        <p className="text-sm text-gray-600">+44(0) 7497797465</p>
                    </div>
                </div>
                <div className="mt-12 pt-8 border-t border-gray-300 text-sm text-gray-600">
                    <p>&copy; 2024 Quarter Digital. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}