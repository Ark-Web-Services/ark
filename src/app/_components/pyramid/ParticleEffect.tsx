import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

interface ParticleEffectProps {
    position: [number, number, number];
    color: string; // Color based on the button pressed
    onComplete: () => void; // Callback to notify when the effect is complete
}

interface MouseState {
    x: number;
    y: number;
    pressed: boolean;
}


export default function ParticleEffect({ position, color, onComplete }: ParticleEffectProps) {
    const meshRef = useRef<THREE.InstancedMesh>(null);

    const particleCount = 200; // Number of particles
    const lifespan = 2; // Lifespan of each particle in seconds
    const particles = useRef<{ t: number; factor: number; speed: number; xFactor: number; yFactor: number; zFactor: number; mx: number; my: number; elapsed: number }[]>([]);
    const opacityRef = useRef<number[]>([]); // Track opacity for each particle

    // Initialize particles
    useEffect(() => {
        const tempParticles: typeof particles.current = [];
        const tempOpacity: number[] = [];

        for (let i = 0; i < particleCount; i++) {
            const t = Math.random() * 100;
            const factor = 20 + Math.random() * 100;
            const speed = 0.01 + Math.random() / 200;
            const xFactor = -50 + Math.random() * 100;
            const yFactor = -50 + Math.random() * 100;
            const zFactor = -50 + Math.random() * 100;
            tempParticles.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0, elapsed: 0 });
            tempOpacity.push(1); // Initialize opacity to 1
        }

        particles.current = tempParticles;
        opacityRef.current = tempOpacity;
    }, [particleCount]);

    const dummy = useMemo(() => new THREE.Object3D(), []);

    // Initialize material with color and transparency
    const material = useMemo(() => {
        return new THREE.MeshPhongMaterial({
            color: color,
            transparent: true,
            opacity: 1,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            // Optional: Add a texture for aura effect
            // map: new THREE.TextureLoader().load('/textures/circle.png'), // Ensure the texture path is correct
            // alphaTest: 0.5,
        });
    }, [color]);

    useFrame((state, delta) => {
        if (meshRef.current) {
            particles.current.forEach((particle, i) => {
                // Update elapsed time
                particle.elapsed += delta;
                if (particle.elapsed >= lifespan) {
                    // Reset particle
                    particle.t = Math.random() * 100;
                    particle.elapsed = 0;
                    opacityRef.current[i] = 1; // Reset opacity
                } else {
                    // Calculate life ratio
                    const lifeRatio = 1 - particle.elapsed / lifespan;
                    opacityRef.current[i] = lifeRatio; // Update opacity

                    // Update position based on particle's speed and factors
                    particle.t += particle.speed / 2;

                    const a = Math.cos(particle.t) + Math.sin(particle.t * 1) / 10;
                    const b = Math.sin(particle.t) + Math.cos(particle.t * 2) / 10;
                    const s = Math.cos(particle.t);

                    // Update mouse influence if needed (can be passed as prop if required)
                    // For standalone particles without mouse interaction, this can be omitted

                    dummy.position.set(
                        (particle.mx / 10) * a + particle.xFactor + Math.cos((particle.t / 10) * particle.factor) + (Math.sin(particle.t * 1) * particle.factor) / 10,
                        (particle.my / 10) * b + particle.yFactor + Math.sin((particle.t / 10) * particle.factor) + (Math.cos(particle.t * 2) * particle.factor) / 10,
                        (particle.my / 10) * b + particle.zFactor + Math.cos((particle.t / 10) * particle.factor) + (Math.sin(particle.t * 3) * particle.factor) / 10
                    );
                    dummy.scale.set(s, s, s);
                    dummy.updateMatrix();
                    meshRef.current.setMatrixAt(i, dummy.matrix);
                }
            });

            // Update opacity for each instance
            for (let i = 0; i < particleCount; i++) {
                const instanceMaterial = meshRef.current.material as THREE.MeshPhongMaterial;
                instanceMaterial.opacity = opacityRef.current[i];
            }

            meshRef.current.instanceMatrix.needsUpdate = true;
            // Notify parent if all particles have completed their lifespan
            const allCompleted = particles.current.every(p => p.elapsed >= lifespan);
            if (allCompleted) {
                onComplete();
            }
        }
    });

    return (
        <instancedMesh ref={meshRef} args={[undefined, material, particleCount]} position={position}>
            <sphereGeometry args={[0.1, 16, 16]} />
            {/* Ensure the material is applied correctly */}
            <meshPhongMaterial attach="material" />
        </instancedMesh>
    );
}