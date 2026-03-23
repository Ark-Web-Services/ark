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
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-8 leading-tight">
                            We’re best fit for ambitious service brands that need a high-converting site and a sharper digital presence.
                        </h2>
                        <div className="space-y-8">
                            <div className="p-8 bg-blue-50 rounded-2xl border border-blue-100">
                                <h4 className="text-xl font-bold text-black mb-4">What happens next?</h4>
                                <ul className="space-y-4 text-gray-700">
                                    <li className="flex gap-3 items-start">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-2"></div>
                                        <span>We'll review your inquiry within 24 hours.</span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-2"></div>
                                        <span>If we're a match, we'll book a free 30-minute discovery call.</span>
                                    </li>
                                    <li className="flex gap-3 items-start">
                                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-2"></div>
                                        <span>We'll discuss your goals, gaps, and potential scope.</span>
                                    </li>
                                </ul>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    <span className="text-base sm:text-lg text-gray-600 font-medium">support@arkwebservices.com</span>
                                </div>
                                <div className="flex items-center">
                                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <span className="text-base sm:text-lg text-gray-600 font-medium">+1 (704) 256-0860</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-8 sm:p-12 rounded-[2rem] border border-gray-100 shadow-xl shadow-gray-100/50">
                        <form className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-bold text-black mb-2">Name</label>
                                    <input type="text" id="name" name="name" placeholder="John Doe" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none" />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-bold text-black mb-2">Email</label>
                                    <input type="email" id="email" name="email" placeholder="john@company.com" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="business-name" className="block text-sm font-bold text-black mb-2">Business name</label>
                                    <input type="text" id="business-name" name="business-name" placeholder="Acme Inc." className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none" />
                                </div>
                                <div>
                                    <label htmlFor="website-url" className="block text-sm font-bold text-black mb-2">Current Website URL</label>
                                    <input type="url" id="website-url" name="website-url" placeholder="https://..." className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-black mb-3">Service of interest</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {[
                                        "Web Design", "Branding", "SEO Foundations", "Webflow Development", "Redesign", "Custom Build"
                                    ].map((service) => (
                                        <div key={service} className="flex items-center gap-2 p-3 border border-gray-100 rounded-xl bg-gray-50 hover:bg-white cursor-pointer transition-colors">
                                            <input type="checkbox" id={service.toLowerCase().replace(' ', '-')} name="services" value={service} className="h-4 w-4 text-blue-600 rounded border-gray-300" />
                                            <label htmlFor={service.toLowerCase().replace(' ', '-')} className="text-sm font-medium text-gray-700 cursor-pointer">{service}</label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="budget" className="block text-sm font-bold text-black mb-2">Estimated Budget</label>
                                <select id="budget" name="budget" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none appearance-none cursor-pointer">
                                    <option>Select a range...</option>
                                    <option>$5,000 - $10,000</option>
                                    <option>$10,000 - $25,000</option>
                                    <option>$25,000 - $50,000</option>
                                    <option>$50,000+</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-bold text-black mb-2">How can we help?</label>
                                <textarea id="message" name="message" rows={4} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none" placeholder="Tell us about your goals..."></textarea>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-[0.98]">
                                Send Inquiry
                            </button>
                            <p className="text-xs text-center text-gray-500">
                                By submitting this form, you agree to our <Link href="/privacy-policy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    )
}