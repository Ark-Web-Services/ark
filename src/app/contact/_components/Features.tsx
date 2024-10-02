export default function Features() {
    const features = [
        {
            title: "Quick development",
            description: "With our efficient workflow, we ensure your project is completed promptly while maintaining the highest standards of quality."
        },
        {
            title: "Optimised for speed",
            description: "Our websites are designed for speed, ensuring fast load times that contribute to a superior user experience and improved SEO rankings."
        },
        {
            title: "SEO friendly",
            description: "We craft websites with a strong SEO foundation, aiming to boost your visibility in search engine results and attract your target audience."
        },
        {
            title: "Flexible and scalable",
            description: "Our web designs are both flexible and scalable, designed to accommodate your business's growth and changing needs over time."
        }
    ]

    return (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className="relative">
                            <h3 className="text-2xl font-medium mb-4">{feature.title}</h3>
                            <p className="text-base text-gray-600">{feature.description}</p>
                            {index < features.length - 1 && (
                                <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-px bg-gray-200"></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}