
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'

export default function ClientShowcase() {
    return (
        <section className="py-8 px-6 max-w-7xl mx-auto">
            <div className="flex items-center mb-8">
                <p className="text-lg mr-4">
                    Congrats 🎉 to our client Glyphic AI for raising $5.5M in pre-seed funding
                </p>
                <button className="bg-gray-100 text-gray-900 font-medium px-4 py-2 rounded-full inline-flex items-center hover:bg-gray-200 transition-colors">
                    View case study
                    <ArrowRight className="ml-2 h-4 w-4" />
                </button>
            </div>
            <div className="relative w-full h-[600px] bg-black rounded-lg overflow-hidden">
                <Image
                    src="/placeholder.svg?height=600&width=1200"
                    alt="Client Showcase"
                    layout="fill"
                    objectFit="cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-center px-12">
                    <h2 className="text-white text-5xl font-bold mb-6">WITH US, SUCCESS RUNS IN</h2>
                    <p className="text-white text-xl max-w-2xl mb-4">
                        We harness athlete management, cutting-edge digital marketing & innovative
                        partnership activations for athletes & brands.
                    </p>
                    <p className="text-white text-xl max-w-2xl">
                        With a focus on supporting athletes of all sports, abilities & audience sizes to
                        increase their visibility, connect with potential partners to grow sporting careers.
                    </p>
                </div>
            </div>
        </section>
    )
}