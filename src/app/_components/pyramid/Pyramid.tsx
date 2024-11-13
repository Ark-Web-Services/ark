'use client';

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from 'three';

// Pyramid Component
export interface PyramidProps {
    isAnimating: boolean;
}

export default function Pyramid({ isAnimating }: PyramidProps) {
    const meshRef = useRef<THREE.Mesh>(null);
    const amplitude = 0.5;
    const speed = 2;

    // Local colors array for the sides
    const colors = ["#F7AA64", "#FADF45", "#e961A5", "#06ABDB"];

    // Create non-indexed geometry with 4 radial segments (sides)
    const geometry = useMemo(() => {
        // Create ConeGeometry
        const geom = new THREE.ConeGeometry(3.6, 4.86, 4, 1, false);

        // Convert to non-indexed geometry
        const nonIndexedGeom = geom.toNonIndexed();

        // Clear existing groups to avoid conflicts
        nonIndexedGeom.clearGroups();

        const count = nonIndexedGeom.attributes.position?.count; // Total vertices
        const faces = count ? count / 3 : 0; // Each face has 3 vertices

        console.log(`Count: ${count}, Faces: ${faces}`); // Debugging

        // Assign materials to faces
        for (let i = 0; i < faces; i++) {
            if (i < 8) { // First 8 faces are the sides (2 triangles per side)
                const materialIndex = Math.floor(i / 2); // Two faces per material
                nonIndexedGeom.addGroup(i * 3, 3, materialIndex);
            } else { // Remaining 4 faces are the base
                nonIndexedGeom.addGroup(i * 3, 3, 4); // Material index 4 for the base
            }
        }

        return nonIndexedGeom;
    }, []);

    // Define materials: 4 for sides and 1 for the base using MeshStandardMaterial
    const materials = useMemo(() => {
        // Ensure that the colors array has exactly 4 colors
        if (colors.length !== 4) {
            console.warn("Pyramid component expects exactly 4 colors for the sides.");
        }

        // Create materials for each side with realistic shading
        const sideMaterials = colors.slice(0, 4).map(color =>
            new THREE.MeshStandardMaterial({
                color,
                metalness: 0.3,     // Adjusts the metallic appearance
                roughness: 0.7,     // Adjusts the surface roughness
                side: THREE.DoubleSide
            })
        );

        // Create material for the base
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: '#ffffff',
            metalness: 0.2,
            roughness: 0.9,
            side: THREE.DoubleSide
        });

        return [...sideMaterials, baseMaterial];
    }, [colors]);

    // Debugging: Log geometry groups and materials
    useEffect(() => {
        if (geometry.groups) {
            console.log("Geometry Groups:");
            geometry.groups.forEach((group, index) => {
                console.log(`Group ${index}: Start=${group.start}, Count=${group.count}, MaterialIndex=${group.materialIndex}`);
            });
        }

        console.log(`Total Materials: ${materials.length}`);
        materials.forEach((mat, idx) => {
            console.log(`Material ${idx}: Color=${(mat as any).color.getStyle()}`);
        });
    }, [geometry, materials]);

    // Animation: Move the pyramid up and down if isAnimating is true
    useFrame(({ clock }) => {
        if (isAnimating && meshRef.current) {
            const time = clock.getElapsedTime();
            meshRef.current.position.y = 6 + amplitude * Math.sin(time * speed);
        }
    });

    return (
        <mesh
            ref={meshRef}
            geometry={geometry}
            position={[0, 6, 0]}
            rotation={[0, 0, 0]}
            material={materials}
        >
        </mesh>
    );
};