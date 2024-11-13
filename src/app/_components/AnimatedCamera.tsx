import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from 'three';

// AnimatedCamera Component with separate logic for side buttons
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

    // Initialize camera position once when the component mounts
    useEffect(() => {
        camera.position.set(0, 20, 50); // Set your desired initial position
        camera.lookAt(0, 6, 0); // Ensure the camera looks at the pyramid
    }, [camera]);

    useFrame(() => {
        // Handle Zoom Animation
        if (isZooming && targetPosition) {
            if (zoomStartTime.current === null) {
                zoomStartTime.current = clock.getElapsedTime();
                zoomInitialPosition.current = camera.position.clone();
                zoomInitialRotation.current = camera.rotation.y;
            }
            const elapsed = clock.getElapsedTime() - (zoomStartTime.current ?? 0);
            const t = Math.min(elapsed / 3, 1); // Duration of 3 seconds
            const easeInOutQuad = (t: number) =>
                t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

            const easedT = easeInOutQuad(t);
            if (zoomInitialPosition.current && zoomInitialRotation.current !== null) {
                camera.position.lerpVectors(zoomInitialPosition.current, targetPosition, easedT);
                camera.rotation.y = THREE.MathUtils.lerp(
                    zoomInitialRotation.current,
                    orbitAngle,
                    easedT
                );
            }

            if (t >= 1) {
                // Animation complete
                onZoomAnimationComplete(); // Notify parent component
                zoomStartTime.current = null;
                zoomInitialPosition.current = null;
                zoomInitialRotation.current = null;
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
            }

            const elapsed = clock.getElapsedTime() - (sideAnimation.current.startTime ?? 0);
            const t = Math.min(elapsed / 1, 1); // Duration of 1 second
            const easeInOutQuad = (t: number) =>
                t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
            const easedT = easeInOutQuad(t);

            const { initialRadius, targetRadius, initialTheta, targetTheta, initialPhi } = sideAnimation.current;

            if (
                initialRadius !== null &&
                initialTheta !== null &&
                initialPhi !== null &&
                targetTheta !== undefined &&
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
            }

            if (t >= 1) {
                // Animation complete
                sideAnimation.current.startTime = null;
                sideAnimation.current.initialPosition = null;
                sideAnimation.current.initialRadius = null;
                sideAnimation.current.initialTheta = null;
                sideAnimation.current.initialPhi = null;
                sideAnimation.current.targetRadius = null;
                sideAnimation.current.targetTheta = null;

                // Notify parent component
                onSideAnimationComplete();
            }
        }

        // Ensure the camera only rotates around the Y-axis
        camera.rotation.x = 0;
        camera.rotation.z = 0;

        // Always look at the pyramid's position
        camera.lookAt(0, 6, 0);
    });

    return null;
};