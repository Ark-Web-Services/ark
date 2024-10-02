import { ArrowRight } from 'lucide-react'
import Image from 'next/image'

const projects = [
    {
        name: 'Inspired Business Media',
        image: '/placeholder.svg?height=400&width=600',
        tags: ['Web Design', 'Webflow Development']
    },
    {
        name: 'Karve International',
        image: '/placeholder.svg?height=400&width=600',
        tags: ['Web Design', 'Webflow Development']
    },
    {
        name: 'Sedna',
        image: '/placeholder.svg?height=400&width=600',
        tags: ['Webflow Development']
    },
    {
        name: 'Earn It',
        image: '/placeholder.svg?height=400&width=600',
        tags: ['Web Design', 'Webflow Development']
    },
    {
        name: 'ReSys AG',
        image: '/placeholder.svg?height=400&width=600',
        tags: ['Branding', 'Webflow Development']
    },
    {
        name: 'Pririy',
        image: '/placeholder.svg?height=400&width=600',
        tags: ['Web Design', 'Webflow Development', 'Branding']
    },
    {
        name: 'The Athletes',
        image: '/placeholder.svg?height=400&width=600',
        tags: ['Web Design', 'Webflow Development', 'Branding']
    },
    {
        name: 'OptimalControls',
        image: '/placeholder.svg?height=400&width=600',
        tags: ['Web Design', 'Webflow Development', 'Branding', 'SEO']
    },
    {
        name: 'Twist',
        image: '/placeholder.svg?height=400&width=600',
        tags: ['Webflow Development', 'Web Design', 'SEO']
    }
]

export default function Portfolio() {
    return (
        <section className="py-20 px-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between mb-24 gap-16">
                <div className="md:w-[55%] mb-8 md:mb-0">
                    <div className="mb-4">
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Webflow projects</span>
                    </div>
                    <h2 className="text-[56px] font-normal leading-[1.1]">
                        See projects that<br />
                        impress stakeholders<br />
                        <span className="text-gray-400">and customers alike</span>
                    </h2>
                </div>
                <div className="md:w-[40%] md:pt-20">
                    <p className="text-[18px] text-gray-600 leading-relaxed">
                        If you're anything like our previous clients, you're probably making waves in your world. So why settle for something ordinary when you're building something extraordinary?
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {projects.map((project, index) => (
                    <div key={index} className="flex flex-col">
                        <h3 className="text-2xl font-semibold mb-3">{project.name}</h3>
                        <div className="relative rounded-lg overflow-hidden shadow-lg mb-3">
                            <Image
                                src={project.image}
                                alt={project.name}
                                width={600}
                                height={400}
                                className="w-full h-auto object-cover"
                            />
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
            <div className="mt-12 text-center">
                <button className="bg-blue-600 text-white px-6 py-3 rounded-full text-lg font-medium inline-flex items-center hover:bg-blue-700 transition-colors">
                    View all
                    <ArrowRight className="ml-2 h-5 w-4" />
                </button>
            </div>
        </section>
    )
}