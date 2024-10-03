'use client'

import { gsap } from 'gsap'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef } from 'react'

export default function Hero() {
    const headingRef = useRef(null)
    const paragraphRef = useRef(null)

    useEffect(() => {
        const ctx = gsap.context(() => {
            // @ts-expect-error
            const [firstLine, secondLine] = headingRef.current.children;

            gsap.set([firstLine, secondLine, paragraphRef.current], { opacity: 0, x: 100 });

            gsap.to([firstLine, secondLine], {
                opacity: 1,
                x: 0,
                duration: 1.5,
                ease: "power3.out",
                stagger: 0.2
            });

            gsap.to(paragraphRef.current, {
                opacity: 1,
                x: 0,
                duration: 1.5,
                ease: "power3.out",
                delay: 0.4 // Slight delay after the heading animation
            });
        }, [headingRef, paragraphRef]);

        return () => ctx.revert()
    }, [])

    return (
        <section className="w-screen overflow-hidden py-16">
            <div className="pb-20 px-[70px] pt-[120px]">
                <h1 ref={headingRef} className="text-5xl md:text-6xl lg:text-[80px] font-normal leading-[1.1] mb-16">
                    <span className="block">The Interactive agency for</span>
                    <span className="block text-gray-400">brands that make an impact</span>
                </h1>
                <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-10">
                    <div className="w-full md:w-1/3">
                        <Image
                            src="/placeholder.svg?height=200&width=200"
                            alt="3D Graphic"
                            width={200}
                            height={200}
                            className="object-contain mx-auto md:mx-0"
                        />
                    </div>
                    <div className="w-full md:w-1/2">
                        <p ref={paragraphRef} className="text-xl md:text-2xl mb-8">
                            We're a design agency creating interactive experiences for brands to leave a lasting impression — delivering engaging websites that launch in weeks, not months.
                        </p>
                        <button className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-full text-lg font-medium inline-flex items-center justify-center hover:bg-blue-700 transition-colors">
                            Book your free discovery call
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
            <div className="px-[70px]">
                <div className="border-b border-gray-200"></div>
            </div>
        </section>
    )
}