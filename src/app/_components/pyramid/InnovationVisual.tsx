import { useFrame } from '@react-three/fiber';
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';

const InnovationVisual: React.FC = () => {
    const gridRef = useRef<THREE.Group>(null!);
    const binaryRef = useRef<THREE.Points>(null!);
    const circuitRef = useRef<THREE.Mesh>(null!);

    // Grid Systems Geometry
    const gridCount = 10;
    const grids = useMemo(() => {
        const gridArray: JSX.Element[] = [];
        for (let i = 0; i < gridCount; i++) {
            gridArray.push(
                <mesh key={i} position={[0, 0, i * 0.5]}>
                    <planeGeometry args={[5, 5, 10, 10]} />
                    <meshBasicMaterial
                        color={0x00ff00}
                        wireframe
                        transparent
                        opacity={0.2}
                    />
                </mesh>
            );
        }
        return gridArray;
    }, [gridCount]);

    // Binary Data Streams Geometry
    const binaryGeometry = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        const count = 1000;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        return geometry;
    }, []);

    const binaryMaterial = useMemo(() => new THREE.PointsMaterial({
        color: 0x00ffff,
        size: 0.02,
        transparent: true,
        opacity: 0.5
    }), []);

    // Circuit Patterns Geometry
    const circuitGeometry = useMemo(() => new THREE.TorusKnotGeometry(1, 0.4, 100, 16), []);
    const circuitMaterial = useMemo(() => new THREE.MeshStandardMaterial({
        color: 0xff00ff,
        metalness: 0.7,
        roughness: 0.2,
        emissive: 0x00ffff,
        emissiveIntensity: 0.5
    }), []);

    useFrame((state, delta) => {
        // Animate Grids
        gridRef.current.rotation.y += delta * 0.1;
        gridRef.current.rotation.x += delta * 0.05;

        // Animate Binary Data Streams
        binaryRef.current.rotation.y += delta * 0.2;

        // Animate Circuit Patterns
        circuitRef.current.rotation.x += delta * 0.3;
        circuitRef.current.rotation.y += delta * 0.3;
    });

    return (
        <>
            {/* Transforming Grid Systems */}
            <group ref={gridRef} position={[0, 0, 0]}>
                {grids}
            </group>

            {/* Binary Data Streams */}
            <points ref={binaryRef} geometry={binaryGeometry}>
                <pointsMaterial
                    attach="material"
                    color={0x00ffff}
                    size={0.02}
                    transparent
                    opacity={0.5}
                />
            </points>

            {/* Circuit-like Patterns */}
            <mesh ref={circuitRef} geometry={circuitGeometry} position={[0, 0, 0]}>
                <meshStandardMaterial
                    color={0xff00ff}
                    metalness={0.7}
                    roughness={0.2}
                    emissive={new THREE.Color(0x00ffff)}
                    emissiveIntensity={0.5}
                />
            </mesh>

            {/* Dynamic Meshes or Additional Elements */}
            {/* Add more elements as needed to enhance the digital evolution theme */}
        </>
    );
};

export default InnovationVisual;
