'use client'
import { gsap } from 'gsap'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

export default function Hero() {
    const headingRef = useRef(null)

    useEffect(() => {
        const ctx = gsap.context(() => {
            // @ts-ignore
            const [firstLine, secondLine] = headingRef.current.children;

            gsap.set([firstLine, secondLine], { opacity: 0, x: 100 });

            gsap.to([firstLine, secondLine], {
                opacity: 1,
                x: 0,
                duration: 1.5, // Increased from 1 to 1.5 seconds
                ease: "power3.out",
                stagger: 0.2
            });
        }, headingRef);

        return () => ctx.revert()
    }, [])

    return (
        <section className="w-full bg-white px-4 sm:px-8 md:px-16 lg:px-[70px] py-16">
            <div className="w-full pt-20 sm:pt-24 md:pt-28">
                <div className="mb-8 sm:mb-12">
                    <h1 ref={headingRef} className="lg:text-[80px] text-4xl sm:text-5xl md:text-6xl font-normal leading-tight mb-4 sm:mb-6">
                        <span className="block">Starting a business or have a</span>
                        <span className="block">project in mind? <span className="text-gray-400">Let's chat.</span></span>
                    </h1>
                    <div className="w-full h-px bg-gray-200 mt-4 sm:mt-6 mb-4 sm:mb-6"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 md:gap-16 pt-20 sm:pt-24 md:pt-28">
                    <div>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-normal mb-4 sm:mb-6 leading-tight">
                            From tiny to huge. If we love your project, we'll take it.
                        </h2>
                        <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8">
                            This email is open 24/7. The phone... not so much. But we're always here for you!
                            Whether you want to start a new project, improve your existing website, request
                            a quote, partner with us, or just say hi, don't hesitate to reach out.
                        </p>
                        <div className="space-y-2">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <span className="text-base sm:text-lg text-gray-600">support@arkwebservices.com</span>
                            </div>
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <span className="text-base sm:text-lg text-gray-600">+1 (704) 256-0860</span>
                            </div>
                        </div>
                        {/* <div className="mt-12">
                            <Image src="/placeholder.svg?height=100&width=100" alt="Diamond illustration" width={100} height={100} />
                        </div> */}
                    </div>

                    <div>
                        <form className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm sm:text-base font-medium text-gray-700 mb-1">Name</label>
                                    <input type="text" id="name" name="name" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm sm:text-base font-medium text-gray-700 mb-1">Email</label>
                                    <input type="email" id="email" name="email" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="business-name" className="block text-sm sm:text-base font-medium text-gray-700 mb-1">Business name (optional)</label>
                                    <input type="text" id="business-name" name="business-name" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                                <div>
                                    <label htmlFor="website-url" className="block text-sm sm:text-base font-medium text-gray-700 mb-1">Website URL (optional)</label>
                                    <input type="url" id="website-url" name="website-url" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm sm:text-base font-medium text-gray-700 mb-1">What services are you interested in?</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center">
                                            <input type="checkbox" id="web-design" name="services" value="Web Design" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                                            <label htmlFor="web-design" className="ml-2 block text-sm sm:text-base text-gray-700">Web Design</label>
                                        </div>
                                        <div className="flex items-center">
                                            <input type="checkbox" id="branding" name="services" value="Branding" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                                            <label htmlFor="branding" className="ml-2 block text-sm sm:text-base text-gray-700">Branding</label>
                                        </div>
                                        <div className="flex items-center">
                                            <input type="checkbox" id="other" name="services" value="Other" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                                            <label htmlFor="other" className="ml-2 block text-sm sm:text-base text-gray-700">Other</label>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center">
                                            <input type="checkbox" id="webflow-development" name="services" value="Webflow Development" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                                            <label htmlFor="webflow-development" className="ml-2 block text-sm sm:text-base text-gray-700">Webflow Development</label>
                                        </div>
                                        <div className="flex items-center">
                                            <input type="checkbox" id="seo" name="services" value="SEO" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                                            <label htmlFor="seo" className="ml-2 block text-sm sm:text-base text-gray-700">SEO</label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="budget" className="block text-sm sm:text-base font-medium text-gray-700 mb-1">Do you have a budget in mind?</label>
                                <select id="budget" name="budget" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                                    <option>Select one...</option>
                                    <option>$500 - $1,000</option>
                                    <option>$1,000 - $5,000</option>
                                    <option>$5,000 - $10,000</option>
                                    <option>$10,000+</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm sm:text-base font-medium text-gray-700 mb-1">Message</label>
                                <textarea id="message" name="message" rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" placeholder="Type your message..."></textarea>
                            </div>
                            <div className="flex items-center">
                                <input id="privacy-policy" name="privacy-policy" type="checkbox" className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
                                <label htmlFor="privacy-policy" className="ml-2 block text-sm sm:text-base text-gray-700">
                                    By clicking the Submit button you agree to our <Link href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link> terms.
                                </label>
                            </div>
                            <div>
                                <button type="submit" className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                    Send message
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    )
}