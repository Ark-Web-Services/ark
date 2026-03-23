export default function Problem() {
  return (
    <section className="py-20 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-8 leading-tight">
              If your website looks fine but isn’t pulling its weight, it’s costing you leads.
            </h2>
            <p className="text-lg md:text-xl text-gray-700 leading-relaxed max-w-2xl">
              Most service business websites fail for the same reasons: the message is too vague, the structure is unclear, the design doesn’t guide action, and the content isn’t built to support search visibility.
            </p>
            <p className="text-lg md:text-xl text-gray-700 mt-6 leading-relaxed font-semibold">
              We fix that by combining strategy, messaging, design, and SEO into one focused system.
            </p>
          </div>
          <div className="relative">
            <div className="aspect-square bg-white rounded-2xl shadow-xl overflow-hidden p-8 border border-gray-100 flex flex-col justify-center">
              <div className="space-y-6">
                {[
                  { title: "Vague Messaging", description: "Visitors don't understand what you do in the first 10 seconds." },
                  { title: "Unclear Structure", description: "Search engines and users can't find what they need." },
                  { title: "Passive Design", description: "The site doesn't guide users toward a clear action." },
                  { title: "Weak SEO", description: "You aren't ranking for keywords that actually matter." },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center shrink-0 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-bold text-black">{item.title}</h4>
                      <p className="text-gray-600 text-sm">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Decorative background element */}
            <div className="absolute -bottom-6 -right-6 w-full h-full bg-blue-100 rounded-2xl -z-10 translate-x-3 translate-y-3"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
