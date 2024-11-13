import { Html } from '@react-three/drei';
import gsap from 'gsap';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export interface InteractiveButton3DProps {
    side: number;
    color: string;
    onClick: (position: [number, number, number]) => void;
}

export default function InteractiveButton3D({ side, color, onClick }: InteractiveButton3DProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);

    // Handle hover animations
    useEffect(() => {
        if (meshRef.current) {
            gsap.to(meshRef.current.scale, { x: hovered ? 1.3 : 1, y: hovered ? 1.3 : 1, z: hovered ? 1.3 : 1, duration: 0.3 });
            gsap.to(meshRef.current.rotation, { y: hovered ? Math.PI / 4 : 0, duration: 0.3 });
        }
    }, [hovered]);

    // Calculate button position around the pyramid
    const radius = 8; // Increased distance from the center
    const elevation = 2.5; // Slightly higher elevation
    const angle = (side / 4) * Math.PI * 2; // Evenly distributed angles (0, 90, 180, 270 degrees)

    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;

    // Handle click event
    const handleClick = () => {
        if (meshRef.current) {
            // Get the world position of the mesh
            const worldPosition = new THREE.Vector3();
            meshRef.current.getWorldPosition(worldPosition);
            onClick([worldPosition.x, worldPosition.y, worldPosition.z]);
        }
    };

    return (
        <mesh
            ref={meshRef}
            onClick={handleClick}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
            position={[x, elevation, z]} // Updated positioning to circular arrangement
            castShadow
            receiveShadow
            renderOrder={1} // Ensure buttons render on top
        >
            <cylinderGeometry args={[0.7, 0.7, 0.2, 32]} /> {/* Rounded circular geometry */}
            <meshStandardMaterial
                color={color}
                emissive={hovered ? '#ffffff' : '#000000'}
                emissiveIntensity={hovered ? 0.5 : 0}
            />
            {/* Label */}
            <Html position={[0, 0, 0.11]} center>
                <div className="text-center text-white font-bold">{side}</div>
            </Html>
        </mesh>
    );
}