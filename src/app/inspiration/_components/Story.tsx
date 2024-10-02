import { ArrowRight } from 'lucide-react'
import Image from 'next/image'

export default function Story() {
    return (
        <section className="py-20">
            <div className="px-[70px]">
                <div className="mb-4">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-blue-800"></span>
                        Our Story
                    </span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
                    <div>
                        <h2 className="text-[56px] font-normal mb-8 leading-tight">
                            Creating digital-first<br />
                            organisations in a<br />
                            <span className="text-gray-400">digital-first world</span>
                        </h2>
                        <div className="space-y-6 text-gray-600 text-[18px]">
                            <p>
                                For the longest time, organisations had to choose the lesser of two evils:
                                Flawless web design with limited functionality. Or flexible functionality with
                                outdated design.
                            </p>
                            <p>
                                After 18 years of design experience, we set out on a mission to offer our
                                clients a new solution: <span className="font-medium text-gray-900">Breathtaking Webflow web design that's tech-
                                    effective – delivered within tight deadlines.</span>
                            </p>
                            <p>And we haven't looked back since.</p>
                            <p>
                                From your vision all the way to launch and beyond, you'll enjoy that
                                flawless agency quality without the faceless agency feel. Curious about
                                our story and other values that guide us?
                            </p>
                            <div className="pt-6">
                                <button className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition-colors">
                                    Dive deeper
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div>
                        <Image
                            src="/placeholder.svg?height=600&width=600"
                            alt="Man in white polo shirt holding a laptop in an office lobby"
                            width={600}
                            height={600}
                            className="rounded-2xl w-full h-auto"
                        />
                    </div>
                </div>
            </div>
        </section>
    )
}