import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
// GridPlane Component
export default function GridPlane({ isAnimating, color }: { isAnimating: boolean; color: string }) {
    const meshRef = useRef<THREE.Mesh>(null);

    const geometry = useMemo(() => {
        const geo = new THREE.PlaneGeometry(100, 100, 100, 100);
        geo.rotateX(-Math.PI / 2);
        return geo;
    }, []);

    useFrame(({ clock }) => {
        if (isAnimating) {
            const time = clock.getElapsedTime();
            const positions = geometry.attributes.position
                ? (geometry.attributes.position.array as Float32Array)
                : null;

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
            <meshStandardMaterial color={color} wireframe opacity={0.5} transparent />
        </mesh>
    );
}