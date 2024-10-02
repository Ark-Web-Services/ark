'use client'

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface SkillBarProps {
    skill: string;
    level: number;
}

const SkillBar = ({ skill, level }: SkillBarProps) => {
    const [width, setWidth] = useState(0);
    const [isInView, setIsInView] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect(); // Stop observing once in view
                }
            },
            { threshold: 0.1 } // Trigger when 10% of the element is in view
        );

        const currentRef = ref.current; // Copy ref.current to a variable

        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef); // Use the copied variable
            }
        };
    }, []);

    useEffect(() => {
        if (isInView) {
            setWidth(level); // Set width based on level when in view
        }
    }, [isInView, level]);

    return (
        <div className="mb-4" ref={ref}>
            <div className="flex justify-between mb-1">
                <span className="text-base font-medium text-primary">{skill}</span>
                <span className="text-sm font-medium text-primary">{level}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
                <motion.div
                    className="bg-blue-900 h-2.5 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: isInView ? `${width}%` : '0%' }} // Animate to width only if in view
                    transition={{ duration: 1, ease: "easeOut" }}
                />
            </div>
        </div>
    );
};

const SkillSection = () => {
    return (
        <>

            <section id="skills" className="py-20 bg-white">
                <div className="container mx-auto px-6">
                    <h2 className="text-4xl font-bold mb-12 text-center text-gray-800">Skills & Expertise</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <SkillBar skill="JavaScript/TypeScript" level={95} />
                            <SkillBar skill="React & Next.js" level={90} />
                            <SkillBar skill="Node.js & Express" level={85} />
                            <SkillBar skill="GraphQL" level={80} />
                        </div>
                        <div>
                            <SkillBar skill="Python & Django" level={85} />
                            <SkillBar skill="DevOps & CI/CD" level={75} />
                            <SkillBar skill="Database Design" level={90} />
                            <SkillBar skill="UI/UX Design" level={70} />
                        </div>
                    </div>
                </div>
            </section>

        </>

    )
}

export default SkillSection
