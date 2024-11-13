import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { ShaderMaterial } from "three";

// Define the maximum number of simultaneous ripples
const MAX_RIPPLES = 4;

interface Ripple {
    color: THREE.Color;
    startTime: number;
}

// GridPlane Component
export default function GridPlane({
    isAnimating,
    color,
}: {
    isAnimating: boolean;
    color: string;
}) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [ripples, setRipples] = useState<Ripple[]>([]);
    const [baseColor, setBaseColor] = useState(new THREE.Color(color));
    const clockRef = useRef<THREE.Clock>(new THREE.Clock());

    useEffect(() => {
        // Add a new ripple when the color changes
        setRipples((prev) => {
            const newRipples = [...prev, { color: new THREE.Color(color), startTime: clockRef.current.getElapsedTime() }];
            // Limit the number of ripples
            if (newRipples.length > MAX_RIPPLES) {
                newRipples.shift();
            }
            return newRipples;
        });
    }, [color]);

    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(100, 100, 100, 100);
        geo.rotateX(-Math.PI / 2);
        return geo;
    }, []);

    // Define a custom shader material
    const material = useMemo(() => {
        const vertexShader = `
            varying vec3 vPosition;
            void main() {
                vPosition = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            uniform vec3 baseColor;
            uniform float time;
            uniform float radius;
            uniform float transitionDuration;
            uniform int numRipples;
            uniform vec3 rippleColors[${MAX_RIPPLES}];
            uniform float rippleStartTimes[${MAX_RIPPLES}];
            varying vec3 vPosition;

            void main() {
                // Calculate distance from center
                float distance = length(vec2(vPosition.x, vPosition.z));
                
                // Initialize final color with base color
                vec3 finalColor = baseColor;
                
                // Iterate through all active ripples
                for(int i = 0; i < ${MAX_RIPPLES}; i++) {
                    if(i >= numRipples) break;

                    float elapsed = time - rippleStartTimes[i];
                    float currentRadius = elapsed * (radius / transitionDuration);

                    if(currentRadius >= distance) {
                        // Calculate the progress of the ripple at this distance
                        float progress = smoothstep(currentRadius - 1.0, currentRadius + 1.0, distance);
                        finalColor = mix(finalColor, rippleColors[i], 1.0 - progress);
                    }
                }

                // Apply wave animation
                float wave = sin(distance - time * 2.0) * 0.05;
                finalColor += wave;

                gl_FragColor = vec4(finalColor, 1.0);
            }
        `;

        return new ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                baseColor: { value: baseColor.clone() }, // Initialize with base color
                time: { value: 0 },
                radius: { value: 50 }, // Maximum radius for ripples
                transitionDuration: { value: 5.0 }, // Duration for a ripple to reach the edge
                numRipples: { value: 0 },
                rippleColors: { value: Array(MAX_RIPPLES).fill(new THREE.Color("#ffffff")) },
                rippleStartTimes: { value: Array(MAX_RIPPLES).fill(0) },
            },
            transparent: false,
        });
    }, [baseColor]);

    useFrame(() => {
        if (meshRef.current) {
            const elapsedTime = clockRef.current.getElapsedTime();
            const material = meshRef.current.material as ShaderMaterial;

            // Update the time uniform
            material.uniforms.time.value = elapsedTime;

            // Filter active ripples
            const activeRipples = ripples.filter(
                (ripple) => elapsedTime - ripple.startTime < material.uniforms.transitionDuration.value
            );

            // Identify completed ripples
            const completedRipples = ripples.filter(
                (ripple) => elapsedTime - ripple.startTime >= material.uniforms.transitionDuration.value
            );

            // Update baseColor with the color of the last completed ripple
            if (completedRipples.length > 0) {
                const latestCompletedRipple = completedRipples[completedRipples.length - 1];
                setBaseColor(latestCompletedRipple.color.clone());
            }

            // Update numRipples uniform
            material.uniforms.numRipples.value = activeRipples.length;

            // Prepare arrays for ripple colors and start times
            const colorsArray = material.uniforms.rippleColors.value;
            const startTimesArray = material.uniforms.rippleStartTimes.value;

            for (let i = 0; i < MAX_RIPPLES; i++) {
                if (i < activeRipples.length) {
                    colorsArray[i] = activeRipples[i].color;
                    startTimesArray[i] = activeRipples[i].startTime;
                } else {
                    colorsArray[i] = new THREE.Color("#ffffff"); // Default color (won't affect final color as ripple is inactive)
                    startTimesArray[i] = 0;
                }
            }

            // Mark uniforms as updated
            material.uniforms.rippleColors.value = colorsArray;
            material.uniforms.rippleStartTimes.value = startTimesArray;

            // Remove completed ripples from the state
            if (completedRipples.length > 0) {
                setRipples(activeRipples);
            }

            // Update the baseColor uniform
            material.uniforms.baseColor.value = baseColor;

            // Update wave animation
            if (isAnimating) {
                const positions = geometry.attributes.position
                    ? (geometry.attributes.position.array as Float32Array)
                    : null;

                if (positions) {
                    const radius = 50; // Must match the shader's radius
                    for (let i = 0; i < positions.length; i += 3) {
                        const x = positions[i];
                        const z = positions[i + 2];

                        const distance = Math.sqrt(x * x + z * z);

                        if (distance <= radius) {
                            positions[i + 1] = Math.sin(distance - elapsedTime) * 0.55;
                        } else {
                            positions[i + 1] = 0; // Reset displacement outside the circle
                        }
                    }

                    geometry.attributes.position.needsUpdate = true;
                    geometry.computeVertexNormals();
                }
            }
        }
    });

    return (
        <mesh ref={meshRef} geometry={geometry} material={material}>
            {/* The material is defined in the ShaderMaterial above */}
        </mesh>
    );
}