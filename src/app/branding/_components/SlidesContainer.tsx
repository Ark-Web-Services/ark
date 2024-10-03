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
        const slideNumber = index; // Start numbering from 0
        return (
            <section
                key={slideNumber}
                id={`slide-${slideNumber}`}
                className="flex-shrink-0 w-full h-screen flex flex-col items-center justify-center relative snap-start bg-white overflow-hidden" // Add overflow-hidden
                style={{
                    scrollSnapAlign: 'start',
                }}
            >
                <div className="relative w-full h-full flex items-center justify-center ">
                    <SlideImage slideNumber={slideNumber} />
                </div>
                {/* You can add additional content here if needed */}
            </section>
        );
    });

    // Handle pagination indicators and initial scroll position
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Scroll to the first slide (index 0) on mount
        container.scrollTo({
            left: 0,
            behavior: 'instant', // Immediate scroll without animation
        });

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

    // Determine if the screen is mobile-sized
    const isMobile = window.innerWidth <= 768;

    return (
        <div className="relative">
            {/* {currentSlide > 0 && ( // Render Navigation only if not on the first slide
                <Navigation totalSlides={totalSlides} currentSlide={currentSlide} />
            )} */}
            {/* Parallax Slides */}
            <div
                className="flex overflow-x-scroll snap-x snap-mandatory scroll-smooth h-screen hide-scrollbar w-full overflow-hidden" // Add overflow-hidden
                ref={containerRef}
                style={{
                    scrollBehavior: 'smooth',
                    maxWidth: '100%',
                }}
            >
                {slides}
            </div>

            {/* Conditionally render Pagination Indicators based on screen size */}
            {!isMobile && (
                <PaginationIndicators
                    currentSlide={currentSlide}
                    totalSlides={totalSlides}
                    onIndicatorClick={handleIndicatorClick}
                />
            )}

            {/* Hide Scrollbar Styles */}
            <style jsx>{`
                .hide-scrollbar {
                    -ms-overflow-style: none; /* IE and Edge */
                    scrollbar-width: none; /* Firefox */
                }
                .hide-scrollbar::-webkit-scrollbar {
                    display: none; /* Chrome, Safari, Opera */
                }
            `}</style>
        </div>
    );
};

export default SlidesContainer;