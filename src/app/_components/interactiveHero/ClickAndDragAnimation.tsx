'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { FaHandPointer } from 'react-icons/fa'

export default function ClickAndDragAnimation() {
    const [size, setSize] = useState(200)

    useEffect(() => {
        const updateSize = () => {
            const newSize = Math.min(window.innerWidth - 32, window.innerHeight - 32, 150)
            setSize(newSize)
        }

        updateSize()
        window.addEventListener('resize', updateSize)
        return () => window.removeEventListener('resize', updateSize)
    }, [])

    const handVariants = {
        initial: { x: size * 0.8, y: size * 0.8, opacity: 0, scale: 1 },
        animate: {
            x: [size * 0.8, size * 0.7, size * 0.6],
            y: [size * 0.8, size * 0.6, size * 0.4],
            opacity: [0, 1, 1, 0],
            scale: [1, 0.8, 1, 1],
            transition: {
                duration: 3,
                times: [0, 0.1, 0.9, 1],
                repeat: Infinity,
                repeatDelay: 0.5,
                ease: "easeInOut"
            }
        }
    }

    const axesVariants = {
        initial: { opacity: 1 },
        animate: {
            transition: {
                duration: 3,
                times: [0, 0.1, 0.9, 1],
                repeat: Infinity,
                repeatDelay: 0.5,
                ease: "easeInOut"
            }
        }
    }

    // Amount to shift the X-axis and related elements upwards
    const shiftY = 5

    return (
        <div className="absolute bottom-0 right-0 p-4"> {/* Positioning the ClickAndDrag component */}
            <div className="rounded-lg shadow-lg overflow-hidden" style={{ width: `${size}px`, height: `${size}px` }}>
                <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
                    <motion.g variants={axesVariants} initial="initial" animate="animate">
                        {/* Y-axis */}
                        <line
                            x1={size / 2}
                            y1={size * 0.1}
                            x2={size / 2}
                            y2={size * 0.9}
                            stroke="white" // Ensure the stroke color is white
                            strokeWidth="4"
                        />
                        <polygon
                            points={`${size / 2 - 5},${size * 0.12} ${size / 2},${size * 0.1} ${size / 2 + 5},${size * 0.12}`}
                            fill="white"
                        />
                        <polygon
                            points={`${size / 2 - 5},${size * 0.88} ${size / 2},${size * 0.9} ${size / 2 + 5},${size * 0.88}`}
                            fill="white"
                        />
                        <text x={size / 2 + 10} y={size * 0.1} fill="white" fontSize="12">y</text>

                        {/* X-axis (curved downwards) */}
                        <path
                            d={`M${size * 0.1},${size / 2 - shiftY} Q${size / 2},${size * 0.7 - shiftY} ${size * 0.9},${size / 2 - shiftY}`}
                            fill="none"
                            stroke="white" // Ensure the stroke color is white
                            strokeWidth="4"
                        />

                        <polygon
                            points={`${size * 0.08},${size / 2 - shiftY} ${size * 0.1},${size / 2 - shiftY - 4} ${size * 0.1},${size / 2 - shiftY + 4}`}
                            fill="white"
                            transform={`rotate(15, ${size * 0.1}, ${size / 2 - shiftY})`}
                        />
                        <polygon
                            points={`${size * 0.92},${size / 2 - shiftY} ${size * 0.9},${size / 2 - shiftY - 4} ${size * 0.9},${size / 2 - shiftY + 4}`}
                            fill="white"
                            transform={`rotate(-15, ${size * 0.9}, ${size / 2 - shiftY})`}
                        />
                        <text x={size * 0.92} y={size / 2 - shiftY + 15} fill="white" fontSize="12">x</text>
                    </motion.g>

                    {/* Hand icon */}
                    <motion.g
                        variants={handVariants}
                        initial="initial"
                        animate="animate"
                    >
                        <FaHandPointer color="white" size={size * 0.2} />
                    </motion.g>
                </svg>
            </div>
        </div>
    )
}
