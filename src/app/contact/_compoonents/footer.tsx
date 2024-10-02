import Link from 'next/link'

export default function Footer() {
    return (
        <footer className="bg-gray-900 text-white py-12 px-6">
            <div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                    <h3 className="text-xl font-bold mb-4">quarter.digital</h3>
                    <p className="text-sm">Quarter Digital is your partnership-driven Webflow agency, dedicated to crafting unique and high-converting digital experiences. Explore our services and discover how we can help you stand out in the digital world. Your success is our mission.</p>
                </div>
                <div>
                    <h4 className="font-semibold mb-4">Services</h4>
                    <ul className="space-y-2">
                        <li><Link href="/webflow-development">Webflow development</Link></li>
                        <li><Link href="/web-design">Web design</Link></li>
                        <li><Link href="/branding">Branding</Link></li>
                        <li><Link href="/seo-services">SEO services</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-4">Quick links</h4>
                    <ul className="space-y-2">
                        <li><Link href="/">Home</Link></li>
                        <li><Link href="/projects">Projects</Link></li>
                        <li><Link href="/services">Services</Link></li>
                        <li><Link href="/our-story">Our Story</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-semibold mb-4">Contact</h4>
                    <p>hello@quarter.digital</p>
                    <p>+44(0) 7467767495</p>
                </div>
            </div>
            <div className="container mx-auto mt-8 pt-8 border-t border-gray-700 text-sm text-center">
                <p>&copy; 2024 Quarter Digital. All rights reserved.</p>
                <div className="mt-4">
                    <Link href="/privacy-policy" className="mr-4">Privacy Policy</Link>
                    <Link href="/terms-and-conditions">Terms and Conditions</Link>
                </div>
            </div>
        </footer>
    )
}