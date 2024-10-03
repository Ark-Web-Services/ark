'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef } from 'react'

interface HeroProps {
    onButtonClick: () => void
}

export default function Hero({ onButtonClick }: HeroProps) {
    const headingRef = useRef<HTMLHeadingElement>(null)
    const paragraphRef = useRef<HTMLParagraphElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)
    const sectionRef = useRef<HTMLElement>(null)

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

            gsap.set([firstLine, secondLine, paragraphRef.current, buttonRef.current], { opacity: 0, y: 50 })

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
            className="w-screen h-screen flex items-center justify-center bg-black relative overflow-hidden"
        >
            <div className="px-[70px]">
                <h1 ref={headingRef} className="text-5xl md:text-6xl lg:text-[80px] font-normal leading-[1.1] mb-16 text-white">
                    <span className="block">Elevate Your Brand with</span>
                    <span className="block text-gray-400">Unmatched Creativity and Precision</span>
                </h1>
                <div className="flex flex-col md:flex-row justify-center items-center md:items-start gap-10">
                    <div className="w-full md:w-1/3">
                        <Image
                            src="/assets/branding/interactive-graphic.svg"
                            alt="Creative Graphic"
                            width={200}
                            height={200}
                            className="object-contain mx-auto md:mx-0"
                        />
                    </div>
                    <div className="w-full md:w-1/2">
                        <p ref={paragraphRef} className="text-xl md:text-2xl mb-8 text-white text-center md:text-left">
                            We specialize in creating interactive experiences that leave a lasting impression. Our team delivers engaging websites that launch in weeks, not months.
                        </p>
                        <button
                            ref={buttonRef}
                            onClick={onButtonClick}
                            className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-full text-lg font-medium inline-flex items-center justify-center hover:bg-blue-700 transition-colors"
                        >
                            Start Your Project
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}