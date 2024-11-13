import { useFrame } from '@react-three/fiber';
import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';

const ArtistryVisual: React.FC = () => {
    const fluidRef = useRef<THREE.Mesh>(null!);
    const curvesRef = useRef<THREE.Line[]>([]);
    const particlesRef = useRef<THREE.Points>(null!);

    // Fluid Simulation Geometry
    const fluidGeometry = useMemo(() => new THREE.PlaneGeometry(5, 5, 64, 64), []);

    // Curves Geometry
    const curveCount = 10;
    const curves = useMemo(() => {
        const curvesArray: THREE.Line[] = [];
        for (let i = 0; i < curveCount; i++) {
            const path = new THREE.CubicBezierCurve3(
                new THREE.Vector3(-2, 0, 0),
                new THREE.Vector3(i * 0.5, 2, 0),
                new THREE.Vector3(-i * 0.5, 2, 0),
                new THREE.Vector3(2, 0, 0)
            );
            const points = path.getPoints(50);
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: new THREE.Color(`hsl(${(i * 36) % 360}, 100%, 50%)`),
                transparent: true,
                opacity: 0.6
            });
            const line = new THREE.Line(geometry, material);
            curvesArray.push(line);
        }
        return curvesArray;
    }, [curveCount]);

    // Particles for Color Gradients
    const particlesGeometry = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        const count = 500;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 5;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 5;

            const color = new THREE.Color(`hsl(${Math.random() * 360}, 100%, 75%)`);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        return geometry;
    }, []);

    const particlesMaterial = useMemo(() => new THREE.PointsMaterial({
        size: 0.05,
        vertexColors: true,
        transparent: true,
        opacity: 0.8
    }), []);

    useFrame((state, delta) => {
        // Animate Fluid
        fluidRef.current.material.displacementScale = Math.sin(state.clock.getElapsedTime()) * 0.1;

        // Animate Curves
        curvesRef.current.forEach((line, index) => {
            line.rotation.z += delta * 0.2;
            line.material.opacity = 0.5 + Math.sin(state.clock.getElapsedTime() + index) * 0.3;
        });

        // Animate Particles
        particlesRef.current.rotation.x += delta * 0.1;
        particlesRef.current.rotation.y += delta * 0.1;
    });

    return (
        <>
            {/* Fluid Simulation */}
            <mesh ref={fluidRef} geometry={fluidGeometry} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]}>
                <meshStandardMaterial
                    color={0x00ffff}
                    metalness={0.5}
                    roughness={0.1}
                    displacementMap={new THREE.TextureLoader().load('/textures/water-disp.png')}
                    displacementScale={0.1}
                    transparent
                    opacity={0.6}
                />
            </mesh>

            {/* Dancing Curves */}
            <group>
                {curves.map((curve, index) => (
                    <primitive
                        key={index}
                        object={curve}
                        ref={el => {
                            if (el) curvesRef.current[index] = el;
                        }}
                    />
                ))}
            </group>

            {/* Shifting Color Particles */}
            <points ref={particlesRef} geometry={particlesGeometry}>
                <pointsMaterial
                    attach="material"
                    size={0.05}
                    vertexColors
                    transparent
                    opacity={0.8}
                />
            </points>
        </>
    );
};

export default ArtistryVisual;
