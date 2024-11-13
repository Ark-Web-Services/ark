import { Html } from '@react-three/drei';
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from 'three';
import DisplayFaceInfo from '../pyramid/DisplayFaceInfo';

export type AnimatedCameraProps = {
    isZooming: boolean;
    targetPosition: THREE.Vector3 | null;
    orbitAngle: number;
    isAnimatingToSide: boolean;
    sideOrbitAngle?: number;
    onZoomAnimationComplete: () => void;
    onSideAnimationComplete: () => void;
};

export default function AnimatedCamera({
    isZooming,
    targetPosition,
    orbitAngle,
    isAnimatingToSide,
    sideOrbitAngle,
    onZoomAnimationComplete,
    onSideAnimationComplete,
}: AnimatedCameraProps) {
    const { camera, clock } = useThree();
    const zoomStartTime = useRef<number | null>(null);
    const zoomInitialPosition = useRef<THREE.Vector3 | null>(null);
    const zoomInitialRotation = useRef<number | null>(null);

    const sideAnimation = useRef({
        startTime: null as number | null,
        initialPosition: null as THREE.Vector3 | null,
        initialRadius: null as number | null,
        initialTheta: null as number | null,
        initialPhi: null as number | null,
        targetRadius: null as number | null,
        targetTheta: null as number | null,
    });

    // State to track current face
    const [currentFace, setCurrentFace] = useState<string | null>(null);

    // Define the data for each face
    const faceData = {
        vision: {
            title: "Vision",
            content: "We craft visions that resonate across generations. Every pixel, every color, every word is deliberately chosen to tell your story.",
            visualConcept: "Expanding Possibility",
        },
        impact: {
            title: "Impact",
            content: "Transform your market presence with strategies that do more than reach audiences - they move them. We measure success in minds changed and hearts won.",
            visualConcept: "Force of Change",
        },
        artistry: {
            title: "Artistry",
            content: "Where creativity meets purpose. Our designs aren't just beautiful - they're carefully crafted solutions to your unique challenges.",
            visualConcept: "Creative Flow",
        },
        innovation: {
            title: "Innovation",
            content: "Pushing boundaries isn't just what we do - it's who we are. We blend cutting-edge technology with timeless design principles.",
            visualConcept: "Digital Evolution",
        },
    };

    // Initialize camera position once when the component mounts
    useEffect(() => {
        camera.position.set(0, 20, 50); // Set your desired initial position
        camera.lookAt(0, 6, 0); // Ensure the camera looks at the pyramid
        console.log("Camera initialized.");
    }, []); // Ensures this runs only once on mount

    // Helper function to determine the face based on angle
    const determineFace = (angleInDegrees: number): string | null => {
        console.log(`Determining face for angle: ${angleInDegrees}°`);
        let face: string | null = null;

        if (angleInDegrees >= -45 && angleInDegrees < 45) {
            face = "vision";
        } else if (angleInDegrees >= 45 && angleInDegrees < 135) {
            face = "impact";
        } else if (angleInDegrees >= 135 || angleInDegrees < -135) {
            face = "artistry";
        } else if (angleInDegrees >= -135 && angleInDegrees < -45) {
            face = "innovation";
        }

        console.log(`Face determined: ${face}`);
        return face;
    };

    // Internal callback for when zoom animation completes
    const handleZoomAnimationComplete = () => {
        console.log("Zoom animation completed.");
        onZoomAnimationComplete(); // Notify parent component

        // Determine the current face based on final camera orientation
        const cameraPosition = new THREE.Vector3();
        camera.getWorldPosition(cameraPosition);
        const offset = cameraPosition.clone().sub(new THREE.Vector3(0, 6, 0));
        const currentTheta = Math.atan2(offset.z, offset.x);
        let angleInDegrees = THREE.MathUtils.radToDeg(currentTheta);

        // Normalize angle to be between -180 and 180
        angleInDegrees = ((angleInDegrees + 180) % 360) - 180;

        const face = determineFace(angleInDegrees);
        setCurrentFace(face);
    };

    // Internal callback for when side animation completes
    const handleSideAnimationComplete = () => {
        console.log("Side animation completed.");
        onSideAnimationComplete(); // Notify parent component

        // Determine the current face based on final camera orientation
        const cameraPosition = new THREE.Vector3();
        camera.getWorldPosition(cameraPosition);
        const offset = cameraPosition.clone().sub(new THREE.Vector3(0, 6, 0));
        const currentTheta = Math.atan2(offset.z, offset.x);
        let angleInDegrees = THREE.MathUtils.radToDeg(currentTheta);

        // Normalize angle to be between -180 and 180
        angleInDegrees = ((angleInDegrees + 180) % 360) - 180;

        const face = determineFace(angleInDegrees);
        setCurrentFace(face);
    };

    useFrame(() => {
        // Handle Zoom Animation
        if (isZooming && targetPosition) {
            if (zoomStartTime.current === null) {
                zoomStartTime.current = clock.getElapsedTime();
                zoomInitialPosition.current = camera.position.clone();
                zoomInitialRotation.current = camera.rotation.y;
                console.log("Zoom animation started.");
            }
            const elapsed = clock.getElapsedTime() - (zoomStartTime.current ?? 0);
            const t = Math.min(elapsed / 3, 1); // Duration of 3 seconds
            const easeInOutQuad = (t: number) =>
                t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

            const easedT = easeInOutQuad(t);
            if (zoomInitialPosition.current !== null && zoomInitialRotation.current !== null) {
                camera.position.lerpVectors(zoomInitialPosition.current, targetPosition, easedT);
                camera.rotation.y = THREE.MathUtils.lerp(
                    zoomInitialRotation.current,
                    orbitAngle,
                    easedT
                );
                console.log(`Zoom animation progress: t=${t.toFixed(2)}, easedT=${easedT.toFixed(2)}`);
            }

            if (t >= 1) {
                // Animation complete
                console.log("Zoom animation reached completion.");
                zoomStartTime.current = null;
                zoomInitialPosition.current = null;
                zoomInitialRotation.current = null;

                // Call the internal callback
                handleZoomAnimationComplete();
            }
        }

        // Handle Side Animations
        if (isAnimatingToSide) {
            if (sideAnimation.current.startTime === null) {
                // Initialize side animation
                sideAnimation.current.startTime = clock.getElapsedTime();
                sideAnimation.current.initialPosition = camera.position.clone();
                const offset = camera.position.clone().sub(new THREE.Vector3(0, 6, 0));
                sideAnimation.current.initialRadius = offset.length();
                sideAnimation.current.initialTheta = Math.atan2(offset.z, offset.x);
                sideAnimation.current.initialPhi = Math.acos(
                    offset.y / sideAnimation.current.initialRadius!
                );
                sideAnimation.current.targetRadius = sideAnimation.current.initialRadius!; // Maintain current radius or set to desired fixed value
                sideAnimation.current.targetTheta = sideOrbitAngle ?? sideAnimation.current.initialTheta; // Orbit angle passed from Coordinates component

                console.log("Side animation started.");
            }

            const elapsed = clock.getElapsedTime() - (sideAnimation.current.startTime ?? 0);
            const t = Math.min(elapsed / 1, 1); // Duration of 1 second
            const easeInOutQuad = (t: number) =>
                t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            const easedT = easeInOutQuad(t);
            console.log(`Side animation progress: t=${t.toFixed(2)}, easedT=${easedT.toFixed(2)}`);

            const { initialRadius, targetRadius, initialTheta, targetTheta, initialPhi } = sideAnimation.current;

            if (
                initialRadius !== null &&
                initialTheta !== null &&
                initialPhi !== null &&
                targetTheta !== null && // Updated from targetTheta !== undefined
                targetRadius !== null // Ensure targetRadius is not null
            ) {
                const radius = initialRadius; // Maintain the same radius
                const theta = THREE.MathUtils.lerp(initialTheta, targetTheta, easedT);
                const phi = initialPhi; // No change in phi

                const x = radius * Math.sin(phi) * Math.cos(theta);
                const y = radius * Math.cos(phi);
                const z = radius * Math.sin(phi) * Math.sin(theta);

                camera.position.set(x, y + 6, z);
                camera.lookAt(0, 6, 0);
                console.log(`Camera position set to x:${x.toFixed(2)}, y:${y + 6}, z:${z.toFixed(2)}`);
            }

            if (t >= 1) {
                // Animation complete
                console.log("Side animation reached completion.");
                sideAnimation.current.startTime = null;
                sideAnimation.current.initialPosition = null;
                sideAnimation.current.initialRadius = null;
                sideAnimation.current.initialTheta = null;
                sideAnimation.current.initialPhi = null;
                sideAnimation.current.targetRadius = null;
                sideAnimation.current.targetTheta = null;

                // Call the internal callback
                handleSideAnimationComplete();
            }
        }

        // Ensure the camera only rotates around the Y-axis
        camera.rotation.x = 0;
        camera.rotation.z = 0;

        // Always look at the pyramid's position
        camera.lookAt(0, 6, 0);
    });

    return (
        <>
            {/* Render DisplayFaceInfo only when currentFace is set */}
            {currentFace && (
                <Html position={[0, 10, 0]} center>
                    <DisplayFaceInfo faceData={faceData[currentFace as keyof typeof faceData]} />
                </Html>
            )}
        </>
    );
}