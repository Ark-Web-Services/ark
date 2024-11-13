import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

export default function VisionVisual() {
    const particlesRef = useRef<THREE.Points>(null);

    useFrame(() => {
        // Animation logic for particles
        if (particlesRef.current) {
            particlesRef.current.rotation.y += 0.005;
        }
    });

    return (
        <points ref={particlesRef}>
            {/* Define your particle geometry and material */}
        </points>
    );
}