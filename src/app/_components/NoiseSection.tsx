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
            const positions = geometry.attributes.position ? (geometry.attributes.position.array as Float32Array) : null;

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
            <meshStandardMaterial
                color={color}
                wireframe
                opacity={0.5}
                transparent
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
        <mesh ref={meshRef} geometry={geometry} position={[0, 6, 0]} rotation={[0, 0, 0]}>
            <meshStandardMaterial color={color} />
        </mesh>
    );
};

// AnimatedCamera Component
type AnimatedCameraProps = {
    isAnimating: boolean;
    isZooming: boolean;
    targetPosition: { x: number; y: number; z: number };
};

const AnimatedCamera: React.FC<AnimatedCameraProps> = ({ isAnimating, isZooming, targetPosition }) => {
    const { camera } = useThree();

    useFrame(({ clock }) => {
        if (isAnimating) {
            const elapsedTime = clock.getElapsedTime();
            if (isZooming) {
                camera.position.z = Math.max(5, 50 - elapsedTime * 5);
                camera.position.y = Math.max(8, 20 - elapsedTime * 2);
            }
            camera.lookAt(0, 6, 0);
        }

        if (targetPosition) {
            camera.position.lerp(targetPosition, 0.1);
            camera.lookAt(0, 6, 0);
        }
    });

    return null;
};

// AnimatedText Component with onComplete Callback
const AnimatedText = ({
    text,
    onComplete,
    subTextRef,
}: {
    text: string;
    onComplete: () => void;
    subTextRef: React.RefObject<HTMLParagraphElement>;
}) => {
    const textRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        if (textRef.current) {
            gsap.fromTo(
                textRef.current.children,
                { y: 50, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.5,
                    stagger: 0.05,
                    onComplete: () => {
                        onComplete();
                        if (subTextRef.current) {
                            gsap.fromTo(
                                subTextRef.current,
                                { y: 20, opacity: 0 },
                                { y: 0, opacity: 1, duration: 0.5 }
                            );
                        }
                    },
                }
            );
        }
    }, [onComplete, subTextRef]);

    return (
        <span ref={textRef} className="inline-block">
            {text.split('').map((char, index) => (
                <span key={index} className="inline-block">
                    {char === ' ' ? <>&nbsp;</> : char}
                </span>
            ))}
        </span>
    );
};

const Coordinates = () => {
    const [isAnimating, setIsAnimating] = useState(true);
    const [isZooming, setIsZooming] = useState(false);
    const [showButtons, setShowButtons] = useState(false);
    const [targetPosition, setTargetPosition] = useState<THREE.Vector3 | null>(null);
    const [color, setColor] = useState("#DA70D6");
    const [showText, setShowText] = useState(true);
    const [showSubText, setShowSubText] = useState(false);
    const textRef = useRef<HTMLDivElement>(null);
    const subTextRef = useRef<HTMLParagraphElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [rotationX, setRotationX] = useState(0);
    const [rotationY, setRotationY] = useState(0);

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
            gsap.set(subTextRef.current, { opacity: 0, position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)' }); // Center subtext below the welcome text
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
        setTimeout(() => setShowButtons(true), 2000);

        gsap.to(textRef.current, {
            duration: 1,
            opacity: 0,
            scale: 2,
            ease: "power2.out",
            onComplete: () => {
                if (textRef.current) {
                    textRef.current.style.display = 'none';
                }
            },
        });
    };

    const handleSideButtonClick = (side: number) => {
        let newPosition: THREE.Vector3;
        let newColor: string;
        switch (side) {
            case 1:
                newPosition = new THREE.Vector3(11, 6, 5);
                newColor = "#F7AA64";
                break;
            case 2:
                newPosition = new THREE.Vector3(-5, 6, 0);
                newColor = "#06ABDB";
                break;
            case 3:
                newPosition = new THREE.Vector3(3, 6, 3);
                newColor = "#e961A5";
                break;
            case 4:
                newPosition = new THREE.Vector3(-3, 6, -3);
                newColor = "#FADF45";
                break;
            default:
                newPosition = new THREE.Vector3(-8, 10, 15);
                newColor = "#DA70D6";
        }
        setTargetPosition(newPosition);
        setColor(newColor);
    };

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
                    camera={{ position: [0, 20, 50], fov: 60 }}
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
                            <p ref={subTextRef} className="text-xl md:text-2xl text-gray-300 mb-8">
                                Experience the dynamic visuals and animations
                            </p>
                        )}
                    </div>
                )}
                {!isZooming && (
                    <button
                        ref={buttonRef}
                        onClick={handleButtonClick}
                        className="bg-primary px-8 py-3 rounded-full text-lg font-semibold hover:bg-primary-dark transition duration-300 z-10 bg-white p-2 rounded mt-4 opacity-0 mt-14"
                    >
                        Get in Touch
                    </button>
                )}
            </div>
            {showButtons && (
                <div className="absolute z-10 flex space-x-4 bottom-4 left-1/2 transform -translate-x-1/2">
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

export default Coordinates;