import Link from 'next/link';

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-6 animate-fade-in">
            Web Design, Branding & SEO for Service Businesses
          </span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-black mb-8 leading-[1.1]">
            Websites built to bring in <span className="text-blue-600">better leads</span> — not just look impressive.
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed max-w-3xl">
            We help service businesses turn their websites into growth assets with clear messaging, strategic design, and SEO foundations that support inbound traffic over time.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/contact"
              className="px-8 py-4 bg-blue-600 text-white rounded-full text-lg font-bold hover:bg-blue-700 transition-all text-center shadow-lg shadow-blue-200"
            >
              Book a Discovery Call
            </Link>
            <Link
              href="/services"
              className="px-8 py-4 bg-white text-black border-2 border-gray-100 rounded-full text-lg font-bold hover:border-blue-600 hover:text-blue-600 transition-all text-center"
            >
              Explore Services
            </Link>
          </div>
        </div>
      </div>
      
      {/* Subtle Background Element */}
      <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[600px] h-[600px] bg-blue-50 rounded-full blur-3xl opacity-50 -z-0"></div>
    </section>
  );
}
