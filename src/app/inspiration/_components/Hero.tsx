import { ArrowRight } from 'lucide-react'
import Image from 'next/image'

export default function Hero() {
    return (
        <section className="py-20 px-6 max-w-7xl mx-auto">
            <div className="flex flex-col space-y-16">
                <h1 className="text-[80px] font-normal leading-[1.1] max-w-[90%]">
                    The Webflow agency for
                    <br />
                    <span className="text-gray-400">high-achieving startups</span>
                </h1>
                <div className="flex justify-between">
                    <div className="w-1/3">
                        <Image
                            src="/placeholder.svg?height=200&width=200"
                            alt="3D Graphic"
                            width={200}
                            height={200}
                            className="object-contain"
                        />
                    </div>
                    <div className="w-1/2">
                        <p className="text-2xl mb-8">
                            We're a Webflow design agency giving startups and B2B brands an unstoppable online presence — with stunning websites that launch in weeks, not months.
                        </p>
                        <button className="bg-blue-600 text-white px-6 py-3 rounded-full text-lg font-medium inline-flex items-center hover:bg-blue-700 transition-colors">
                            Book your free discovery call
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
            <div className="mt-16 border-b border-gray-200"></div>
        </section>
    )
}