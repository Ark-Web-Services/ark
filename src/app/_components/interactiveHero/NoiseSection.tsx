'use client';

import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { AnimatePresence, motion } from 'framer-motion';
import { gsap } from 'gsap';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import ParticleEffect from '../pyramid/ParticleEffect';
import Pyramid from '../pyramid/Pyramid';
import AnimatedCamera from './AnimatedCamera';
import ClickAndDragAnimation from './ClickAndDragAnimation';
import GridPlane from './GridPlane';
import InitialLoader from './InitialLoader';
import InteractiveButton3D from './InteractiveButton3d';


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
    const [showClickAndDrag, setShowClickAndDrag] = useState(true); // State to control ClickAndDrag visibility

    const handlePointerDown = () => {
        setShowClickAndDrag(false); // Fade out ClickAndDrag animation
    };

    const handlePointerUp = () => {
        setShowClickAndDrag(true); // Fade in ClickAndDrag animation
    };

    useEffect(() => {
        if (showButtons) {
            gsap.fromTo(
                ".interactive-button",
                { opacity: 0, scale: 0 },
                { opacity: 1, scale: 1, duration: 1, stagger: 0.2, ease: "back.out(1.7)" }
            );
        }
    }, [showButtons]);

    const handleSideButtonClick = (side: number) => {
        if (isAnimatingToSide) return;
        let newColor: string;
        let orbitAngleValue: number = 0;
        switch (side) {
            case 1:
                newColor = "#F7AA64";
                orbitAngleValue = Math.PI / 4; // Rotate 45 degrees to the right
                break;
            case 2:
                newColor = "#FADF45";
                orbitAngleValue = -Math.PI / 4; // Rotate 45 degrees to the left
                break;
            case 3:
                newColor = "#e961A5";
                orbitAngleValue = -Math.PI * 0.75; // Rotate 135 degrees to the left
                break;
            case 4:
                newColor = "#06ABDB";
                orbitAngleValue = Math.PI * 0.75; // Rotate 135 degrees to the right
                break;
            default:
                newColor = "#DA70D6";
                orbitAngleValue = 0;
        }
        setColor(newColor);
        setIsAnimatingToSide(true);
        setSideOrbitAngle(orbitAngleValue); // Set the orbit angle for side buttons

        // Optionally, handle zoom or other actions here
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
    const [activeParticle, setActiveParticle] = useState<{
        id: number;
        position: [number, number, number];
        color: string;
    } | null>(null);

    const particleIdRef = useRef(0);


    const addParticleEffect = (position: [number, number, number], color: string) => {
        // Clear existing particle effect
        setActiveParticle(null);
        // Add new particle effect after a short delay to ensure cleanup
        setTimeout(() => {
            setActiveParticle({
                id: particleIdRef.current++,
                position,
                color,
            });
        }, 50);
    };

    const removeParticleEffect = () => {
        setActiveParticle(null);
    };


    return (
        <section
            id="home"
            className="min-h-screen flex items-center justify-center relative overflow-hidden"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
        >

            <div className="absolute inset-0 z-0">
                <Canvas
                    style={{ background: 'black' }}
                    camera={{ position: [0, 20, 30], fov: 60 }} // Adjusted camera position and FOV
                    shadows
                >
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[0, 20, 10]} intensity={1} castShadow />
                    <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
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
                    {showButtons && (
                        <>
                            {[
                                { side: 1, color: "#F7AA64" },
                                { side: 2, color: "#FADF45" },
                                { side: 3, color: "#e961A5" },
                                { side: 4, color: "#06ABDB" },
                            ].map(({ side, color }) => (
                                <InteractiveButton3D
                                    key={side}
                                    side={side}
                                    color={color}
                                    onClick={(position) => {
                                        handleSideButtonClick(side);
                                        addParticleEffect(position, color);
                                    }}
                                />
                            ))}
                        </>
                    )}

                    {/* Render active particle effect */}
                    {activeParticle && (
                        <ParticleEffect
                            key={activeParticle.id}
                            position={activeParticle.position}
                            color={activeParticle.color}
                            onComplete={removeParticleEffect}
                        />
                    )}
                </Canvas>
            </div>
            <InitialLoader
                onStartZoom={handleStartZoom}
                onShowButtons={handleShowButtons}
            />
            <AnimatePresence>
                {showClickAndDrag && ( // Conditional rendering for ClickAndDragAnimation
                    <motion.div
                        className="absolute bottom-0 right-0 p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }} // Fade out effect
                        transition={{ duration: 0.5 }} // Duration for fade effect
                    >
                        <ClickAndDragAnimation /> {/* Place ClickAndDrag component here */}
                    </motion.div>
                )}
            </AnimatePresence>

        </section>
    );
};

export default Coordinates;
