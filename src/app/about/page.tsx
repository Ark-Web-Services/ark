import Header from '../_components/Header';
import Footer from '../_components/Footer';
import FinalCta from '../_components/homepage/FinalCta';
import { Target, Zap, Search } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <section className="pt-32 pb-20 md:pt-48 md:pb-32 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="max-w-4xl">
              <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-6">
                About Us
              </span>
              <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-black mb-8 leading-[1.1]">
                We build websites that help strong businesses present themselves <span className="text-blue-600 italic">more clearly.</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed max-w-3xl">
                ARK Web Services exists to help businesses close the gap between the quality of what they do and the way they show up online.
              </p>
            </div>
          </div>
        </section>

        <section className="py-24 bg-gray-50 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl font-bold text-black mb-8 leading-tight">Our philosophy is built on <span className="text-blue-600 italic">business utility.</span></h2>
                <div className="space-y-8">
                  {[
                    { title: "Clarity Over Complexity", desc: "No jargon. No abstraction. We prioritize making your offer easy to understand in the first 10 seconds.", icon: <Target className="w-8 h-8 text-blue-600" /> },
                    { title: "Strategy-Led Design", desc: "We don't start with aesthetics. We start with your business goals, your audience, and your market position.", icon: <Zap className="w-8 h-8 text-blue-600" /> },
                    { title: "Inbound First", desc: "A website is a marketing asset. Every page we build is designed to attract, inform, and convert search intent.", icon: <Search className="w-8 h-8 text-blue-600" /> }
                  ].map((item, index) => (
                    <div key={index} className="flex gap-6 items-start">
                      <div className="shrink-0">{item.icon}</div>
                      <div>
                        <h4 className="text-2xl font-bold text-black mb-3">{item.title}</h4>
                        <p className="text-lg text-gray-600 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="aspect-square bg-white rounded-3xl shadow-xl border border-gray-100 p-12 flex flex-col justify-center text-center">
                  <h3 className="text-3xl font-bold text-black mb-6 italic">"A beautiful website that doesn't improve trust or conversion is a missed opportunity."</h3>
                  <p className="text-xl text-blue-600 font-bold">— The ARK Mission</p>
                </div>
                {/* Decoration */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-100 rounded-full blur-3xl -z-10 animate-pulse"></div>
              </div>
            </div>
          </div>
        </section>

        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
