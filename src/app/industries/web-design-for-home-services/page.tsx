import Header from '../../_components/Header';
import Footer from '../../_components/Footer';
import ServicePageHero from '../../_components/ServicePageHero';
import FinalCta from '../../_components/homepage/FinalCta';
import { Phone, MapPin, Star, Clock } from 'lucide-react';

export default function HomeServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <ServicePageHero 
          eyebrow="Web Design for Home Services"
          h1="Web design for home service businesses that need more calls and better local visibility"
          subhead="For home service businesses, a strong website needs to build trust fast, make contacting you effortless, and support local search visibility."
        />

        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { title: "Click-to-Call Focus", desc: "Making it as easy as possible for prospects to contact you immediately.", icon: <Phone className="w-8 h-8 text-blue-600" /> },
                { title: "Local SEO Structure", desc: "Optimizing your site to rank for service keywords in your specific area.", icon: <MapPin className="w-8 h-8 text-blue-600" /> },
                { title: "Trust & Reviews", desc: "Highlighting social proof and certifications that build instant credibility.", icon: <Star className="w-8 h-8 text-blue-600" /> },
                { title: "Response Speed", desc: "High-performance layouts that load fast even on cellular data in the field.", icon: <Clock className="w-8 h-8 text-blue-600" /> }
              ].map((item, index) => (
                <div key={index} className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
                  <div className="mb-6">{item.icon}</div>
                  <h3 className="text-xl font-bold text-black mb-4">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-black mb-8 leading-tight">Stop losing leads to outdated competitors</h2>
            <p className="text-xl text-gray-600 mb-12">
              If your website isn't making it easy for customers to find your number and trust your work, you're leaving money on the table. We build the system that brings in more calls.
            </p>
            <div className="bg-blue-600 rounded-[2rem] p-8 md:p-12 text-white">
              <h3 className="text-2xl font-bold mb-4 italic">"They completely rebuilt our local ranking."</h3>
              <p className="text-lg text-blue-100 mb-0">
                — Home Service Provider
              </p>
            </div>
          </div>
        </section>

        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
