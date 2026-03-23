import Header from '../../_components/Header';
import Footer from '../../_components/Footer';
import ServicePageHero from '../../_components/ServicePageHero';
import FinalCta from '../../_components/homepage/FinalCta';
import { ShieldCheck, Scale, Users } from 'lucide-react';

export default function LawFirmPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <ServicePageHero 
          eyebrow="Law Firm Web Design"
          h1="Web design for law firms that need more trust, clarity, and qualified inquiries"
          subhead="We design law firm websites that make your practice areas clearer, strengthen trust, and guide more qualified prospects toward contact."
        />

        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                {
                  title: "Authority & Expertise",
                  desc: "We focus on elements that establish your firm's credibility from the first click.",
                  icon: <ShieldCheck className="w-10 h-10 text-blue-600" />
                },
                {
                  title: "Practice Area Strategy",
                  desc: "Dedicated internal structures that make your specialties easy to find for both users and SEO.",
                  icon: <Scale className="w-10 h-10 text-blue-600" />
                },
                {
                  title: "Lead Qualification",
                  desc: "Strategic conversion paths that guide prospects toward booking a consultation.",
                  icon: <Users className="w-10 h-10 text-blue-600" />
                }
              ].map((item, index) => (
                <div key={index} className="p-10 bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <div className="mb-6">{item.icon}</div>
                  <h3 className="text-2xl font-bold text-black mb-4">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-12 text-center">What law firm websites often get wrong</h2>
              <div className="space-y-6">
                {[
                  "Cold, clinical design that doesn't feel human or approachable",
                  "Vague practice area descriptions that don't answer client questions",
                  "No clear 'next step' for prospects ready to talk",
                  "Weak SEO structure that prevents the firm from appearing in local search"
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-4 p-8 rounded-2xl bg-red-50/50 border border-red-100">
                    <div className="w-2 h-2 rounded-full bg-red-500 shrink-0"></div>
                    <span className="text-lg font-bold text-gray-800">{item}</span>
                  </div>
                ))}
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
