'use client'
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';
import Hero from './_components/Hero'; // Importing the Hero component

const BrandingPage: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentSlide, setCurrentSlide] = useState(0);

    const scrollToNext = () => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const slideWidth = container.clientWidth;

        container.scrollBy({
            left: slideWidth,
            behavior: 'smooth',
        });
    };

    const slides = Array.from({ length: 27 }, (_, index) => {
        const slideNumber = index + 1;
        return (
            <section
                key={slideNumber}
                id={`slide-${slideNumber}`}
                className="flex-shrink-0 w-full h-screen flex flex-col items-center justify-center relative snap-start"
                style={{
                    scrollSnapAlign: 'start',
                }}
            >
                <div className="relative w-full h-full">
                    <Image
                        src={`/assets/branding/slide-${slideNumber}.webp`}
                        alt={`Slide ${slideNumber} background`}
                        layout="fill" // Reverted to original layout
                        objectFit="contain"
                        className="absolute inset-0 m-12"
                    />
                </div>
                {/* You can add additional content here if needed */}
            </section>
        );
    });

    // Handle pagination indicators
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleScroll = () => {
            const slideWidth = container.clientWidth;
            const newSlide = Math.round(container.scrollLeft / slideWidth);
            setCurrentSlide(newSlide);
        };

        container.addEventListener('scroll', handleScroll);
        return () => {
            container.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return (
        <div className="flex flex-col">
            {/* Hero Section */}
            <Hero onButtonClick={scrollToNext} />

            {/* Parallax Slides */}
            <div
                className="flex overflow-x-scroll snap-x snap-mandatory scroll-smooth h-screen"
                ref={containerRef}
                style={{
                    scrollBehavior: 'smooth',
                }}
            >
                {slides}
            </div>

            {/* Pagination Indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {slides.map((_, index) => (
                    <button
                        key={index}
                        className={`w-3 h-3 rounded-full ${index === currentSlide ? 'bg-gray-800' : 'bg-gray-400'
                            }`}
                        onClick={() => {
                            containerRef.current?.scrollTo({
                                left: containerRef.current.clientWidth * index,
                                behavior: 'smooth',
                            });
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default BrandingPage;