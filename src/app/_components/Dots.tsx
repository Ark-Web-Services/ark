"use client"

import { Canvas, useFrame } from '@react-three/fiber';
import type { ReactNode } from 'react'; // Changed to type-only import
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

// Shader for glass deformation
const glassVertexShader = `
  uniform vec2 uMouse;
  uniform float uPressure;
  varying vec3 vNormal;
  varying vec2 vUv;
  
  void main() {
    vUv = uv;
    vec3 pos = position;
    float dist = distance(uv, uMouse);
    pos.z -= smoothstep(0.0, 0.4, 1.0 - dist) * uPressure;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const glassFragmentShader = `
  uniform float uOpacity;
  varying vec3 vNormal;
  varying vec2 vUv;
  
  void main() {
    vec3 normal = normalize(vNormal);
    float fresnel = pow(1.0 - dot(normal, vec3(0.0, 0.0, 1.0)), 2.0);
    gl_FragColor = vec4(vec3(1.0), fresnel * uOpacity);
  }
`

interface MouseState {
    x: number;
    y: number;
    pressed: boolean;
}

interface MouseTrackerProps {
    children: (mouse: MouseState) => ReactNode
}

// Define a type for the uniforms to ensure type safety
interface ShaderUniforms {
    uMouse: { value: THREE.Vector2 };
    uPressure: { value: number };
    uOpacity: { value: number };
}

function Glass({ mouse }: { mouse: MouseState }) {
    const meshRef = useRef<THREE.Mesh>(null)
    // Extend ShaderMaterial to include typed uniforms
    const materialRef = useRef<THREE.ShaderMaterial & { uniforms: ShaderUniforms }>(null)

    useFrame(() => {
        if (materialRef.current?.uniforms) {
            const { uMouse, uPressure } = materialRef.current.uniforms;
            if (uMouse) uMouse.value.set(mouse.x, 1 - mouse.y);
            if (uPressure) uPressure.value = mouse.pressed ? 0.2 : 0;
        }
    })

    const uniforms = useMemo(() => ({
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uPressure: { value: 0 },
        uOpacity: { value: 0.2 },
    }), [])

    return (
        <mesh ref={meshRef} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[10, 10, 128, 128]} />
            <shaderMaterial
                ref={materialRef}
                vertexShader={glassVertexShader}
                fragmentShader={glassFragmentShader}
                uniforms={uniforms}
                transparent
                side={THREE.DoubleSide}
            />
        </mesh>
    )
}

function Orbs({ count = 100, mouse }: { count?: number; mouse: MouseState }) {
    const meshRef = useRef<THREE.InstancedMesh>(null) // Added type to useRef

    const dummy = useMemo(() => new THREE.Object3D(), [])
    const particles = useMemo(() => {
        const temp = []
        for (let i = 0; i < count; i++) {
            const t = Math.random() * 100
            const factor = 20 + Math.random() * 100
            const speed = 0.01 + Math.random() / 200
            const xFactor = -50 + Math.random() * 100
            const yFactor = -50 + Math.random() * 100
            const zFactor = -50 + Math.random() * 100
            temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 })
        }
        return temp
    }, [count])

    useFrame((state) => {
        particles.forEach((particle, i) => {
            const { factor, speed, xFactor, yFactor, zFactor } = particle // Changed to const
            particle.t += speed / 2 // Update t directly
            const t = particle.t // Use const since t is not reassigned

            const a = Math.cos(t) + Math.sin(t * 1) / 10
            const b = Math.sin(t) + Math.cos(t * 2) / 10
            const s = Math.cos(t)

            // Flock towards mouse and hover around it
            if (mouse.x !== 0 && mouse.y !== 0) {
                const mouseX = (mouse.x * state.viewport.width) / 2
                const mouseY = (mouse.y * state.viewport.height) / 2
                particle.mx += (mouseX - particle.mx) * 0.1 // Increase the factor to make particles move faster towards the mouse
                particle.my += (mouseY - particle.my) * 0.1 // Increase the factor to make particles move faster towards the mouse
            }

            dummy.position.set(
                (particle.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
                (particle.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
                (particle.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
            )
            dummy.scale.set(s, s, s)
            dummy.updateMatrix()
            if (meshRef.current) {
                meshRef.current.setMatrixAt(i, dummy.matrix)
            }
        })
        if (meshRef.current) {
            meshRef.current.instanceMatrix.needsUpdate = true
        }
    })
    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
            <sphereGeometry args={[0.1]} />
            <meshPhongMaterial color="#ff6030" />
        </instancedMesh>
    )
}

function MouseTracker({ children }: MouseTrackerProps) {
    const [mouse, setMouse] = useState({ x: 0, y: 0, pressed: false })
    useEffect(() => {
        const handleMouseMove = (event: MouseEvent) => {
            const canvas = event.target as HTMLElement | null
            if (!canvas) return
            const rect = canvas.getBoundingClientRect()
            const x = (event.clientX - rect.left) / rect.width
            const y = (event.clientY - rect.top) / rect.height
            setMouse(prev => ({ ...prev, x, y }))
        }

        const handleMouseDown = () => setMouse(prev => ({ ...prev, pressed: true }))
        const handleMouseUp = () => setMouse(prev => ({ ...prev, pressed: false }))

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mousedown', handleMouseDown)
        window.addEventListener('mouseup', handleMouseUp)

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mousedown', handleMouseDown)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [])

    return children(mouse)
}

export default function Component() {
    return (
        <div className="w-full h-screen">
            <MouseTracker>
                {(mouse) => (
                    <Canvas camera={{ position: [0, 5, 15], fov: 50 }}>
                        <color attach="background" args={['#f0f0f0']} />
                        <ambientLight intensity={0.5} />
                        <pointLight position={[10, 10, 10]} />
                        <Glass mouse={mouse} />
                        <Orbs count={200} mouse={mouse} />
                        <pointLight
                            position={[(mouse.x - 0.5) * 20, (0.5 - mouse.y) * 20, 5]}
                            color="yellow"
                            intensity={1}
                            distance={10}
                        />
                    </Canvas>
                )}
            </MouseTracker>
        </div>
    )
}