import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { FaExternalLinkAlt, FaGithub } from 'react-icons/fa'

interface ProjectDetailProps {
    title: string
    tagline: string
    description: string
    features: string[]
    technologies: string[]
    demoLink: string
    repoLink: string
    images: string[]
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({
    title,
    tagline,
    description,
    features,
    technologies,
    demoLink,
    repoLink,
    images
}) => {
    return (
        <div className="min-h-screen bg-white">
            <header className="relative h-[300px] flex items-center justify-center">
                <Image
                    src="/placeholder.svg?height=300&width=1200"
                    alt={title}
                    layout="fill"
                    objectFit="cover"
                    className="absolute inset-0"
                />
                <div className="absolute inset-0 bg-black opacity-50"></div>
                <div className="relative z-10 text-center">
                    <h1 className="text-5xl font-bold text-white mb-4 text-shadow">{title}</h1>
                    <p className="text-2xl text-white">{tagline}</p>
                </div>
            </header>
            <main className="container mx-auto px-4 py-12">
                <div className="flex flex-col lg:flex-row gap-12">
                    <div className="lg:w-2/3">
                        <section>
                            <h2 className="text-3xl font-bold text-[#0A192F] mb-4 pb-2 border-b-2 border-[#64FFDA]">
                                Project Overview
                            </h2>
                            <p className="text-[#333333] leading-relaxed mb-8">{description}</p>
                        </section>
                        <section>
                            <h2 className="text-3xl font-bold text-[#0A192F] mb-4 pb-2 border-b-2 border-[#64FFDA]">
                                Key Features
                            </h2>
                            <ul className="list-none space-y-2">
                                {features.map((feature, index) => (
                                    <li key={index} className="flex items-start">
                                        <span className="text-[#64FFDA] mr-2">✓</span>
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </section>
                        <section className="mt-12">
                            <h2 className="text-3xl font-bold text-[#0A192F] mb-4 pb-2 border-b-2 border-[#64FFDA]">
                                Gallery
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {images.map((image, index) => (
                                    <div key={index} className="relative h-48 rounded-lg overflow-hidden shadow-md transition-transform duration-300 hover:scale-105">
                                        <Image
                                            src={image}
                                            alt={`Project screenshot ${index + 1}`}
                                            layout="fill"
                                            objectFit="cover"
                                        />
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                    <aside className="lg:w-1/3">
                        <div className="bg-[#F5F5F5] p-6 rounded-lg shadow-md">
                            <h3 className="text-2xl font-bold text-[#0A192F] mb-4">Project Details</h3>
                            <p className="mb-2"><strong>My Role:</strong> Full-Stack Developer</p>
                            <p className="mb-4"><strong>Project Duration:</strong> Jan 2023 - March 2023</p>
                            <h4 className="font-bold mb-2">Technologies Used:</h4>
                            <div className="flex flex-wrap gap-2 mb-6">
                                {technologies.map((tech, index) => (
                                    <span key={index} className="px-3 py-1 bg-[#64FFDA] text-[#0A192F] rounded-full text-sm">
                                        {tech}
                                    </span>
                                ))}
                            </div>
                            <a
                                href={demoLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full text-center bg-[#64FFDA] text-[#0A192F] font-bold py-3 rounded-md mb-4 hover:bg-[#4CD3A9] transition duration-300"
                            >
                                Live Demo <FaExternalLinkAlt className="inline-block ml-2" />
                            </a>
                            <a
                                href={repoLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full text-center bg-[#64FFDA] text-[#0A192F] font-bold py-3 rounded-md hover:bg-[#4CD3A9] transition duration-300"
                            >
                                GitHub Repository <FaGithub className="inline-block ml-2" />
                            </a>
                        </div>
                    </aside>
                </div>
            </main>
            <footer className="container mx-auto px-4 py-8">
                <Link href="/#projects" className="text-[#64FFDA] hover:underline">
                    ← Back to Projects
                </Link>
            </footer>
        </div>
    )
}

export default ProjectDetail