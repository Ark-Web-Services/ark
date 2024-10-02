
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'

export default function CallToAction() {
    return (
        <section className="bg-white py-24">
            <div className="px-[70px]">
                <div className="bg-gray-100 rounded-[40px] p-20 flex justify-between items-center">
                    <div className="max-w-[800px]">
                        <div className="mb-6">
                            <span className="inline-flex items-center rounded-full border border-blue-600 px-2.5 py-0.5 text-xs font-medium text-blue-600">
                                Get in touch
                            </span>
                        </div>
                        <h2 className="text-[56px] font-normal leading-[1.1] mb-6">
                            Let's show your customers what you're made of. But first, let's get to know each other.
                        </h2>
                        <p className="text-[20px] text-gray-600 mb-8">
                            We're currently accepting projects for Q2 of 2024. Book a call to explore how we can collaborate.
                        </p>
                        <button className="inline-flex items-center bg-blue-600 text-white text-[15px] px-6 py-3 rounded-full hover:bg-blue-700 transition-colors">
                            Book your free discovery call
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </button>
                    </div>
                    <div className="w-[400px] h-[400px] relative">
                        <Image
                            src="/placeholder.svg?height=400&width=400"
                            alt="Geometric shape"
                            width={400}
                            height={400}
                            className="object-contain"
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}