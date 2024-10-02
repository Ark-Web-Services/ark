'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

gsap.registerPlugin(ScrollTrigger)

export default function Header() {
    const headerRef = useRef(null)
    const [isScrolled, setIsScrolled] = useState(false)

    useEffect(() => {
        const header = headerRef.current
        const logo = header.querySelector('.logo')
        const navItems = header.querySelectorAll('.nav-item')
        const contactButton = header.querySelector('.contact-button')
        const navContainer = header.querySelector('.nav-container')

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: 'body',
                start: 'top top-=100',
                onEnter: () => setIsScrolled(true),
                onLeaveBack: () => setIsScrolled(false),
            }
        })

        tl.to(header, {
            backgroundColor: '#000',
            padding: '0.5rem 1rem',
            borderRadius: '9999px',
            width: 'auto',
            left: '50%',
            xPercent: -50,
            duration: 0.3,
        })
            .to(logo, {
                color: '#fff',
                scale: 0.9,
                duration: 0.3,
            }, '<')
            .to(navItems, {
                color: '#fff',
                fontSize: '0.875rem',
                padding: '0 0.5rem',
                duration: 0.3,
            }, '<')
            .to(contactButton, {
                backgroundColor: '#3b82f6',
                color: '#fff',
                fontSize: '0.875rem',
                padding: '0.375rem 0.75rem',
                duration: 0.3,
            }, '<')
            .to(navContainer, {
                gap: '0.5rem',
                duration: 0.3,
            }, '<')

        return () => {
            if (tl.scrollTrigger) {
                tl.scrollTrigger.kill()
            }
        }
    }, [])

    return (
        <header ref={headerRef} className="fixed top-4 left-4 right-4 py-4 px-6 bg-white transition-all duration-300 z-50">
            <nav className="flex justify-between items-center max-w-6xl mx-auto">
                <Link href="/" className="logo text-2xl font-bold text-black">
                    quarter.digital
                </Link>
                <div className="nav-container flex items-center space-x-4">
                    <Link href="/projects" className="nav-item text-black hover:text-gray-600">Projects</Link>
                    <Link href="/services" className="nav-item text-black hover:text-gray-600">Services</Link>
                    <Link href="/our-story" className="nav-item text-black hover:text-gray-600">Our Story</Link>
                    <Link href="/blog" className="nav-item text-black hover:text-gray-600">Blog</Link>
                    <Link
                        href="/contact"
                        className="contact-button px-4 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                        Contact
                    </Link>
                </div>
            </nav>
        </header>
    )
}