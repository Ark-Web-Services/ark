'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { gsap } from 'gsap';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import AnimatedCamera from './AnimatedCamera';
import InitialLoader from './InitialLoader';

// GridPlane Component
function GridPlane({ isAnimating, color }: { isAnimating: boolean; color: string }) {
    const meshRef = useRef<THREE.Mesh>(null);


    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(100, 100, 100, 100);
        geo.rotateX(-Math.PI / 2);
        return geo;
    }, []);

    useFrame(({ clock }) => {
        if (isAnimating) {
            const time = clock.getElapsedTime();
            const positions = geometry.attributes.position
                ? (geometry.attributes.position.array as Float32Array)
                : null;

            if (positions) {
                for (let i = 0; i < positions.length; i += 3) {
                    const x = positions[i];
                    const z = positions[i + 2];

                    if (x !== undefined && z !== undefined) {
                        const distance = Math.sqrt(x * x + z * z);
                        positions[i + 1] = Math.sin(distance - time) * 0.55;
                    }
                }
            }

            if (geometry.attributes.position) {
                geometry.attributes.position.needsUpdate = true;
                geometry.computeVertexNormals();
            }
        }
    });

    return (
        <mesh ref={meshRef} geometry={geometry}>
            <meshStandardMaterial color={color} wireframe opacity={0.5} transparent />
        </mesh>
    );
}

// Pyramid Component
interface PyramidProps {
    isAnimating: boolean;
    color: string;
}

const Pyramid: React.FC<PyramidProps> = ({ isAnimating, color }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const amplitude = 0.5;
    const speed = 2;

    const geometry = useMemo(() => {
        const geom = new THREE.ConeGeometry(3.6, 4.86, 4);
        return geom;
    }, []);

    useFrame(({ clock }) => {
        if (isAnimating) {
            const time = clock.getElapsedTime();
            if (meshRef.current) {
                meshRef.current.position.y = 6 + amplitude * Math.sin(time * speed);
            }
        }
    });

    return (
        <mesh
            ref={meshRef}
            geometry={geometry}
            position={[0, 6, 0]}
            rotation={[0, 0, 0]}
        >
            <meshStandardMaterial color={color} />
        </mesh>
    );
};


// Coordinates Component
const Coordinates = () => {
    const [isZooming, setIsZooming] = useState(false);
    const [showButtons, setShowButtons] = useState(false);
    const [targetPosition, setTargetPosition] = useState<THREE.Vector3 | null>(null);
    const [orbitAngle, setOrbitAngle] = useState(0);
    const [color, setColor] = useState("#DA70D6");

    // State variables for side button animations
    const [isAnimatingToSide, setIsAnimatingToSide] = useState(false);
    const [sideOrbitAngle, setSideOrbitAngle] = useState<number | null>(null);



    useEffect(() => {
        if (showButtons) {
            gsap.fromTo(
                ".side-button",
                { opacity: 0 },
                { opacity: 1, duration: 0.5, stagger: 0.1 }
            );
        }
    }, [showButtons]);

    const handleSideButtonClick = (side: number) => {
        if (isAnimatingToSide) return;
        let newColor: string;
        let orbitAngle: number = 0;
        switch (side) {
            case 1:
                newColor = "#F7AA64";
                orbitAngle = Math.PI / 4; // Rotate 45 degrees to the right
                break;
            case 2:
                newColor = "#06ABDB";
                orbitAngle = -Math.PI / 4; // Rotate 45 degrees to the left
                break;
            case 3:
                newColor = "#e961A5";
                orbitAngle = -Math.PI * 0.75; // Rotate 135 degrees to the left
                break;
            case 4:
                newColor = "#FADF45";
                orbitAngle = Math.PI * 0.75; // Rotate 135 degrees to the right
                break;
            default:
                newColor = "#DA70D6";
                orbitAngle = 0;
        }
        setColor(newColor);
        setIsAnimatingToSide(true);
        setSideOrbitAngle(orbitAngle); // Set the orbit angle for side buttons
    };

    // Callback to reset `isAnimatingToSide` after animation completes
    const handleSideAnimationComplete = () => {
        setIsAnimatingToSide(false);
    };

    // Callback to reset `isZooming` after zoom animation completes
    const handleZoomAnimationComplete = () => {
        setIsZooming(false);
    };

    // Function to handle the start of zoom animation
    const handleStartZoom = (position: THREE.Vector3) => {
        console.log('Get in Touch button clicked'); // Debugging line

        setIsZooming(true);
        setTargetPosition(position);

    };

    // Function to handle showing side buttons after initial animations
    const handleShowButtons = () => {
        setShowButtons(true);
    };
    return (
        <section
            id="home"
            className="min-h-screen flex items-center justify-center relative overflow-hidden"

        >

            <div className="absolute inset-0 z-0">
                <Canvas style={{ background: 'black' }}>
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[0, 10, 0]} intensity={1} />
                    <GridPlane isAnimating={true} color={color} />
                    <Pyramid isAnimating={true} color={color} />
                    <AnimatedCamera
                        isZooming={isZooming}
                        targetPosition={targetPosition}
                        orbitAngle={orbitAngle}
                        isAnimatingToSide={isAnimatingToSide}
                        sideOrbitAngle={sideOrbitAngle ?? 0}
                        onSideAnimationComplete={handleSideAnimationComplete}
                        onZoomAnimationComplete={handleZoomAnimationComplete}
                    />
                </Canvas>
            </div>
            <InitialLoader
                onStartZoom={handleStartZoom}
                onShowButtons={handleShowButtons}
            />



            {showButtons && (
                <div className="absolute z-10 flex space-x-4 bottom-4 left-1/2 transform -translate-x-1/2">
                    {[1, 2, 3, 4].map((side) => (
                        <button
                            key={side}
                            onClick={() => handleSideButtonClick(side)}
                            className="bg-white p-2 rounded side-button"
                            style={{ opacity: 0 }} // Ensure buttons are initially invisible
                        >
                            {side}
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
};

export default Coordinates;
