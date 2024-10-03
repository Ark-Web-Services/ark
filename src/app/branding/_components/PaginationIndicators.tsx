import React from 'react';

interface PaginationIndicatorsProps {
    currentSlide: number;
    totalSlides: number;
    onIndicatorClick: (slideIndex: number) => void;
}

const PaginationIndicators: React.FC<PaginationIndicatorsProps> = ({
    currentSlide,
    totalSlides,
    onIndicatorClick,
}) => {
    const indicators = Array.from({ length: totalSlides }, (_, index) => (
        <button
            key={index}
            className={`w-3 h-3 rounded-full ${index === currentSlide ? 'bg-gray-800' : 'bg-gray-400'
                }`}
            onClick={() => onIndicatorClick(index)}
            // Allow click events on buttons
            style={{ pointerEvents: 'auto' }}
            aria-label={`Go to slide ${index + 1}`}
        />
    ));

    return (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
            {indicators}
        </div>
    );
};

export default PaginationIndicators;