'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { gsap } from 'gsap';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createNoise2D } from 'simplex-noise';
import * as THREE from 'three';

// GridPlane Component
function GridPlane({ isAnimating, color }: { isAnimating: boolean; color: string }) {
    const meshRef = useRef<THREE.Mesh>(null);

    const noise2D = useMemo(() => createNoise2D(), []);

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

// AnimatedCamera Component with separate logic for side buttons
type AnimatedCameraProps = {
    isAnimating: boolean;
    isZooming: boolean;
    targetPosition: { x: number; y: number; z: number };
    orbitAngle: number;
    // New props for side button animations
    isAnimatingToSide: boolean;
    sideOrbitAngle?: number;
    setIsAnimatingToSide: React.Dispatch<React.SetStateAction<boolean>>;
};

const AnimatedCamera: React.FC<AnimatedCameraProps> = ({
    isAnimating,
    isZooming,
    targetPosition,
    orbitAngle,
    isAnimatingToSide,
    sideOrbitAngle,
    setIsAnimatingToSide,
}) => {
    const { camera, clock } = useThree();
    const [startTime, setStartTime] = useState<number | null>(null);
    const [initialPosition, setInitialPosition] = useState<THREE.Vector3 | null>(null);
    const [initialRotation, setInitialRotation] = useState<number | null>(null);

    // Refs for side button animations
    const sideAnimation = useRef({
        startTime: null as number | null,
        initialPosition: null as THREE.Vector3 | null,
        initialRadius: null as number | null,
        initialTheta: null as number | null,
        initialPhi: null as number | null,
        targetRadius: null as number | null,
        targetTheta: null as number | null,
    });

    useFrame(() => {
        // Logic for "Get in Touch" button animation
        if (isAnimating && isZooming) {
            if (startTime === null) {
                setStartTime(clock.getElapsedTime());
                setInitialPosition(camera.position.clone());
                setInitialRotation(camera.rotation.y);
            }
            const elapsedTime = clock.getElapsedTime() - (startTime ?? 0);
            const t = Math.min(elapsedTime / 3, 1); // Duration of 3 seconds
            const easeInOutQuad = (t: number) =>
                t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

            const easedT = easeInOutQuad(t);
            if (initialPosition && initialRotation !== null) {
                camera.position.lerpVectors(initialPosition, targetPosition, easedT);
                camera.rotation.y = THREE.MathUtils.lerp(
                    initialRotation,
                    orbitAngle,
                    easedT
                );
            }
        } else if (targetPosition) {
            camera.position.lerp(targetPosition, 0.1);
        }

        // Logic for side button animations
        if (isAnimatingToSide) {
            if (sideAnimation.current.startTime === null) {
                sideAnimation.current.startTime = clock.getElapsedTime();
                sideAnimation.current.initialPosition = camera.position.clone();
                const offset = camera.position.clone().sub(new THREE.Vector3(0, 6, 0));
                sideAnimation.current.initialRadius = offset.length();
                sideAnimation.current.initialTheta = Math.atan2(offset.z, offset.x);
                sideAnimation.current.initialPhi = Math.acos(
                    offset.y / sideAnimation.current.initialRadius!
                );
                sideAnimation.current.targetRadius =
                    sideAnimation.current.initialRadius! + 5; // Zoom out by 5 units
                sideAnimation.current.targetTheta = sideOrbitAngle; // Orbit angle passed from Coordinates component
            }
            const elapsedTime =
                clock.getElapsedTime() - (sideAnimation.current.startTime ?? 0);
            const t = Math.min(elapsedTime / 1, 1); // duration 1 second
            const easeInOutQuad = (t: number) =>
                t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            const easedT = easeInOutQuad(t);

            if (
                sideAnimation.current.initialRadius !== null &&
                sideAnimation.current.initialTheta !== null &&
                sideAnimation.current.initialPhi !== null &&
                sideAnimation.current.targetTheta !== undefined &&
                sideAnimation.current.targetRadius !== undefined
            ) {
                const radius = THREE.MathUtils.lerp(
                    sideAnimation.current.initialRadius!,
                    sideAnimation.current.targetRadius!,
                    easedT
                );
                const theta = THREE.MathUtils.lerp(
                    sideAnimation.current.initialTheta!,
                    sideAnimation.current.targetTheta!,
                    easedT
                );
                const phi = sideAnimation.current.initialPhi!; // No change in phi

                const x = radius * Math.sin(phi) * Math.cos(theta);
                const y = radius * Math.cos(phi);
                const z = radius * Math.sin(phi) * Math.sin(theta);

                camera.position.set(x + 0, y + 6, z + 0);
                camera.lookAt(0, 6, 0);
            }
            if (t >= 1) {
                // Animation complete
                setIsAnimatingToSide(false); // Stop the animation
                sideAnimation.current.startTime = null;
                sideAnimation.current.initialPosition = null;
                sideAnimation.current.initialRadius = null;
                sideAnimation.current.initialTheta = null;
                sideAnimation.current.initialPhi = null;
                sideAnimation.current.targetRadius = null;
                sideAnimation.current.targetTheta = null;
            }
        }

        // Ensure the camera only rotates around the Y-axis
        camera.rotation.x = 0;
        camera.rotation.z = 0;

        // Always look at the pyramid's position
        camera.lookAt(0, 6, 0);
    });

    useEffect(() => {
        if (!isZooming) {
            setStartTime(null);
            setInitialPosition(null);
            setInitialRotation(null);
        }
    }, [isZooming]);

    return null;
};

// Coordinates Component with separate state and logic for side buttons
const Coordinates = () => {
    const [isAnimating, setIsAnimating] = useState(true);
    const [isZooming, setIsZooming] = useState(false);
    const [showButtons, setShowButtons] = useState(false);
    const [targetPosition, setTargetPosition] = useState<THREE.Vector3 | null>(null);
    const [orbitAngle, setOrbitAngle] = useState(0);
    const [color, setColor] = useState("#DA70D6");
    const [showText, setShowText] = useState(true);
    const [showSubText, setShowSubText] = useState(false);
    const textRef = useRef<HTMLDivElement>(null);
    const subTextRef = useRef<HTMLParagraphElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [rotationX, setRotationX] = useState(0);
    const [rotationY, setRotationY] = useState(0);

    // State variables for side button animations
    const [isAnimatingToSide, setIsAnimatingToSide] = useState(false);
    const [sideOrbitAngle, setSideOrbitAngle] = useState<number | null>(null);

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
        setIsZooming(true);
        setTargetPosition(new THREE.Vector3(0, 5, 8)); // Final destination

        gsap.to(textRef.current, {
            duration: 1,
            opacity: 0,
            scale: 2,
            ease: "power2.inOut",
            onComplete: () => {
                if (textRef.current) {
                    textRef.current.style.display = 'none';
                }
            },
        });

        gsap.to(buttonRef.current, {
            duration: 0.2, // Faster duration for the button
            opacity: 0,
            y: 50, // Move the button down
            ease: "power2.inOut",
            onComplete: () => {
                if (buttonRef.current) {
                    buttonRef.current.style.display = 'none';
                }
                setTimeout(() => setShowButtons(true), 2000);
            },
        });
    };

    const handleSideButtonClick = (side: number) => {
        if (isAnimatingToSide) return; // Prevent starting a new animation if one is in progress

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

    useEffect(() => {
        if (showButtons) {
            gsap.fromTo(
                ".side-button",
                { opacity: 0 },
                { opacity: 1, duration: 0.5, stagger: 0.1 }
            );
        }
    }, [showButtons]);

    const handlePointerDown = () => {
        setIsDragging(true);
    };

    const handlePointerUp = () => {
        setIsDragging(false);
        setRotationX(0);
        setRotationY(0);
    };

    const handlePointerMove = (event: React.PointerEvent) => {
        if (isDragging) {
            const movementX = event.movementX * 0.0001;
            const movementY = event.movementY * 0.0001;
            setRotationX(movementX);
            setRotationY(movementY);
        }
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
                <Canvas
                    camera={{ position: [0, 20, 50] }}
                    style={{ background: 'black' }}
                >
                    <ambientLight intensity={0.5} />
                    <directionalLight position={[0, 10, 0]} intensity={1} />
                    <GridPlane isAnimating={isAnimating} color={color} />
                    <Pyramid isAnimating={isAnimating} color={color} />
                    <AnimatedCamera
                        isAnimating={isAnimating}
                        isZooming={isZooming}
                        targetPosition={targetPosition ?? { x: 0, y: 20, z: 50 }}
                        orbitAngle={orbitAngle}
                        isAnimatingToSide={isAnimatingToSide}
                        sideOrbitAngle={sideOrbitAngle ?? 0}
                        setIsAnimatingToSide={setIsAnimatingToSide}
                    />
                </Canvas>
            </div>
            <div className="container mx-auto px-6 relative z-10 flex flex-col items-center mt-20">
                {showText && (
                    <div ref={textRef} className="text-center relative">
                        <h1 className="text-5xl md:text-7xl font-bold mb-6 text-white">
                            {"Welcome to the Noise Section".split('').map((char, index) => (
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
                                Experience the dynamic visuals and animations
                            </p>
                        )}
                    </div>
                )}
                <button
                    ref={buttonRef}
                    onClick={handleButtonClick}
                    className="bg-primary px-8 py-3 rounded-full text-lg font-semibold hover:bg-primary-dark transition duration-300 z-10 bg-white p-2 rounded mt-4 opacity-0 mt-14"
                >
                    Get in Touch
                </button>
            </div>
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