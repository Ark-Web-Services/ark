import Link from 'next/link';

export default function FinalCta() {
  return (
    <section className="py-24 bg-white overflow-hidden relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
        <div className="bg-black rounded-[2rem] p-12 md:p-20 text-center relative overflow-hidden">
          {/* Decorative background pattern */}
          <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
            <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-blue-600 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-900 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2"></div>
          </div>

          <div className="max-w-3xl mx-auto relative z-10">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 leading-tight">
              If your website needs to work harder, let’s fix the foundation.
            </h2>
            <p className="text-xl text-gray-400 mb-12 leading-relaxed">
              Whether you need a redesign, clearer messaging, stronger branding, or a better SEO structure, we can help you turn your website into a stronger source of trust and inbound opportunity.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/contact"
                className="px-10 py-5 bg-blue-600 text-white rounded-full text-xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
              >
                Book a Discovery Call
              </Link>
              <Link
                href="/contact"
                className="px-10 py-5 bg-transparent text-white border-2 border-white/20 rounded-full text-xl font-bold hover:bg-white hover:text-black transition-all"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
