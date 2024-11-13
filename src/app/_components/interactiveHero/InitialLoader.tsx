// components/InitialLoader.tsx
import { gsap } from 'gsap';
import { useEffect, useRef, useState } from 'react';
import { Vector3 } from 'three';

interface InitialLoaderProps {
    onStartZoom: (targetPosition: Vector3) => void;
    onShowButtons: () => void;
}

const InitialLoader: React.FC<InitialLoaderProps> = ({ onStartZoom, onShowButtons }) => {
    const [showText, setShowText] = useState(true);
    const [showSubText, setShowSubText] = useState(false);
    const [showButtons, setShowButtons] = useState(false);
    const textRef = useRef<HTMLDivElement>(null);
    const subTextRef = useRef<HTMLParagraphElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (textRef.current) {
            const letters = textRef.current.querySelectorAll('.letter');
            gsap.set(letters, { opacity: 0 }); // Ensure letters are initially invisible
            gsap.fromTo(
                letters,
                { y: 50, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.5,
                    stagger: 0.05,
                    onComplete: () => setShowSubText(true),
                }
            );
        }
    }, []);

    useEffect(() => {
        if (showSubText && subTextRef.current) {
            gsap.set(subTextRef.current, {
                opacity: 0,
                position: 'absolute',
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
            }); // Center subtext below the welcome text
            gsap.fromTo(
                subTextRef.current,
                { y: 20, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.5,
                    onComplete: () => {
                        if (buttonRef.current) {
                            gsap.fromTo(
                                buttonRef.current,
                                { opacity: 0 },
                                { opacity: 1, duration: 0.5 }
                            );
                        }
                    },
                }
            );
        }
    }, [showSubText]);

    const handleButtonClick = () => {
        console.log('Button clicked'); // Debugging line
        onStartZoom(new Vector3(0, 8, 18)); // Final destination

        gsap.to(textRef.current, {
            duration: 1,
            opacity: 0,
            scale: 2,
            ease: "power2.inOut",
            // onComplete: () => {
            //     // if (textRef.current) {
            //     //     textRef.current.style.display = 'none';
            //     // }
            // },
        });

        gsap.to(buttonRef.current, {
            duration: 0.2, // Faster duration for the button
            opacity: 0,
            y: 50, // Move the button down
            ease: "power2.inOut",
            onComplete: () => {
                // if (buttonRef.current) {
                //     // buttonRef.current.style.display = 'none';
                // }
                setTimeout(() => {
                    setShowButtons(true);
                    onShowButtons();
                }, 2000);
            },
        });
    };


    return (
        <div className="container mx-auto px-6 relative z-10 flex flex-col items-center mt-20">
            {showText && (
                <div ref={textRef} className="text-center relative">
                    <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">
                        {"    First Impressions Matter    ".split('').map((char, index) => (
                            <span key={index} className="inline-block letter opacity-0">
                                {char === ' ' ? <>&nbsp;</> : char}
                            </span>
                        ))}
                    </h1>
                    {showSubText && (
                        <p
                            ref={subTextRef}
                            className="text-xl md:text-2xl text-gray-300 mb-8"
                        >
                            Experience the dynamic visuals
                        </p>
                    )}
                </div>
            )}

            <button
                ref={buttonRef}
                onClick={handleButtonClick}
                className="bg-primary px-8 py-3 rounded-full text-lg font-semibold hover:bg-primary-dark transition duration-300 z-10 bg-white p-2 rounded mt-14 opacity-0 mt-14"
            >
                Get in Touch
            </button>

        </div>
    );
};

export default InitialLoader;