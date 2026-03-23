export default function Process() {
  const steps = [
    {
      number: "01",
      title: "Discovery",
      description: "We define goals, audiences, current gaps, and what the website actually needs to accomplish."
    },
    {
      number: "02",
      title: "Messaging & Structure",
      description: "We shape the positioning, sitemap, page hierarchy, and conversion flow."
    },
    {
      number: "03",
      title: "Design & Build",
      description: "We create the site with a focus on trust, usability, speed, and polish."
    },
    {
      number: "04",
      title: "Launch & Growth",
      description: "We launch with strong foundations for SEO, future content, and ongoing optimization."
    }
  ];

  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-3xl mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">A clear process from strategy to launch</h2>
          <p className="text-xl text-gray-600">
            Our process is built to reduce confusion, improve alignment, and create a site that performs after launch — not just on presentation day.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="text-6xl font-black text-blue-100 mb-4">{step.number}</div>
              <h3 className="text-2xl font-bold text-black mb-4">{step.title}</h3>
              <p className="text-gray-600 leading-relaxed">
                {step.description}
              </p>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 right-0 -translate-x-1/2 w-full h-[2px] bg-blue-50 -z-10"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
