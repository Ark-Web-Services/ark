'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber'; // Import necessary components from react-three-fiber
import { useMemo, useRef, useState } from 'react'; // Import hooks from React
import { createNoise2D } from 'simplex-noise'; // Import the simplex noise function
import * as THREE from 'three'; // Import the three.js library

// GridPlane Component
function GridPlane({ isAnimating, color }) {
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
            const positions = geometry.attributes.position.array as Float32Array; // Get the position array

            // Loop through each vertex position
            for (let i = 0; i < positions.length; i += 3) {
                const x = positions[i]; // Get the x-coordinate
                const z = positions[i + 2]; // Get the z-coordinate

                // Calculate distance from center
                const distance = Math.sqrt(x * x + z * z);
                // Apply wave pattern based on distance and time
                positions[i + 1] = Math.sin(distance - time) * 0.55; // Update y based on wave pattern
            }

            geometry.attributes.position.needsUpdate = true; // Mark the geometry as needing an update
            geometry.computeVertexNormals(); // Recompute normals for lighting
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
const Pyramid = ({ isAnimating, color }) => {
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
const AnimatedCamera = ({ isAnimating, isZooming, targetPosition }) => {
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
const NoiseSection = () => {
    const [isAnimating, setIsAnimating] = useState(true); // State to control animation
    const [isZooming, setIsZooming] = useState(false); // State to control camera zoom
    const [showButtons, setShowButtons] = useState(false); // State to control the visibility of the buttons
    const [targetPosition, setTargetPosition] = useState(null); // State to control the target position of the camera
    const [color, setColor] = useState("#DA70D6"); // State to control the color of the pyramid and grid

    const handleButtonClick = () => {
        setIsZooming(true); // Start camera zoom on button click
        setTimeout(() => setShowButtons(true), 2000); // Show buttons after 2 seconds
    };

    const handleSideButtonClick = (side) => {
        let newPosition;
        let newColor;
        switch (side) {
            case 1:
                newPosition = new THREE.Vector3(5, 6, 0); // Right side
                newColor = "#FF6347"; // Tomato
                break;
            case 2:
                newPosition = new THREE.Vector3(-5, 6, 0); // Left side
                newColor = "#4682B4"; // SteelBlue
                break;
            case 3:
                newPosition = new THREE.Vector3(20, 6, 0); // Front side
                newColor = "#32CD32"; // LimeGreen
                break;
            case 4:
                newPosition = new THREE.Vector3(-25, 6, 0); // Back side
                newColor = "#FFD700"; // Gold
                break;
            default:
                newPosition = new THREE.Vector3(0, 10, 15); // Default position
                newColor = "#DA70D6"; // Neon purple
        }
        setTargetPosition(newPosition);
        setColor(newColor);
    };

    return (
        <section
            id="home"
            className="min-h-screen flex items-center justify-center relative overflow-hidden" // Styling for the section
        >
            <div className="absolute inset-0 z-0"> {/* Container for the canvas */}
                <Canvas
                    camera={{ position: [0, 10, 15], fov: 60 }} // Set initial camera position further back (starting position)
                    style={{ background: 'black' }} // Set the background color to black
                >
                    <ambientLight intensity={0.5} /> {/* Ambient light for general illumination */}
                    <directionalLight position={[0, 10, 0]} intensity={1} /> {/* Directional light */}
                    <GridPlane isAnimating={isAnimating} color={color} /> {/* Pass animation state and color to GridPlane */}
                    <Pyramid isAnimating={isAnimating} color={color} /> {/* Pass animation state and color to Pyramid */}
                    <AnimatedCamera isAnimating={isAnimating} isZooming={isZooming} targetPosition={targetPosition} /> {/* Use the AnimatedCamera component */}
                </Canvas>
            </div>
            {!isZooming && (
                <button onClick={handleButtonClick} className="absolute z-10 bg-white p-2 rounded"> {/* Button to start animation */}
                    Start Animation
                </button>
            )}
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
        </section>
    );
};

export default NoiseSection; // Export the NoiseSection component