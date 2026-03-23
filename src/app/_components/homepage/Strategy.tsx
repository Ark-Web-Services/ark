export default function Strategy() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-8 leading-tight">
              Strategy first. Design second. <span className="text-blue-600">Performance always.</span>
            </h2>
            <p className="text-xl text-gray-700 mb-8 leading-relaxed">
              A beautiful website that doesn’t improve trust, clarity, or conversion is a missed opportunity.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              Our process starts with the business: who you serve, what makes you different, what your buyers need to believe, and how your website should guide them toward action.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              That means your site isn’t just “nicer.” It’s easier to understand, easier to navigate, and better positioned to support growth.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="p-8 bg-blue-50 rounded-2xl border border-blue-100">
              <h4 className="text-xl font-bold text-black mb-2">Clarity over Complexity</h4>
              <p className="text-gray-600">We prioritize making your offer easy to understand in the first 10 seconds.</p>
            </div>
            <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100">
              <h4 className="text-xl font-bold text-black mb-2">Structure for Scale</h4>
              <p className="text-gray-600">Your site is built with SEO foundations that help you rank for key terms.</p>
            </div>
            <div className="p-8 bg-gray-50 rounded-2xl border border-gray-100">
              <h4 className="text-xl font-bold text-black mb-2">Conversion Driven</h4>
              <p className="text-gray-600">Every design decision is made to guide the user toward booking a call.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
