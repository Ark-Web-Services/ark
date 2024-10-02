'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber'; // Import necessary components from react-three-fiber
import { AnimatePresence, motion } from 'framer-motion'; // Import AnimatePresence and motion from framer-motion
import { gsap } from 'gsap'; // Import GSAP
import { useEffect, useMemo, useRef, useState } from 'react'; // Import hooks from React
import { createNoise2D } from 'simplex-noise'; // Import the simplex noise function
import * as THREE from 'three'; // Import the three.js library

// GridPlane Component
function GridPlane({ isAnimating, color }: { isAnimating: boolean; color: string }) {
    const meshRef = useRef<THREE.Mesh>(null); // Create a reference for the mesh

    // Create a noise function using useMemo to optimize performance
    const noise2D = useMemo(() => createNoise2D(), []);

    // Create the plane geometry
    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(100, 100, 100, 100); // Create a plane geometry
        geo.rotateX(-Math.PI / 2); // Rotate the plane to make it horizontal
        return geo; // Return the geometry
    }, []);

    // Update the plane's vertex positions using simplex noise
    useFrame(({ clock }) => {
        if (isAnimating) { // Only update if animating
            const time = clock.getElapsedTime(); // Get the elapsed time

            // Check if geometry.attributes.position is defined
            const positions = geometry.attributes.position ? (geometry.attributes.position.array as Float32Array) : null; // Get the position array

            // Check if positions is not null
            if (positions) {
                // Loop through each vertex position
                for (let i = 0; i < positions.length; i += 3) {
                    const x = positions[i]; // Get the x-coordinate
                    const z = positions[i + 2]; // Get the z-coordinate

                    // Ensure x is defined
                    if (x !== undefined && z !== undefined) {
                        // Calculate distance from center
                        const distance = Math.sqrt(x * x + z * z);
                        // Apply wave pattern based on distance and time
                        positions[i + 1] = Math.sin(distance - time) * 0.55; // Update y based on wave pattern
                    }
                }
            }

            if (geometry.attributes.position) { // Check if position is defined
                geometry.attributes.position.needsUpdate = true; // Mark the geometry as needing an update
                geometry.computeVertexNormals(); // Recompute normals for lighting
            }
        }
    });

    return (
        <mesh ref={meshRef} geometry={geometry}> {/* Create a mesh with the geometry */}
            <meshStandardMaterial
                color={color} // Color for the grid
                wireframe // Render as wireframe
                opacity={0.5} // Set opacity
                transparent // Enable transparency
            />
        </mesh>
    );
}

// Pyramid Component
interface PyramidProps {
    isAnimating: boolean;
    color: string;
}

const Pyramid: React.FC<PyramidProps> = ({ isAnimating, color }) => {
    const meshRef = useRef<THREE.Mesh>(null); // Create a reference for the mesh
    const amplitude = 0.5; // Amplitude of the oscillation
    const speed = 2; // Speed of the oscillation

    const geometry = useMemo(() => {
        const geom = new THREE.ConeGeometry(3.6, 4.86, 4); // Increased base radius and height by 80%
        return geom; // Return the geometry
    }, []);

    // Use frame to update the position for oscillation
    useFrame(({ clock }) => {
        if (isAnimating) { // Only update if animating
            const time = clock.getElapsedTime(); // Get the elapsed time
            if (meshRef.current) {
                meshRef.current.position.y = 6 + amplitude * Math.sin(time * speed); // Oscillate the y position
            }
        }
    });

    return (
        <mesh ref={meshRef} geometry={geometry} position={[0, 6, 0]} rotation={[0, 0, 0]}> {/* Position the pyramid */}
            <meshStandardMaterial color={color} /> {/* Color for the pyramid */}
        </mesh>
    );
};

// AnimatedCamera Component
type AnimatedCameraProps = {
    isAnimating: boolean;
    isZooming: boolean;
    targetPosition: { x: number; y: number; z: number }; // Adjust as needed
};

const AnimatedCamera: React.FC<AnimatedCameraProps> = ({ isAnimating, isZooming, targetPosition }) => {
    const { camera } = useThree(); // Access the camera from the Three.js context

    useFrame(({ clock }) => {
        if (isAnimating) {
            const elapsedTime = clock.getElapsedTime();
            // Smoothly move the camera closer and lower, focusing on the pyramid
            if (isZooming) {
                camera.position.z = Math.max(5, 15 - elapsedTime * 2); // Move the camera closer (finishing position)
                camera.position.y = Math.max(8, 10 - elapsedTime * 1); // Move the camera lower (finishing position)
            }
            camera.lookAt(0, 6, 0); // Ensure the camera is always looking at the pyramid's position
        }

        if (targetPosition) {
            camera.position.lerp(targetPosition, 0.1); // Smoothly interpolate to the target position
            camera.lookAt(0, 6, 0); // Ensure the camera is always looking at the pyramid's position
        }
    });

    return null; // This component does not render anything
};

// NoiseSection Component

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

const NoiseSection = () => {
    const [isAnimating, setIsAnimating] = useState(true); // State to control animation
    const [isZooming, setIsZooming] = useState(false); // State to control camera zoom
    const [showButtons, setShowButtons] = useState(false); // State to control the visibility of the buttons
    const [targetPosition, setTargetPosition] = useState<THREE.Vector3 | null>(null); // State to control the target position of the camera
    const [color, setColor] = useState("#DA70D6"); // State to control the color of the pyramid and grid
    const [showText, setShowText] = useState(true); // State to control main text visibility
    const [showSubText, setShowSubText] = useState(false); // State to control subtext visibility
    const textRef = useRef(null); // Reference for the text container
    const [isLoading, setIsLoading] = useState(true); // State to control loading screen

    const handleButtonClick = () => {
        setIsZooming(true); // Start camera zoom on button click
        setShowText(false); // Hide text immediately to prevent flashing
        setTimeout(() => setShowButtons(true), 2000); // Show buttons after 2 seconds

        // GSAP explode animation
        gsap.to(textRef.current, {
            duration: 1,
            opacity: 0,
            scale: 2,
            ease: "power2.out",
        });
    };

    const handleSideButtonClick = (side: number) => {
        let newPosition: THREE.Vector3;
        let newColor: string;
        switch (side) {
            case 1:
                newPosition = new THREE.Vector3(5, 6, 0); // Right side
                newColor = "#F7AA64"; // Tomato
                break;
            case 2:
                newPosition = new THREE.Vector3(-5, 6, 0); // Left side
                newColor = "#06ABDB"; // SteelBlue
                break;
            case 3:
                newPosition = new THREE.Vector3(20, 6, 0); // Front side
                newColor = "#e961A5"; // LimeGreen
                break;
            case 4:
                newPosition = new THREE.Vector3(-25, 6, 0); // Back side
                newColor = "#FADF45"; // Gold
                break;
            default:
                newPosition = new THREE.Vector3(0, 10, 15); // Default position
                newColor = "#DA70D6"; // Neon purple
        }
        setTargetPosition(newPosition);
        setColor(newColor);
    };

    // Callback when AnimatedText animation completes
    const handleTextAnimationComplete = () => {
        setShowSubText(true); // Fade in subtext
    };

    // Function to handle loading completion
    const handleLoadingComplete = () => {
        setIsLoading(false); // Set loading to false when loading is complete
    };

    useEffect(() => {
        // Simulate loading completion after a timeout (replace with actual loading logic if needed)
        const timer = setTimeout(handleLoadingComplete, 2000); // Simulate loading for 2 seconds
        return () => clearTimeout(timer); // Clean up timer
    }, []);

    return (
        <section
            id="home"
            className="min-h-screen flex items-center justify-center relative overflow-hidden" // Styling for the section
        >
            {isLoading ? ( // Show loading screen if loading
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                    <h1 className="text-white">Loading...</h1> {/* Loading message */}
                </div>
            ) : (
                <>
                    <div className="absolute inset-0 z-0"> {/* Container for the canvas */}
                        <Canvas
                            camera={{ position: [0, 10, 15], fov: 60 }} // Set initial camera position further back (starting position)
                            style={{ background: 'black' }} // Set the background color to black
                        >
                            <ambientLight intensity={0.5} /> {/* Ambient light for general illumination */}
                            <directionalLight position={[0, 10, 0]} intensity={1} /> {/* Directional light */}
                            <GridPlane isAnimating={isAnimating} color={color} /> {/* Pass animation state and color to GridPlane */}
                            <Pyramid isAnimating={isAnimating} color={color} /> {/* Pass animation state and color to Pyramid */}
                            <AnimatedCamera
                                isAnimating={isAnimating}
                                isZooming={isZooming}
                                targetPosition={targetPosition ?? { x: 0, y: 0, z: 0 }} // Provide a default value
                            /> {/* Use the AnimatedCamera component */}
                        </Canvas>
                    </div>
                    <div className="container mx-auto px-6 relative z-10 flex flex-col items-center mt-20"> {/* flex-col and mt-20 to move text below Earth */}
                        <AnimatePresence>
                            {showText && (
                                <motion.div
                                    ref={textRef}
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 50 }}
                                    className="text-center"
                                >
                                    <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white"> {/* Changed text color to white */}
                                        <AnimatedText
                                            text="Welcome to the Noise Section"
                                            onComplete={handleTextAnimationComplete} // Trigger subtext fade-in
                                        />
                                    </h1>
                                    <AnimatePresence>
                                        {showSubText && (
                                            <motion.p
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 20 }}
                                                className="text-xl md:text-2xl text-gray-300 mb-8"
                                            >
                                                Experience the dynamic visuals and animations
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {!isZooming && (

                            <motion.button
                                onClick={handleButtonClick}
                                className="bg-primary  px-8 py-3 rounded-full text-lg font-semibold hover:bg-primary-dark transition duration-300 z-10 bg-white p-2 rounded mt-4"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                initial={{ opacity: 0, y: 20 }} // Initial state for button
                                animate={{ opacity: 1, y: 0 }} // Animate to visible state
                                exit={{ opacity: 0, y: 20 }} // Exit animation
                                transition={{ duration: 1, delay: 1.6 }} // Delay to appear after subtext
                            >
                                Get in Touch
                            </motion.button>
                        )}
                    </div>
                    {showButtons && (
                        <div className="absolute z-10 flex space-x-4 bottom-4 left-1/2 transform -translate-x-1/2"> {/* Container for the side buttons */}
                            {[1, 2, 3, 4].map((side) => (
                                <button
                                    key={side}
                                    onClick={() => handleSideButtonClick(side)}
                                    className="bg-white p-2 rounded"
                                >
                                    {side}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </section>
    );
};

export default NoiseSection; // Export the NoiseSection component