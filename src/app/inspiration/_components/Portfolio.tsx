'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

gsap.registerPlugin(ScrollTrigger)

const projects = [
    {
        name: 'Lusion V3',
        image: '/img/inspire/inspiring-website-design-examples.png',
        tags: ['Web Design', 'NextJS Development'],
        url: 'https://www.awwwards.com/sites/lusion-v3'
    },
    {
        name: 'Pioneer',
        image: '/img/inspire/creative-website-inspiration-gallery.png',
        tags: ['Web Design', 'Custom Development'],
        url: 'https://www.awwwards.com/sites/pioneer-corn-revolutionized'
    },
    {
        name: 'Pangram Pangram',
        image: '/img/inspire/best-website-design-inspiration.png',
        tags: ['Webflow Development'],
        url: 'https://www.awwwards.com/sites/pangram-pangram-foundry'
    },
    {
        name: 'Huge',
        image: '/img/inspire/unique-website-portfolio-examples.png',
        tags: ['Web Design', 'Webflow Development'],
        url: 'https://www.awwwards.com/sites/huge-inc'
    },
    {
        name: 'OTSea',
        image: '/img/inspire/top-inspirational-websites-gallery.png',
        tags: ['Branding', '3JS Development'],
        url: 'https://www.awwwards.com/sites/otsea'
    },
    {
        name: 'Bruno Simon',
        image: '/img/inspire/trending-website-design-inspiration.png',
        tags: ['Web Design', '3JS Development', 'Branding'],
        url: 'https://www.awwwards.com/sites/bruno-simon-portfolio'
    },
]

export default function Portfolio() {
    const headingRef = useRef<HTMLHeadingElement>(null)
    const paragraphRef = useRef<HTMLParagraphElement>(null)
    const projectNamesRef = useRef<(HTMLHeadingElement | null)[]>([])

    useEffect(() => {
        const ctx = gsap.context(() => {
            if (headingRef.current && paragraphRef.current) {
                const [firstLine, secondLine, thirdLine] = headingRef.current.children;

                gsap.set([firstLine, secondLine, thirdLine, paragraphRef.current], { opacity: 0, x: 100 });

                gsap.to([firstLine, secondLine, thirdLine, paragraphRef.current], {
                    opacity: 1,
                    x: 0,
                    duration: 1.5,
                    ease: "power3.out",
                    stagger: 0.2
                });
            }

            // Animate project names word by word
            projectNamesRef.current.forEach((projectName) => {
                if (projectName) {
                    const words = projectName.textContent?.split(' ') || [];
                    projectName.innerHTML = words.map(word => `<span class="inline-block">${word}</span>`).join(' ');
                    const wordSpans = projectName.children;

                    gsap.set(wordSpans, { opacity: 0, x: 50 });
                    gsap.to(wordSpans, {
                        opacity: 1,
                        x: 0,
                        duration: 0.8,
                        ease: "power3.out",
                        stagger: 0.1,
                        scrollTrigger: {
                            trigger: projectName,
                            start: "top bottom-=50",
                            end: "bottom top+=50",
                            toggleActions: "play none none reverse"
                        }
                    });
                }
            });
        });

        return () => ctx.revert()
    }, [])

    return (
        <section className="py-20 px-[70px] w-full">
            <div className="flex flex-col md:flex-row justify-between mb-24 gap-16">
                <div className="md:w-[55%]">
                    <h2 ref={headingRef} className="text-[56px] font-normal leading-[1.1]">
                        <span className="block">See projects that impress</span>
                        <span className="block text-gray-400">stakeholders and customers</span>
                        <span className="block">alike</span>
                    </h2>
                </div>
                <div className="md:w-[40%] flex items-start">
                    <p ref={paragraphRef} className="text-[18px] text-gray-600 leading-relaxed">
                        If you're anything like our previous clients, you're probably making waves in your world. So why settle for something ordinary when you're building something extraordinary?
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map((project, index) => (
                    <div key={index} className="flex flex-col">
                        <h3
                            ref={el => projectNamesRef.current[index] = el}
                            className="text-2xl font-semibold mb-3"
                        >
                            {project.name}
                        </h3>
                        <div className="relative rounded-lg overflow-hidden shadow-lg mb-3">
                            {project.url ? (
                                <a href={project.url} target="_blank" rel="noopener noreferrer">
                                    <Image
                                        src={project.image}
                                        alt={project.name}
                                        width={600}
                                        height={400}
                                        className="w-full h-auto object-cover"
                                    />
                                </a>
                            ) : (
                                <Link href={`/projects/${project.url}`}>
                                    <Image
                                        src={project.image}
                                        alt={project.name}
                                        width={600}
                                        height={400}
                                        className="w-full h-auto object-cover"
                                    />
                                </Link>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {project.tags.map((tag, tagIndex) => (
                                <span key={tagIndex} className="bg-white text-gray-800 text-xs font-semibold px-3 py-1 rounded-full border border-gray-800">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}