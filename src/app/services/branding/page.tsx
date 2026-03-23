import Header from '../../_components/Header';
import Footer from '../../_components/Footer';
import ServicePageHero from '../../_components/ServicePageHero';
import FinalCta from '../../_components/homepage/FinalCta';
import { CheckCircle2 } from 'lucide-react';

export default function BrandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <ServicePageHero 
          eyebrow="Branding"
          h1="Branding that gives your business a clearer position and a stronger presence"
          subhead="We help businesses sharpen their positioning, strengthen their visual identity, and create a brand system that feels consistent everywhere customers meet it."
        />

        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="max-w-3xl mb-16">
              <h2 className="text-4xl font-bold text-black mb-6">Branding is more than just a logo</h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Branding improves consistency, builds credibility, and ultimately drives conversion. If your message is confusing, your design won't save you. We start with the strategy.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Brand Strategy",
                  description: "Defining your core value, target audience, and market position.",
                  points: ["Positioning", "Audience definition", "Core values", "Competitor audit"]
                },
                {
                  title: "Visual Identity",
                  description: "Creating a premium look and feel that reflects your quality.",
                  points: ["Logo design", "Color palette", "Typography", "Visual guidelines"]
                },
                {
                  title: "Brand Messaging",
                  description: "Clarifying exactly what you say and how you say it.",
                  points: ["Value proposition", "Tone of voice", "Tagline development", "Core copy pillars"]
                }
              ].map((item, index) => (
                <div key={index} className="p-10 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all">
                  <h3 className="text-2xl font-bold text-black mb-4">{item.title}</h3>
                  <p className="text-gray-600 mb-8">{item.description}</p>
                  <ul className="space-y-4">
                    {item.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-1" />
                        <span className="font-medium text-black">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
