'use client'

import { motion } from 'framer-motion';
import Image from 'next/image';

interface ProjectCardProps {
    title: string;
    description: string;
    image: string;
}

const ProjectCard = ({ title, description, image }: ProjectCardProps) => {
    return (
        <motion.div
            className="bg-white rounded-lg shadow-lg overflow-hidden h-full"
            whileHover={{ scale: 1.05, rotateY: 5 }}
            transition={{ duration: 0.3 }}
        >
            <Image src={image} alt={title} className="w-full h-48 object-cover" width={400} height={300} />
            <div className="p-6 flex flex-col h-full">
                <h3 className="text-xl font-bold mb-2">{title}</h3>
                <p className="text-gray-600 flex-grow">{description}</p>
            </div>
        </motion.div>
    );
};

const ProjectSection = () => {
    const projects = [
        {
            title: "SEOMAGIC",
            description: "Making content creation as easy as having a conversation - by magically turning your meetings into content",
            image: "/assets/placeholder.svg",
        },
        {
            title: "Easyfetti",
            description: "Confetti shouldn't be so hard, now, it isn't!",
            image: "/assets/placeholder.svg",
        },
        {
            title: "Project 3",
            description: "A brief description of the project.",
            image: "/assets/placeholder.svg",
        },
    ];

    return (
        <section id="projects" className="py-20 bg-gray-100">
            <div className="container mx-auto px-6">
                <h2 className="text-4xl font-bold mb-12 text-center text-gray-800">Featured Projects</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {projects.map((project, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }} // Start off-screen
                            whileInView={{ opacity: 1, y: 0 }} // Animate to visible when in view
                            transition={{ duration: 0.5, delay: index * 0.2 }} // Staggered delay
                            viewport={{ once: false }} // Allow multiple animations on scroll
                        >
                            <ProjectCard
                                title={project.title}
                                description={project.description}
                                image={project.image}
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default ProjectSection;