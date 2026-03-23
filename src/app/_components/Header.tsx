'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { TextPlugin } from 'gsap/TextPlugin'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

gsap.registerPlugin(ScrollTrigger, TextPlugin)

export default function Header() {
    const headerRef = useRef<HTMLElement>(null)
    const logoRef = useRef<HTMLAnchorElement>(null)
    const logoTextRef = useRef<HTMLSpanElement>(null)
    const [menuOpen, setMenuOpen] = useState(false)

    useEffect(() => {
        const mm = gsap.matchMedia()
        mm.add("(min-width: 640px)", () => {
            // Animations for screens wider than 640px
            const header = headerRef.current
            const logo = logoRef.current
            const logoText = logoTextRef.current

            if (!header || !logo || !logoText) {
                console.warn('Header elements are not available.')
                return
            }

            const navItems = header.querySelectorAll<HTMLElement>('.nav-item')
            const contactButton = header.querySelector<HTMLAnchorElement>('.contact-button')
            const navContainer = header.querySelector<HTMLElement>('.nav-container')

            if (!contactButton || !navContainer) {
                console.warn('Navigation elements are not available.')
                return
            }

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: 'body',
                    start: 'top top-=100',
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
                    x: 'calc(-50% + 1rem)',
                    duration: 0.3,
                }, '<')
                .to(logoText, {
                    text: 'ark',
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
                    paddingLeft: '3rem',
                    duration: 0.3,
                }, '<')

            return () => {
                if (tl.scrollTrigger) {
                    tl.scrollTrigger.kill()
                }
            }
        })

        // Clean up
        return () => {
            mm.revert()
        }
    }, [])

    return (
        <header
            ref={headerRef}
            className="fixed top-0 left-0 right-0 py-2 px-4 sm:top-4 sm:left-4 sm:right-4 sm:py-4 sm:px-6 bg-white transition-all duration-300 z-50"
        >
            <nav className="flex flex-row justify-between items-center max-w-6xl mx-auto relative">
                <Link
                    href="/"
                    ref={logoRef}
                    className="logo text-xl sm:text-2xl font-bold text-black transition-all duration-300 font-montserrat-alternates"
                >
                    <span ref={logoTextRef}>ARK Web Services</span>
                </Link>
                <div className="hidden sm:flex items-center space-x-6 nav-container">
                    <Link href="/services" className="nav-item text-black hover:text-gray-600 text-base">
                        Services
                    </Link>
                    <Link href="/industries" className="nav-item text-black hover:text-gray-600 text-base">
                        Industries
                    </Link>
                    <Link href="/case-studies" className="nav-item text-black hover:text-gray-600 text-base">
                        Case Studies
                    </Link>
                    <Link href="/insights" className="nav-item text-black hover:text-gray-600 text-base">
                        Insights
                    </Link>
                    <Link href="/process" className="nav-item text-black hover:text-gray-600 text-base">
                        Process
                    </Link>
                    <Link href="/about" className="nav-item text-black hover:text-gray-600 text-base">
                        About
                    </Link>
                    <Link
                        href="/contact"
                        className="contact-button px-6 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors text-base font-semibold"
                    >
                        Book a Discovery Call
                    </Link>
                </div>
                <button
                    className="sm:hidden text-black hover:text-gray-600 text-base sticky right-0"
                    onClick={() => setMenuOpen(!menuOpen)}
                >
                    {/* Hamburger Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5m-16.5 5.25h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>
            </nav>
            {menuOpen && (
                <div className="flex flex-col items-center bg-white w-full mt-2 sm:hidden border-t">
                    <Link href="/services" className="nav-item text-black hover:text-gray-600 text-base font-bold py-4 w-full text-center hover:bg-gray-200">
                        Services
                    </Link>
                    <Link href="/industries" className="nav-item text-black hover:text-gray-600 text-base font-bold py-4 w-full text-center hover:bg-gray-200">
                        Industries
                    </Link>
                    <Link href="/case-studies" className="nav-item text-black hover:text-gray-600 text-base font-bold py-4 w-full text-center hover:bg-gray-200">
                        Case Studies
                    </Link>
                    <Link href="/insights" className="nav-item text-black hover:text-gray-600 text-base font-bold py-4 w-full text-center hover:bg-gray-200">
                        Insights
                    </Link>
                    <Link href="/process" className="nav-item text-black hover:text-gray-600 text-base font-bold py-4 w-full text-center hover:bg-gray-200">
                        Process
                    </Link>
                    <Link href="/about" className="nav-item text-black hover:text-gray-600 text-base font-bold py-4 w-full text-center hover:bg-gray-200">
                        About
                    </Link>
                    <Link
                        href="/contact"
                        className="contact-button px-4 py-4 bg-blue-600 text-white hover:bg-blue-700 transition-colors text-base font-bold w-full text-center"
                    >
                        Book a Discovery Call
                    </Link>
                </div>
            )}
        </header>
    )
}