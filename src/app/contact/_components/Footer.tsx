'use client'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Instagram, Linkedin, Twitter } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

gsap.registerPlugin(ScrollTrigger)

export default function Footer() {
    const footerRef = useRef(null)
    const columnsRef = useRef(null)

    useEffect(() => {
        const footer = footerRef.current
        const columns = columnsRef.current

        gsap.fromTo(columns,
            { y: 100, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 1,
                ease: "power3.out",
                scrollTrigger: {
                    trigger: footer,
                    start: "top bottom-=100",
                    toggleActions: "play none none reverse"
                }
            }
        )

        // Rolodex flip animation
        // @ts-expect-error build fix
        const animatedElements = columns.querySelectorAll('.services a, .quick-links a, .contact p')
        // @ts-expect-error build fix
        animatedElements.forEach(element => {
            const flipTl = gsap.timeline({ paused: true })
            flipTl.to(element, { rotateX: -90, duration: 0.2, opacity: 0 })
                .to(element, { rotateX: 0, duration: 0.2, opacity: 1 })

            element.addEventListener('mouseenter', () => flipTl.play())
            element.addEventListener('mouseleave', () => flipTl.reverse())
        })
    }, [])

    return (
        <footer ref={footerRef} className="bg-white w-full py-16">
            <div className="max-w-[1400px] mx-auto px-[70px]">
                <div ref={columnsRef} className="flex justify-between">
                    <div className="w-1/3">
                        <h3 className="font-bold text-3xl mb-6">ark web studio</h3>
                        <p className="text-base text-gray-600 mb-6">ark web studio is your partnership-driven Web design agency dedicated to crafting unique and high-converting digital experiences.</p>
                        <div className="flex space-x-4">
                            <Link href="#" aria-label="LinkedIn" className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <Linkedin className="w-4 h-4 text-gray-600" />
                            </Link>
                            <Link href="#" aria-label="Twitter" className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <Twitter className="w-4 h-4 text-gray-600" />
                            </Link>
                            <Link href="#" aria-label="Instagram" className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <Instagram className="w-4 h-4 text-gray-600" />
                            </Link>
                        </div>
                    </div>
                    <div className="w-2/3 flex justify-end space-x-16">
                        <div className="services">
                            <h4 className="font-bold text-lg mb-4">Services</h4>
                            <ul className="space-y-2">
                                <li><Link href="/" className="text-base text-gray-600 hover:text-gray-900 inline-block">Custom development</Link></li>
                                <li><Link href="/" className="text-base text-gray-600 hover:text-gray-900 inline-block">Web design</Link></li>
                                <li><Link href="/" className="text-base text-gray-600 hover:text-gray-900 inline-block">Branding</Link></li>
                                <li><Link href="/" className="text-base text-gray-600 hover:text-gray-900 inline-block">SEO</Link></li>
                            </ul>
                        </div>
                        <div className="quick-links">
                            <h4 className="font-bold text-lg mb-4">Quick links</h4>
                            <ul className="space-y-2">
                                <li><Link href="/" className="text-base text-gray-600 hover:text-gray-900 inline-block">Home</Link></li>
                                <li><Link href="/inspiration" className="text-base text-gray-600 hover:text-gray-900 inline-block">Inspiration</Link></li>
                                <li><Link href="/branding" className="text-base text-gray-600 hover:text-gray-900 inline-block">Branding</Link></li>
                            </ul>
                        </div>
                        <div className="contact">
                            <h4 className="font-bold text-lg mb-4">Contact</h4>
                            <ul className="space-y-2">
                                <li><p className="text-base text-gray-600 inline-block">support@arkwebservices.com</p></li>
                                <li><p className="text-base text-gray-600 inline-block">+1 (704) 256-0860</p></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <div className="mt-16 pt-8 border-t border-gray-200 flex justify-between items-center">
                    <p className="text-base text-gray-600">&copy; {new Date().getFullYear()} ark web studio. All rights reserved.</p>
                    <div className="space-x-4">
                        <Link href="/privacy-policy" className="text-base text-gray-600 hover:text-gray-900">Privacy Policy</Link>
                        <Link href="/terms-and-conditions" className="text-base text-gray-600 hover:text-gray-900">Terms and Conditions</Link>
                    </div>
                </div>
            </div>
        </footer>
    )
}