'use client';

import { OrbitControls } from '@react-three/drei';
import { Canvas, useLoader, useThree } from '@react-three/fiber'; // Import Canvas from react-three-fiber
import { TextureLoader } from 'three'; // Import TextureLoader from three.js

// Ground Component
function Ground() {
    // Load the ground texture
    const texture = useLoader(TextureLoader, '/textures/ground.jpg'); // Ensure the texture path is correct

    return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[100, 100]} /> {/* Large ground plane */}
            <meshStandardMaterial map={texture} /> {/* Apply the ground texture */}
        </mesh>
    );
}

// GiantRectangle Component
function GiantRectangle() {
    return (
        <mesh position={[0, 2.5, 0]} castShadow>
            <boxGeometry args={[5, 5, 5]} /> {/* Create a cube; adjust dimensions as needed */}
            <meshStandardMaterial color="yellow" /> {/* Make the rectangle yellow */}
        </mesh>
    );
}

// BigGuy Component
const BigGuy = () => {
    const { camera, gl } = useThree();

    return (
        <section
            id="home"
            className="min-h-screen flex items-center justify-center relative overflow-hidden" // Styling for the section
        >
            <div className="absolute inset-0 z-0"> {/* Container for the canvas */}
                <Canvas
                    camera={{ position: [10, 10, 10], fov: 60 }} // Set camera position and field of view
                    shadows // Enable shadows
                    style={{ background: 'black' }} // Set the background color to black
                >
                    {/* Lighting */}
                    <ambientLight intensity={0.5} /> {/* Ambient light for general illumination */}
                    <directionalLight
                        position={[10, 20, 10]}
                        intensity={1}
                        castShadow
                        shadow-mapSize-width={1024}
                        shadow-mapSize-height={1024}
                    /> {/* Directional light with shadows */}

                    {/* Components */}
                    <Ground /> {/* Render the ground with texture */}
                    <GiantRectangle /> {/* Render the giant yellow rectangle */}

                    {/* Controls (optional) */}
                    <OrbitControls args={[camera, gl.domElement]} /> {/* Enable orbit controls */}
                </Canvas>
            </div>
        </section>
    );
};

export default BigGuy; // Export the BigGuy component