'use client'

import { motion } from 'framer-motion';
import React, { useEffect, useRef, useState } from 'react';

const ContactSection: React.FC = () => {
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

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        // Handle form submission logic here
        console.log('Form submitted:', formData);
        // Reset form after submission
        setFormData({ name: '', email: '', message: '' });
    };

    return (
        <section id="contact" className="py-20" ref={ref}>
            <div className="container mx-auto px-4">
                <h2 className="text-4xl font-bold mb-8 text-center">Get In Touch</h2>
                <p className="text-center mb-8 max-w-2xl mx-auto">
                    I&apos;m currently open to new opportunities. Whether you have a question, a project idea, or just want to say hi, feel free to drop me a message!
                </p>
                <motion.form
                    onSubmit={handleSubmit}
                    className="max-w-lg mx-auto"
                    initial={{ opacity: 0, y: 20 }} // Start off-screen
                    animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }} // Animate to visible when in view
                    transition={{ duration: 1.0 }} // Transition settings
                >
                    <div className="mb-4">
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Name"
                            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#64FFDA] bg-transparent"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Email"
                            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#64FFDA] bg-transparent"
                            required
                        />
                    </div>
                    <div className="mb-4">
                        <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            placeholder="Message"
                            rows={4}
                            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#64FFDA] bg-transparent"
                            required
                        ></textarea>
                    </div>
                    <motion.button
                        type="submit"
                        className="w-full md:w-auto md:float-right px-8 py-3 bg-[#64FFDA] text-[#0A192F] rounded-md hover:bg-[#4CD3A9] transition duration-300"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Send Message
                    </motion.button>
                </motion.form>
            </div>
        </section>
    );
};

export default ContactSection;