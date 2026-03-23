import Header from '../../_components/Header';
import Footer from '../../_components/Footer';
import ServicePageHero from '../../_components/ServicePageHero';
import FinalCta from '../../_components/homepage/FinalCta';
import { Heart, Shield, Search, User } from 'lucide-react';

export default function HealthcarePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <ServicePageHero 
          eyebrow="Healthcare Website Design"
          h1="Website design for healthcare brands that need trust at first glance"
          subhead="We design healthcare and clinic websites that feel credible, modern, and easy for patients to navigate."
        />

        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 relative overflow-hidden">
            <div className="max-w-3xl relative z-10">
              <h2 className="text-4xl font-bold text-black mb-12">Reassure. Simplify. Professionalize.</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                {[
                  { title: "Patient-First UX", desc: "Information on services and practitioners is always easy to find.", icon: <User className="w-6 h-6 text-blue-600" /> },
                  { title: "HIPAA-Aware Forms", desc: "Safe, secure, and professional inquiry pathways.", icon: <Shield className="w-6 h-6 text-blue-600" /> },
                  { title: "Credibility Building", desc: "Strategic use of imagery and trust signals to reassure patients.", icon: <Heart className="w-6 h-6 text-blue-600" /> },
                  { title: "Search Optimized", desc: "Helping patients find your clinic for the right treatments.", icon: <Search className="w-6 h-6 text-blue-600" /> }
                ].map((item, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="shrink-0 pt-1">{item.icon}</div>
                    <div>
                      <h4 className="text-xl font-bold text-black mb-2 leading-tight">{item.title}</h4>
                      <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {/* Background design */}
            <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-100/50 -skew-x-12 -z-0"></div>
          </div>
        </section>

        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
