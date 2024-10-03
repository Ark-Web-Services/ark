'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useRef } from 'react'

gsap.registerPlugin(ScrollTrigger)

export default function Approach() {
    const badgeRef = useRef(null)
    const headingRef = useRef(null)
    const columnsRef = useRef([])

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Animate badge and heading
            gsap.set([badgeRef.current, headingRef.current], { opacity: 0, x: 100 });

            gsap.to(badgeRef.current, {
                opacity: 1,
                x: 0,
                duration: 1.5,
                ease: "power3.out"
            });

            gsap.to(headingRef.current, {
                opacity: 1,
                x: 0,
                duration: 1.5,
                ease: "power3.out",
                delay: 0.2
            });

            // Animate columns
            columnsRef.current.forEach((column, index) => {
                gsap.set(column, { opacity: 0, y: 50 });

                gsap.to(column, {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: column,
                        start: "top 80%",
                        end: "bottom 20%",
                        toggleActions: "play none none reverse"
                    },
                    delay: index * 0.2 // Stagger the animations
                });
            });
        }, [badgeRef, headingRef, columnsRef]);

        return () => ctx.revert()
    }, [])

    return (
        <section className="py-20 px-[70px]">
            <div className="mb-4" ref={badgeRef}>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                    <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-blue-800"></span>
                    Benefits
                </span>
            </div>
            <h2 ref={headingRef} className="text-[56px] font-normal mb-16 leading-tight">
                One website, <span className="text-gray-400">Infinite Opportunities</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                {[
                    {
                        title: "Timely Delivery & Open Communication",
                        content: "Launch your project exactly when you need it—be it in two months or two weeks. Expect prompt responses from us within hours, consistently, seven days a week. No more prolonged silences."
                    },
                    {
                        title: "Attract Significant Interest and Investment",
                        content: "Our design-first approach ensures your website doesn't just look exceptional but drives business results. Many clients have landed major deals and partnerships shortly after going live."
                    },
                    {
                        title: "Save Time and Money with Your Own Marketing Engine",
                        content: "While some agencies fade away post-launch, we stay by your side as an extension of your marketing team. We'll swiftly create landing pages, assets, and systems, helping you achieve results faster and more effortlessly."
                    },
                    {
                        title: "Move Forward with Confidence",
                        content: "A new website should fill you with excitement for what's ahead. Enjoy a platform that never hinders your progress, effortlessly showcases your company's value, and consistently attracts new prospects."
                    }
                ].map((column, index) => (
                    // @ts-expect-error build fix
                    <div key={index} className="p-6" ref={el => columnsRef.current[index] = el}>
                        <h3 className="text-2xl font-semibold mb-4">{column.title}</h3>
                        <p className="text-base text-gray-600">{column.content}</p>
                    </div>
                ))}
            </div>
        </section>
    )
}