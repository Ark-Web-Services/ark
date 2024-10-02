import Image from 'next/image'

export default function ClientLogos() {
    const logos = [
        { name: 'CPITXADEMEDIA', src: '/placeholder.svg?height=60&width=120' },
        { name: 'Jurin', src: '/placeholder.svg?height=60&width=120' },
        { name: 'just.', src: '/placeholder.svg?height=60&width=120' },
        { name: 'Glyphic', src: '/placeholder.svg?height=60&width=120' },
        { name: 'KARVE', src: '/placeholder.svg?height=60&width=120' },
        { name: 'Living Room Health', src: '/placeholder.svg?height=60&width=120' },
        { name: 'optimalcontrols', src: '/placeholder.svg?height=60&width=120' },
        { name: 'Prime Content', src: '/placeholder.svg?height=60&width=120' },
        { name: 'Pririty', src: '/placeholder.svg?height=60&width=120' },
        { name: 'Clock Logo', src: '/placeholder.svg?height=60&width=120' },
        { name: 'RAISE POLO', src: '/placeholder.svg?height=60&width=120' },
        { name: 'PCE', src: '/placeholder.svg?height=60&width=120' },
        { name: 'THE ATHLETES HOUSE', src: '/placeholder.svg?height=60&width=120' },
        { name: 'togggle', src: '/placeholder.svg?height=60&width=120' },
        { name: 'University of London', src: '/placeholder.svg?height=60&width=120' },
        { name: 'zyphe', src: '/placeholder.svg?height=60&width=120' },
    ]

    return (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-lg font-normal text-center mb-12">
                    Over 18 years of web design experience trusted by your peers
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 md:gap-8">
                    {logos.map((logo, index) => (
                        <div key={index} className="flex items-center justify-center bg-gray-100 p-4 rounded-lg">
                            <Image
                                src={logo.src}
                                alt={logo.name}
                                width={120}
                                height={60}
                                className="max-w-full h-auto"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}