import React from 'react';

interface NavigationProps {
    totalSlides: number;
    currentSlide: number;
    slideNames: string[]; // slideNames should be required
}

const Navigation: React.FC<NavigationProps> = ({ totalSlides, currentSlide }) => {
    const slideNames = [
        "GUIDELINES", // Fill out the names as needed
        "MESSAGE",
        "CONTENT",
        "ABOUT",
        "BRAND",
        "LOGO",
        "LOGO",
        "LOGO",
        "VARIATIONS",
        "TYPEFACE",
        "TYPEFACE",
        "TYPEFACE",
        "COLOR",
        "COLOR",
        "COLOR",
        "ONLINE",
        "SOCIAL",
        "MOBILE",
        "DEVICES",
        "IMAGERY",
        "IMAGERY",
        "CARD",
        "LETTER",
        "BAG",
        "ENVELOPE",
        "END",
        "•"


    ];
    const handleItemClick = (index: number) => {
        gsap.to(`.nav-items`, {
            y: -index * 60, // Adjust based on item height and margin
            duration: 0.5,
            ease: 'power2.inOut',
            onComplete: () => {
                // Bounce-lock effect
                gsap.to(`.nav-items`, {
                    y: -index * 60 + 10, // Slight bounce effect
                    duration: 0.2,
                    ease: 'bounce.out',
                    onComplete: () => {
                        gsap.to(`.nav-items`, {
                            y: -index * 60, // Return to final position
                            duration: 0.2,
                            ease: 'power2.inOut',
                        });
                    },
                });
            },
        });
    };

    return (
        <div className="fixed top-1/2 left-0 transform -translate-y-1/2 bg-black bg-opacity-70 rounded-r-lg flex flex-col justify-center items-center z-10 text-white" style={{ width: 'max-content' }}>
            {/* Removed the title 'Slide Navigation' */}
            <div className="relative flex flex-col w-full overflow-hidden h-72">
                {/* Adjusted scrolling behavior and centering of selected item */}
                <div className="flex flex-col" style={{ transform: `translateY(-${currentSlide * 60}px)` }}>
                    {Array.from({ length: totalSlides }, (_, index) => (
                        <div
                            key={index}
                            className={`h-12 p-2 my-1 cursor-pointer opacity-50 flex items-center ${currentSlide === index ? 'opacity-100 transform scale-110' : ''}`}
                        >
                            {slideNames[index] || `Slide ${index + 1}`}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Navigation;
