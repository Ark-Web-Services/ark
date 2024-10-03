'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

gsap.registerPlugin(ScrollTrigger)

export default function Testimonials() {
    const testimonials = [
        {
            stars: 5,
            quote: "Ark Web Services is the best web design services I’ve ever used. Not only was my website delivered on time it was better than I was expecting. The staff at Ark web services was very polite and helpful in this journey. Also they have years of experience in the web services field and was able to enhance my vision on my website and bring my dream to a reality. I can’t thank them enough for their amazing service.",
            name: "Cedric P",
            role: "CEO, Presidential Consulting",
            avatar: "/public/img/clients/cedric-p.jpeg?height=48&width=48",
        },
        {
            stars: 5,
            quote: "The team has exceeded our expectations, from their attention to detail to their competitive analysis. Their communication is excellent, with flexible scheduling and timely meetings. They've made our website development process user-friendly and efficient. Their reliability and quality of work make them highly recommendable. We look forward to continuing our partnership on future projects!",
            name: "Dominic S",
            role: "CMO, Pick A Pro",
            avatar: "/public/img/clients/dominic-s.jpeg?height=48&width=96",
        },
        // Add more testimonials here if needed
    ]

    const [currentIndex, setCurrentIndex] = useState(0)
    const sectionRef = useRef(null)
    const grayBoxRef = useRef(null)

    useEffect(() => {
        const section = sectionRef.current
        const grayBox = grayBoxRef.current

        if (!section || !grayBox) return

        gsap.set(grayBox, { y: 100, opacity: 0 })

        const tl = gsap.timeline({ paused: true })
        tl.to(grayBox, {
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "power3.out"
        })

        ScrollTrigger.create({
            trigger: section,
            start: "top 80%",
            onEnter: () => tl.play(),
            once: true
        })

        return () => {
            ScrollTrigger.getAll().forEach(trigger => trigger.kill())
        }
    }, [])

    const nextTestimonial = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
    }

    const prevTestimonial = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + testimonials.length) % testimonials.length)
    }

    return (
        <section ref={sectionRef} className="py-8 sm:py-16 px-4 sm:px-[70px] bg-white">
            <h2 className="text-3xl sm:text-4xl md:text-[56px] font-normal mb-6 sm:mb-12 text-center leading-tight">
                <span className="text-gray-400">Join clients</span> breaking business barriers
            </h2>
            <div ref={grayBoxRef} className="bg-gray-100 rounded-2xl sm:rounded-3xl">
                <div className="max-w-7xl mx-auto py-6 sm:py-12 px-4 sm:px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
                        {[0, 1].map((offset) => {
                            const index = (currentIndex + offset) % testimonials.length
                            const testimonial = testimonials[index]
                            return (
                                <div key={index} className="flex flex-col">
                                    <div className="flex mb-2 sm:mb-4">
                                        {[...Array(testimonial.stars)].map((_, i) => (
                                            <Star key={i} className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 fill-current" />
                                        ))}
                                    </div>
                                    <p className="text-base sm:text-lg md:text-[20px] font-normal mb-4 sm:mb-6 leading-tight">{testimonial.quote}</p>
                                    <div className="mt-auto flex items-center">
                                        <Image
                                            src={testimonial.avatar}
                                            alt={testimonial.name}
                                            width={testimonial.name.includes('and') ? 96 : 48}
                                            height={48}
                                            className="rounded-full mr-3 sm:mr-4 w-10 h-10 sm:w-12 sm:h-12"
                                        />
                                        <div className="flex-grow">
                                            <p className="text-sm sm:text-base md:text-[18px] font-medium">{testimonial.name}</p>
                                            <p className="text-xs sm:text-sm md:text-[14px] text-gray-600">{testimonial.role}</p>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    <div className="flex justify-between items-center mt-6 sm:mt-8">
                        <div className="flex space-x-1 sm:space-x-2">
                            {testimonials.map((_, i) => (
                                <span
                                    key={i}
                                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${i === currentIndex ? 'bg-blue-600' : 'bg-gray-300'}`}
                                ></span>
                            ))}
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={prevTestimonial}
                                className="bg-white rounded-full p-1.5 sm:p-2 shadow-md hover:bg-gray-100 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
                            </button>
                            <button
                                onClick={nextTestimonial}
                                className="bg-white rounded-full p-1.5 sm:p-2 shadow-md hover:bg-gray-100 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}