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
    // {
    //     name: 'The Athletes',
    //     image: '/placeholder.svg?height=400&width=600',
    //     tags: ['Web Design', 'Webflow Development', 'Branding']
    // },
    // {
    //     name: 'OptimalControls',
    //     image: '/placeholder.svg?height=400&width=600',
    //     tags: ['Web Design', 'Webflow Development', 'Branding', 'SEO']
    // },
    // {
    //     name: 'Twist',
    //     image: '/placeholder.svg?height=400&width=600',
    //     tags: ['Webflow Development', 'Web Design', 'SEO']
    // }
]

export default function Portfolio() {
    const headingRef = useRef(null)
    const paragraphRef = useRef(null)
    const badgeRef = useRef(null)
    const projectNamesRef = useRef<(HTMLHeadingElement | null)[]>([]); // Specify the type here

    useEffect(() => {
        const ctx = gsap.context(() => {
            // @ts-expect-error
            const [firstLine, secondLine, thirdLine] = headingRef.current.children;

            gsap.set([badgeRef.current, firstLine, secondLine, thirdLine, paragraphRef.current], { opacity: 0, x: 100 });

            gsap.to([badgeRef.current, firstLine, secondLine, thirdLine, paragraphRef.current], {
                opacity: 1,
                x: 0,
                duration: 1.5,
                ease: "power3.out",
                stagger: 0.2
            });

            // Animate project names word by word
            projectNamesRef.current.forEach((projectName, index) => {
                // @ts-expect-error
                const words = projectName.textContent.split(' ');
                // @ts-expect-error
                projectName.innerHTML = words.map(word => `<span class="inline-block">${word}</span>`).join(' ');
                // @ts-expect-error
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
            });
        }, [headingRef, paragraphRef, badgeRef, projectNamesRef]);

        return () => ctx.revert()
    }, [])

    return (
        <section className="py-20 px-[70px] w-full">
            <div className="flex flex-col md:flex-row justify-between mb-24 gap-16">
                <div className="md:w-[55%]">
                    <div className="mb-4">
                        <span ref={badgeRef} className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Inspirations</span>
                    </div>
                    <h2 ref={headingRef} className="text-[56px] font-normal leading-[1.1]">
                        <span className="block">See creative projects that </span>
                        <span className="block text-gray-400">inspire our design</span>
                        <span className="block">process</span>
                    </h2>
                </div>
                <div className="md:w-[40%] flex items-start">
                    <p ref={paragraphRef} className="text-[18px] text-gray-600 leading-relaxed">
                        For those who push limits and redefine what's possible, ordinary simply isn't an option. So why blend in when you were born to stand out? You're creating something iconic—let’s make sure it’s nothing less than extraordinary.                    </p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map((project, index) => (
                    <div key={index} className="flex flex-col">
                        <h3
                            ref={el => {
                                projectNamesRef.current[index] = el;
                            }}
                            className="text-2xl font-semibold mb-3"
                        >
                            {project.name}
                        </h3>
                        <div className="relative rounded-lg overflow-hidden shadow-lg mb-3">
                            {project.url ? (
                                <a href={project.url} target="_blank" rel="noopener noreferrer"> {/* Use anchor for external links */}
                                    <Image
                                        src={project.image}
                                        alt={project.name}
                                        width={600}
                                        height={400}
                                        className="w-full h-auto object-cover"
                                    />
                                </a>
                            ) : (
                                <Link href={`/projects/${project.url}`}> {/* Wrap Image in Link for internal links */}
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
            {/* <div className="mt-12 text-center">
                <button className="bg-blue-600 text-white px-6 py-3 rounded-full text-lg font-medium inline-flex items-center hover:bg-blue-700 transition-colors">
                    View all
                    <ArrowRight className="ml-2 h-5 w-4" />
                </button>
            </div> */}
        </section>
    )
}