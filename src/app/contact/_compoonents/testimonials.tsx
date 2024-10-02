'use client'

import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

export default function Testimonials() {
    const testimonials = [
        {
            stars: 5,
            quote: "They created a super good-looking website with great page speed metrics and very quick but detailed execution. We were able to clearly communicate what we liked and disliked, and they independently implemented the changes.",
            name: "Felix R",
            role: "Product Strategy, Glyphic AI",
            avatar: "/placeholder.svg?height=48&width=48",
            companyLogo: "/placeholder.svg?height=24&width=100"
        },
        {
            stars: 5,
            quote: "We went from no SEO to page 1 of Google for a couple of keywords within around 6 months on a very reasonable budget, this led to orders which have allowed us to grow as a business. We were impressed by the reports and the time they took to explain the SEO steps they implemented.",
            name: "Sam and Millie",
            role: "Co-founders, Just Bottle Ltd",
            avatar: "/placeholder.svg?height=48&width=96",
            companyLogo: "/placeholder.svg?height=24&width=60"
        },
        // Add more testimonials here if needed
    ]

    const [currentIndex, setCurrentIndex] = useState(0)

    const nextTestimonial = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
    }

    const prevTestimonial = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length)
    }

    return (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-[56px] font-normal mb-12 text-center leading-tight">
                    <span className="text-gray-400">Join clients</span> breaking business barriers
                </h2>
                <div className="relative bg-gray-100 rounded-3xl p-8 sm:p-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {[0, 1].map((offset) => {
                            const index = (currentIndex + offset) % testimonials.length
                            const testimonial = testimonials[index]
                            return (
                                <div key={index} className="flex flex-col">
                                    <div className="flex mb-4">
                                        {[...Array(testimonial.stars)].map((_, i) => (
                                            <Star key={i} className="w-5 h-5 text-blue-600 fill-current" />
                                        ))}
                                    </div>
                                    <p className="text-[20px] font-normal mb-6 leading-tight">{testimonial.quote}</p>
                                    <div className="mt-auto flex items-center">
                                        <Image
                                            src={testimonial.avatar}
                                            alt={testimonial.name}
                                            width={testimonial.name.includes('and') ? 96 : 48}
                                            height={48}
                                            className="rounded-full mr-4"
                                        />
                                        <div className="flex-grow">
                                            <p className="text-[18px] font-medium">{testimonial.name}</p>
                                            <p className="text-[14px] text-gray-600">{testimonial.role}</p>
                                        </div>
                                        <Image
                                            src={testimonial.companyLogo}
                                            alt={testimonial.role.split(',')[1].trim()}
                                            width={testimonial.name.includes('and') ? 60 : 100}
                                            height={24}
                                            className="ml-auto"
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div className="flex justify-between items-center mt-8">
                        <div className="flex space-x-2">
                            {testimonials.map((_, i) => (
                                <span
                                    key={i}
                                    className={`w-2 h-2 rounded-full ${i === currentIndex ? 'bg-blue-600' : 'bg-gray-300'}`}
                                ></span>
                            ))}
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={prevTestimonial}
                                className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
                            >
                                <ChevronLeft className="w-6 h-6 text-gray-600" />
                            </button>
                            <button
                                onClick={nextTestimonial}
                                className="bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
                            >
                                <ChevronRight className="w-6 h-6 text-gray-600" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}