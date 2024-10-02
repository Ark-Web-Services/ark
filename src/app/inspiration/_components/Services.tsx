
"use client"

import { ArrowRight, ChevronDown } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

export default function Services() {
    const [openAccordion, setOpenAccordion] = useState<string | null>(null)

    const toggleAccordion = (id: string) => {
        setOpenAccordion(openAccordion === id ? null : id)
    }

    const additionalServices = [
        {
            id: 'branding',
            title: 'Branding',
            content: "Earn your target audience's trust with a brand that shines. From distinctive logo design to a consistent tone of voice and brand guidelines, your brand will get the edge it needs to stand out."
        },
        {
            id: 'seo',
            title: 'SEO',
            content: "Master the art of attracting not just any client, but your ideal client – with more organic traffic and increased visibility. From on-page optimisations to local SEO, you'll be seen by the people who matter most."
        },
        {
            id: 'figma-to-webflow',
            title: 'Figma to Webflow',
            content: "Migrate your designs into Webflow without any hiccups. All while keeping your design's integrity and your user experience intact. Our team will handle every detail to ensure a responsive and SEO-aligned transition."
        },
        {
            id: 'wordpress-to-webflow',
            title: 'WordPress to Webflow',
            content: "Seamlessly step into the future by transitioning to Webflow. Enhance your site's performance and usability while preserving its integrity, functionality – even its SEO ranking."
        }
    ]

    return (
        <section className="py-20 px-[70px]">
            <div>
                <div className="mb-4">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Core services</span>
                </div>
                <div className="flex flex-col lg:flex-row justify-between mb-16 gap-16">
                    <div className="lg:w-1/2">
                        <h2 className="text-[56px] font-normal leading-[1.1] mb-8">
                            Design. Webflow development.<br />
                            <span className="text-gray-400">Code & no-code solutions.</span>
                        </h2>
                    </div>
                    <div className="lg:w-1/2">
                        <p className="text-[18px] text-gray-600 leading-relaxed">
                            When you're in a crucial stage of business, a bare-bones website won't lead you to victory. But you know what will? A website that's not just a website – but a marketing machine that makes your teams more effective. One that doesn't just embody your brand but elevates it, too. That's what Quarter Digital is here to do.
                        </p>
                    </div>
                </div>
                <div className="grid lg:grid-cols-2 gap-16 mb-16">
                    <div className="bg-gray-100 rounded-2xl p-8">
                        <div className="flex items-start mb-6">
                            <svg className="w-8 h-8 mr-4 text-gray-600 flex-shrink-0 mt-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 13C10 13.5523 9.55228 14 9 14C8.44772 14 8 13.5523 8 13C8 12.4477 8.44772 12 9 12C9.55228 12 10 12.4477 10 13Z" fill="currentColor" />
                                <path d="M15 13C15 13.5523 14.5523 14 14 14C13.4477 14 13 13.5523 13 13C13 12.4477 13.4477 12 14 12C14.5523 12 15 12.4477 15 13Z" fill="currentColor" />
                                <path d="M16 7C16 8.10457 15.1046 9 14 9C12.8954 9 12 8.10457 12 7C12 5.89543 12.8954 5 14 5C15.1046 5 16 5.89543 16 7Z" fill="currentColor" />
                                <path d="M11 7C11 8.10457 10.1046 9 9 9C7.89543 9 7 8.10457 7 7C7 5.89543 7.89543 5 9 5C10.1046 5 11 5.89543 11 7Z" fill="currentColor" />
                                <path d="M16 18C16 19.1046 15.1046 20 14 20C12.8954 20 12 19.1046 12 18C12 16.8954 12.8954 16 14 16C15.1046 16 16 16.8954 16 18Z" fill="currentColor" />
                                <path d="M11 18C11 19.1046 10.1046 20 9 20C7.89543 20 7 19.1046 7 18C7 16.8954 7.89543 16 9 16C10.1046 16 11 16.8954 11 18Z" fill="currentColor" />
                            </svg>
                            <h3 className="text-2xl font-semibold">Engaging web design</h3>
                        </div>
                        <div className="pl-12">
                            <ul className="space-y-2 mb-6">
                                <li className="flex items-start">
                                    <span className="text-blue-600 mr-2 text-3xl leading-none">•</span>
                                    <span>Award-winning visual experiences</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-blue-600 mr-2 text-3xl leading-none">•</span>
                                    <span>User-centered design that converts visitors into customers</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-blue-600 mr-2 text-3xl leading-none">•</span>
                                    <span>Layout & color schemes that showcase value and professionalism</span>
                                </li>
                            </ul>
                            <a href="#" className="inline-flex items-center text-gray-900 hover:underline">
                                Learn more
                                <ArrowRight className="ml-1 h-4 w-4" />
                            </a>
                        </div>
                    </div>
                    <div className="bg-gray-100 rounded-2xl p-8">
                        <div className="flex items-start mb-6">
                            <span className="text-4xl mr-4 text-gray-600 font-bold w-8 flex-shrink-0 mt-1">W</span>
                            <h3 className="text-2xl font-semibold">Seamless Webflow development</h3>
                        </div>
                        <div className="pl-12">
                            <ul className="space-y-2 mb-6">
                                <li className="flex items-start">
                                    <span className="text-blue-600 mr-2 text-3xl leading-none">•</span>
                                    <span>Responsive and SEO-friendly</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-blue-600 mr-2 text-3xl leading-none">•</span>
                                    <span>Optimised for boundless performance and speed</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="text-blue-600 mr-2 text-3xl leading-none">•</span>
                                    <span>Dynamic experiences that don't break when you make a change</span>
                                </li>
                            </ul>
                            <a href="#" className="inline-flex items-center text-gray-900 hover:underline">
                                Learn more
                                <ArrowRight className="ml-1 h-4 w-4" />
                            </a>
                        </div>
                    </div>
                </div>
                <div className="grid lg:grid-cols-2 gap-16">
                    <div className="mb-8">
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Additional services</span>
                    </div>
                    <div></div>
                    <div>
                        <Image
                            src="/placeholder.svg?height=150&width=150"
                            alt="3D Graphic of interconnected blue cubes"
                            width={150}
                            height={150}
                            className="w-full max-w-[150px] h-auto mb-8"
                        />
                    </div>
                    <div>
                        {additionalServices.map((service) => (
                            <div key={service.id} className="border-t border-gray-200">
                                <button
                                    onClick={() => toggleAccordion(service.id)}
                                    className="flex items-center justify-between w-full py-4 text-left text-lg focus:outline-none"
                                >
                                    <span>{service.title}</span>
                                    <ChevronDown
                                        className={`h-4 w-4 text-gray-400 transition-transform ${openAccordion === service.id ? 'transform rotate-180' : ''
                                            }`}
                                    />
                                </button>
                                {openAccordion === service.id && (
                                    <div className="pb-4 text-gray-600">
                                        <p>{service.content}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}