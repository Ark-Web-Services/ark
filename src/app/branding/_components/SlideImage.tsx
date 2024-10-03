import Image from 'next/image';
import React from 'react';

interface SlideImageProps {
    slideNumber: number;
}

const SlideImage: React.FC<SlideImageProps> = ({ slideNumber }) => {
    return (
        <Image
            src={`/assets/branding/slide-${slideNumber}.webp`}
            alt={`Slide ${slideNumber} background`}
            layout="fill"
            objectFit="contain"
            className="absolute inset-0 m-12"
        />
    );
};

export default SlideImage;