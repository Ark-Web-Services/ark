'use client'
import React, { useRef } from 'react';
import Hero from './_components/Hero'; // Importing the Hero component
import SlidesContainer from './_components/SlidesContainer'; // Importing the SlidesContainer component

const BrandingPage: React.FC = () => {
    const slidesContainerRef = useRef<HTMLElement>(null);
    const totalSlides = 27;

    const handleScrollToSlides = () => {
        slidesContainerRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="flex flex-col bg-white min-h-screen">
            {/* Hero Section */}
            <Hero onButtonClick={handleScrollToSlides} />

            {/* Slides Wrapper */}
            <div ref={slidesContainerRef}>
                <SlidesContainer totalSlides={totalSlides} />
            </div>
        </div>
    );
};

export default BrandingPage;