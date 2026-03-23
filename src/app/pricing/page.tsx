import Header from '../_components/Header';
import Footer from '../_components/Footer';
import FinalCta from '../_components/homepage/FinalCta';
import { Info, CheckCircle2 } from 'lucide-react';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <section className="pt-32 pb-20 md:pt-48 md:pb-32 bg-white text-center">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-6">
                Pricing & Fit
              </span>
              <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-black mb-8 leading-[1.1]">
                Pricing that reflects <span className="text-blue-600 italic">business value.</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed max-w-3xl mx-auto">
                Every project is shaped by goals, scope, and complexity, but this page gives you a sense of what affects investment and what engagements are the best fit.
              </p>
            </div>
          </div>
        </section>

        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="p-12 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <h2 className="text-3xl font-bold text-black mb-8">What affects the cost?</h2>
                <div className="space-y-6 text-lg text-gray-600">
                  <p>Website costs aren't about 'number of pages.' They are about the strategy, complexity, and performance required.</p>
                  <ul className="space-y-4">
                    {[
                      "Messaging and positioning depth",
                      "The technical complexity of the build",
                      "The level of SEO keyword research and mapping",
                      "Custom animation and interaction requirements",
                      "Integrating with third-party business tools",
                      "Foundational content architecture for growth"
                    ].map((item, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0"></div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="p-12 bg-black text-white rounded-3xl shadow-xl flex flex-col justify-center">
                <div className="mb-8">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center mb-6">
                    <Info className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold mb-4">Are we a good fit?</h3>
                  <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                    We work best with service businesses that are ready to invest in their website as a core growth asset. 
                  </p>
                </div>
                <div className="space-y-4">
                  {[
                    "Budget alignment for premium results",
                    "A willingness to prioritize strategy first",
                    "A business that solves real problems for clients",
                    "Long-term thinking regarding growth and SEO"
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-4 border-b border-white/10 pb-4">
                      <CheckCircle2 className="w-5 h-5 text-blue-500" />
                      <span className="text-lg text-gray-300">{item}</span>
                    </div>
                  ))}
                </div>
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
