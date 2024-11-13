import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";

// Pyramid Component
interface PyramidProps {
    isAnimating: boolean;
    color: string;
}

const Pyramid: React.FC<PyramidProps> = ({ isAnimating, color }) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const amplitude = 0.5;
    const speed = 2;

    const geometry = useMemo(() => {
        const geom = new THREE.ConeGeometry(3.6, 4.86, 4);
        return geom;
    }, []);

    useFrame(({ clock }) => {
        if (isAnimating) {
            const time = clock.getElapsedTime();
            if (meshRef.current) {
                meshRef.current.position.y = 6 + amplitude * Math.sin(time * speed);
            }
        }
    });

    return (
        <mesh
            ref={meshRef}
            geometry={geometry}
            position={[0, 6, 0]}
            rotation={[0, 0, 0]}
        >
            <meshStandardMaterial color={color} />
        </mesh>
    );
};
