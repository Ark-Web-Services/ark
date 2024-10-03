'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowDown, Download } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface HeroProps {
    onButtonClick: () => void
}

export default function Hero({ onButtonClick }: HeroProps) {
    const headingRef = useRef<HTMLHeadingElement>(null)
    const paragraphRef = useRef<HTMLParagraphElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const sectionRef = useRef<HTMLElement>(null)
    const arrowRef = useRef<SVGSVGElement>(null) // Add reference for the arrow

    useEffect(() => {
        gsap.registerPlugin(ScrollTrigger)

        const ctx = gsap.context(() => {
            if (
                !headingRef.current ||
                !paragraphRef.current ||
                !buttonRef.current ||
                !sectionRef.current
            )
                return

            // Animation for heading and paragraph
            const [firstLine, secondLine] = headingRef.current.children as unknown as HTMLElement[]

            gsap.set([firstLine, secondLine, paragraphRef.current, buttonRef.current, arrowRef.current], { opacity: 0, y: 50 }) // Include arrow in the initial set

            gsap.to([firstLine, secondLine], {
                opacity: 1,
                y: 0,
                duration: 1.5,
                ease: "power3.out",
                stagger: 0.2
            })

            gsap.to(paragraphRef.current, {
                opacity: 1,
                y: 0,
                duration: 1.5,
                ease: "power3.out",
                delay: 0.4
            })

            gsap.to(buttonRef.current, {
                opacity: 1,
                y: 0,
                duration: 1.5,
                ease: "power3.out",
                delay: 0.6
            })

            gsap.to(arrowRef.current, { // Add animation for the arrow
                opacity: 1,
                y: 0,
                duration: 1.5,
                ease: "power3.out",
                delay: 0.8 // Adjust delay for the arrow
            })

            // Parallax effect
            gsap.to(sectionRef.current, {
                y: '-20%',
                ease: 'none',
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true
                }
            })
        }, sectionRef)

        return () => ctx.revert()
    }, [])

    return (
        <section
            ref={sectionRef}
            className="w-full h-screen flex items-center justify-center bg-black relative overflow-hidden"
        >
            <div className="px-4 md:px-[70px] w-full"> {/* Add w-full */}
                <h1 ref={headingRef} className="text-5xl md:text-6xl lg:text-[80px] font-normal leading-[1.1] mb-16 text-white">
                    <span className="block">Crafting Brand Identities</span>
                    <span className="block text-gray-400">That Leave a Lasting Impression</span>
                </h1>
                <div className="flex flex-col md:flex-row justify-center items-center md:items-start gap-10 w-full"> {/* Add w-full */}
                    <div className="w-full md:w-1/2">
                        <p ref={paragraphRef} className="text-xl md:text-2xl mb-8 text-white text-center md:text-left">
                            Our comprehensive brand guide books are the cornerstone of impactful brand identities. We meticulously craft every element to ensure your brand communicates consistently and powerfully across all platforms.
                        </p>
                        <div className="flex justify-end">
                            <a
                                href="/assets/branding/Ark-Brand-Guidelines-Template.pdf"
                                download
                                className="text-white inline-flex items-center hover:text-blue-400 transition-colors"
                            >
                                <button
                                    ref={buttonRef}
                                    className="text-white inline-flex items-center hover:text-blue-400 transition-colors"
                                    onClick={() => {/* Add PDF download logic */ }}
                                >
                                    <Download className="mr-2 h-5 w-5" />
                                    Download Brand Guide Sample
                                </button>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <button
                ref={arrowRef as any} // Type assertion
                onClick={onButtonClick}
                className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white flex flex-col items-center cursor-pointer hover:text-blue-400 transition-colors"
            >
                <span className="text-sm mb-2">Explore Our Branding Process</span>
                <ArrowDown className="h-6 w-6 animate-bounce" />
            </button>
        </section>
    )
}