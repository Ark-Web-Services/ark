import React, { useEffect, useRef, useState } from 'react';
import PaginationIndicators from './PaginationIndicators'; // Importing PaginationIndicators
import SlideImage from './SlideImage'; // Importing the SlideImage component

interface SlidesContainerProps {
    totalSlides: number;
}

const SlidesContainer: React.FC<SlidesContainerProps> = ({ totalSlides }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = Array.from({ length: totalSlides }, (_, index) => {
        const slideNumber = index + 1;
        return (
            <section
                key={slideNumber}
                id={`slide-${slideNumber}`}
                className="flex-shrink-0 w-full h-screen flex flex-col items-center justify-center relative snap-start bg-white"
                style={{
                    scrollSnapAlign: 'start',
                }}
            >
                <div className="relative w-full h-full flex items-center justify-center">
                    <SlideImage slideNumber={slideNumber} />
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

    const handleIndicatorClick = (slideIndex: number) => {
        if (!containerRef.current) return;
        const container = containerRef.current;
        const slideWidth = container.clientWidth;

        container.scrollTo({
            left: slideWidth * slideIndex,
            behavior: 'smooth',
        });
    };

    return (
        <div className="relative">
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
            <PaginationIndicators
                currentSlide={currentSlide}
                totalSlides={totalSlides}
                onIndicatorClick={handleIndicatorClick}
            />
        </div>
    );
};

export default SlidesContainer;