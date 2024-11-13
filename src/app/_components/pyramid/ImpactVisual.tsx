import { useFrame } from '@react-three/fiber';
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';

const ImpactVisual: React.FC = () => {
    const shockwaveRef = useRef<THREE.Mesh>(null!);
    const forceFieldsRef = useRef<THREE.Group>(null!);
    const particlesRef = useRef<THREE.Points>(null!);

    // Shockwave Ripple Geometry
    const shockwaveGeometry = useMemo(() => new THREE.RingGeometry(1, 1.05, 32), []);
    const shockwaveMaterial = useMemo(() => new THREE.MeshBasicMaterial({
        color: 0xff4500,
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide
    }), []);

    // Force Fields Geometry
    const forceFieldCount = 5;
    const forceFieldGeometries = useMemo(() => {
        const geometries = [];
        for (let i = 0; i < forceFieldCount; i++) {
            const geometry = new THREE.TorusKnotGeometry(0.5, 0.05, 100, 16);
            geometries.push(geometry);
        }
        return geometries;
    }, [forceFieldCount]);

    // Particles Geometry
    const particlesGeometry = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        const count = 1000;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 10;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        return geometry;
    }, []);

    const particlesMaterial = useMemo(() => new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.05,
        transparent: true,
        opacity: 0.7
    }), []);

    useFrame((state, delta) => {
        // Animate Shockwave
        shockwaveRef.current.scale.x += delta;
        shockwaveRef.current.scale.y += delta;
        shockwaveRef.current.material.opacity -= delta * 0.5;
        if (shockwaveRef.current.scale.x > 5) {
            shockwaveRef.current.scale.set(1, 1, 1);
            shockwaveRef.current.material.opacity = 0.5;
        }

        // Animate Force Fields
        forceFieldsRef.current.children.forEach((child, index) => {
            child.rotation.x += delta * 0.5;
            child.rotation.y += delta * 0.5;
            child.material.opacity = 0.3 + Math.sin(state.clock.getElapsedTime() + index) * 0.2;
        });

        // Animate Particles
        particlesRef.current.rotation.y += delta * 0.2;
    });

    return (
        <>
            {/* Shockwave Ripple */}
            <mesh ref={shockwaveRef} position={[0, 0, 0]}>
                <ringGeometry args={[1, 1.05, 32]} />
                <meshBasicMaterial
                    color={0xff4500}
                    transparent
                    opacity={0.5}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Dynamic Force Fields */}
            <group ref={forceFieldsRef} position={[0, 0, 0]}>
                {forceFieldGeometries.map((geometry, index) => (
                    <mesh key={index} geometry={geometry}>
                        <meshStandardMaterial
                            color={0x1e90ff}
                            transparent
                            opacity={0.3}
                            metalness={0.5}
                            roughness={0.1}
                        />
                    </mesh>
                ))}
            </group>

            {/* Particles Bursting */}
            <points ref={particlesRef} geometry={particlesGeometry}>
                <pointsMaterial
                    attach="material"
                    color={0xffffff}
                    size={0.05}
                    transparent
                    opacity={0.7}
                />
            </points>
        </>
    );
};

export default ImpactVisual;
