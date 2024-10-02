'use client'

import { ContactShadows, Float, PresentationControls } from '@react-three/drei';
import { Canvas, useFrame, useLoader } from '@react-three/fiber'; // Import useFrame and useLoader for animation and texture loading
import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import * as THREE from 'three'; // Import THREE for geometry and materials
import { TextureLoader } from 'three'; // Import TextureLoader for loading textures

// AnimatedText Component with onComplete Callback
const AnimatedText = ({
    text,
    onComplete,
}: {
    text: string;
    onComplete: () => void;
}) => {
    return (
        <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, staggerChildren: 0.1 }}
            className="inline-block"
            onAnimationComplete={onComplete} // Trigger callback after animation completes
        >
            {text.split('').map((char, index) => (
                <motion.span
                    key={index}
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.05 }}
                    className="inline-block"
                >
                    {char === ' ' ? <>&nbsp;</> : char}
                </motion.span>
            ))}
        </motion.span>
    );
};

// RotatingEarth Component
const RotatingEarth = ({
    rotationX,
    rotationY,
}: {
    rotationX: number;
    rotationY: number;
}) => {
    const earthRef = useRef<THREE.Mesh>(null);
    const cloudRef = useRef<THREE.Mesh>(null);
    const texture = useLoader(TextureLoader, '/assets/earth4.jpg'); // Load Earth texture
    const cloudTexture = useLoader(TextureLoader, '/assets/cloud.png'); // Load Cloud texture

    useFrame((state, delta) => {
        // Continuous slow rotation for the Earth
        if (earthRef.current) {
            earthRef.current.rotation.y += delta * 0.025; // Slow rotation
        }
        // Continuous slow rotation for the clouds
        if (cloudRef.current) {
            cloudRef.current.rotation.y += delta * 0.035; // Slightly faster than Earth for realism
        }

        // Rotation based on user drag
        if (earthRef.current) {
            earthRef.current.rotation.x += rotationY; // Rotate Earth on X-axis based on vertical drag
            earthRef.current.rotation.y += rotationX; // Rotate Earth on Y-axis based on horizontal drag
        }
        if (cloudRef.current) {
            cloudRef.current.rotation.x += rotationY * 1.5; // Rotate clouds on X-axis
            cloudRef.current.rotation.y += rotationX * 1.5; // Rotate clouds on Y-axis
        }
    });

    return (
        <>
            <mesh ref={earthRef}>
                <sphereGeometry args={[1, 32, 32]} />
                <meshStandardMaterial map={texture} /> {/* Apply Earth texture */}
            </mesh>
            <mesh ref={cloudRef}>
                <sphereGeometry args={[1.01, 32, 32]} /> {/* Slightly larger than Earth */}
                <meshStandardMaterial
                    map={cloudTexture}
                    transparent
                    opacity={0.5}
                /> {/* Apply cloud texture */}
            </mesh>
        </>
    );
};

// Stars Component
const Stars = ({
    rotationX,
    rotationY,
    isDragging,
}: {
    rotationX: number;
    rotationY: number;
    isDragging: boolean;
}) => {
    const starCount = 10000;
    const starsRef = useRef<THREE.Points>(null);
    const [geometry] = useState(() => {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 200; // X
            positions[i * 3 + 1] = (Math.random() - 0.5) * 200; // Y
            positions[i * 3 + 2] = (Math.random() - 0.5) * 200; // Z
        }

        geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(positions, 3)
        );
        return geometry;
    });

    // Original slow rotation speeds
    const slowRotationSpeedY = 0.00005; // Slow rotation around Y-axis
    const slowRotationSpeedX = 0.00003; // Slow rotation around X-axis

    useFrame(() => {
        if (starsRef.current) {
            // Apply original slow rotation
            starsRef.current.rotation.y += slowRotationSpeedY;
            starsRef.current.rotation.x += slowRotationSpeedX;

            // Apply rotation based on drag movement
            if (isDragging) {
                starsRef.current.rotation.y += rotationX * -100; // 100 times slower and opposite direction
                starsRef.current.rotation.x += rotationY * -100; // 100 times slower and opposite direction
            }
        }
    });

    return (
        <points ref={starsRef} geometry={geometry}>
            <pointsMaterial color={0xffffff} size={0.1} />
        </points>
    );
};

// HeroSection Component
const HeroSection = () => {
    const [isDragging, setIsDragging] = useState(false);
    const [rotationX, setRotationX] = useState(0);
    const [rotationY, setRotationY] = useState(0);
    const [showText, setShowText] = useState(true); // State to control main text visibility
    const [showSubText, setShowSubText] = useState(false); // State to control subtext visibility

    const handlePointerDown = () => {
        setIsDragging(true); // Start dragging
        setShowText(false); // Fade out main text
        setShowSubText(false); // Ensure subtext is also hidden
    };

    const handlePointerUp = () => {
        setIsDragging(false); // Stop dragging
        setRotationX(0); // Reset rotation when drag ends
        setRotationY(0); // Reset rotation Y when drag ends
        setShowText(true); // Fade in main text
        // Subtext will fade in after main text animation completes
    };

    const handlePointerMove = (event: React.PointerEvent) => {
        if (isDragging) {
            // Reduce the drag movement sensitivity by 100 times
            const movementX = event.movementX * 0.0001; // Adjust sensitivity
            const movementY = event.movementY * 0.0001; // Adjust sensitivity
            setRotationX(movementX);
            setRotationY(movementY);
        }
    };

    // Callback when AnimatedText animation completes
    const handleTextAnimationComplete = () => {
        setShowSubText(true); // Fade in subtext
    };

    return (
        <section
            id="home"
            className="min-h-screen flex items-center justify-center relative overflow-hidden"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerMove={handlePointerMove}
        >
            <div className="absolute inset-0 z-0">
                <Canvas style={{ background: 'black' }}> {/* Set background color to black */}
                    <ambientLight intensity={0.5} /> {/* Ambient light for general illumination */}
                    <directionalLight position={[5, 5, 5]} intensity={1} /> {/* Directional light to illuminate the Earth */}
                    <spotLight
                        position={[10, 10, 10]}
                        angle={0.15}
                        penumbra={1}
                    /> {/* Additional spotlight */}
                    <Stars
                        rotationX={rotationX}
                        rotationY={rotationY}
                        isDragging={isDragging}
                    /> {/* Add the Stars component with rotation */}
                    <PresentationControls
                        global
                        zoom={0.8}
                        rotation={[0, -Math.PI / 4, 0]}
                        polar={[-Math.PI / 4, Math.PI / 4]}
                        azimuth={[-Math.PI / 4, Math.PI / 4]}
                    >
                        <Float rotationIntensity={0.2}>
                            <RotatingEarth
                                rotationX={rotationX}
                                rotationY={rotationY}
                            /> {/* Use the RotatingEarth component */}
                        </Float>
                    </PresentationControls>
                    <ContactShadows opacity={0.4} scale={5} blur={2.4} />
                </Canvas>
            </div>
            <div className="container mx-auto px-6 relative z-10 flex flex-col items-center mt-20"> {/* flex-col and mt-20 to move text below Earth */}
                <AnimatePresence>
                    {showText && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            transition={{ duration: 0.5 }}
                            className="text-center"
                        >
                            <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white"> {/* Changed text color to white */}
                                <AnimatedText
                                    text="Full Stack Developer"
                                    onComplete={handleTextAnimationComplete} // Trigger subtext fade-in
                                />
                            </h1>
                            <AnimatePresence>
                                {showSubText && (
                                    <motion.p
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        transition={{ duration: 0.5, delay: 1 }} // Optional delay for smoothness
                                        className="text-xl md:text-2xl text-gray-300 mb-8"
                                    >
                                        Crafting innovative solutions with expertise and finesse
                                    </motion.p>
                                )}
                            </AnimatePresence>
                            <AnimatePresence>
                                {showSubText && ( // Ensure button appears after subtext
                                    <motion.a
                                        href="#contact"
                                        className="bg-primary text-white px-8 py-3 rounded-full text-lg font-semibold hover:bg-primary-dark transition duration-300"
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        initial={{ opacity: 0, y: 20 }} // Initial state for button
                                        animate={{ opacity: 1, y: 0 }} // Animate to visible state
                                        exit={{ opacity: 0, y: 20 }} // Exit animation
                                        transition={{ duration: 1, delay: 1.6 }} // Delay to appear after subtext
                                    >
                                        Get in Touch
                                    </motion.a>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
};

export default HeroSection;