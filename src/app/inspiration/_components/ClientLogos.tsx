
import Image from 'next/image'

export default function ClientLogos() {
    const logos = [
        { name: 'CPITADEMEDIA', width: 120, height: 30 },
        { name: 'Jooja', width: 80, height: 40 },
        { name: 'just.', width: 60, height: 30 },
        { name: 'Glyphic', width: 100, height: 30 },
        { name: 'KARVE', width: 80, height: 40 },
        { name: 'Living Room Health', width: 120, height: 30 },
        { name: 'optimalcontrols', width: 140, height: 30 },
        { name: 'Prime Content', width: 120, height: 30 },
        { name: 'Pririy', width: 80, height: 30 },
        { name: 'RAISE POLO', width: 120, height: 30 },
        { name: 'SPCE', width: 80, height: 30 },
        { name: 'THE ATHLETES PLACE', width: 140, height: 40 },
        { name: 'togggle', width: 100, height: 30 },
        { name: 'UNIVERSITY OF LONDON', width: 160, height: 40 },
        { name: 'zyphe', width: 80, height: 30 },
    ]

    return (
        <section className="py-16 px-6 max-w-7xl mx-auto">
            <h2 className="text-center text-[18px] font-normal mb-12">
                Over 18 years of web design experience trusted by your peers
            </h2>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-8 items-center justify-items-center">
                {logos.map((logo, index) => (
                    <div key={index} className="flex items-center justify-center">
                        <Image
                            src={`/placeholder.svg?height=${logo.height}&width=${logo.width}`}
                            alt={logo.name}
                            width={logo.width}
                            height={logo.height}
                            className="max-w-full h-auto opacity-50 hover:opacity-100 transition-opacity duration-300"
                        />
                    </div>
                ))}
            </div>
        </section>
    )
}