import Header from '../../_components/Header';
import Footer from '../../_components/Footer';
import ServicePageHero from '../../_components/ServicePageHero';
import FinalCta from '../../_components/homepage/FinalCta';
import { AlertCircle } from 'lucide-react';

export default function RedesignPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <ServicePageHero 
          eyebrow="Website Redesign"
          h1="Redesign your website so it actually supports growth"
          subhead="If your website feels outdated, unclear, or underperforming, a redesign can improve trust, conversion, and long-term marketing results."
        />

        <section className="py-24 bg-red-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 className="text-3xl md:text-5xl font-bold text-black mb-12 text-center">Signs you need a redesign</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                "You’re embarrassed to send people to your URL",
                "Your business has evolved but the site hasn't",
                "Visitors can’t understand what you do at first glance",
                "The site is slow or broken on mobile",
                "You aren’t getting enough qualified inquiries",
                "Your competitors’ sites look more professional"
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-4 p-8 bg-white rounded-3xl border border-red-100 shadow-sm">
                  <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-1" />
                  <span className="text-lg font-bold text-black">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl font-bold text-black mb-8 leading-tight">
                  What a strategic redesign should <span className="text-blue-600">actually</span> improve
                </h2>
                <div className="space-y-6">
                  {[
                    { title: "Conversion Depth", desc: "Guiding users toward action with clearer paths." },
                    { title: "Trust and Authority", desc: "Presenting your expertise more professionaly." },
                    { title: "Search Engine Readiness", desc: "Restructuring the site to help it rank." },
                    { title: "Team Speed", desc: "Making it easier for you to update and grow." }
                  ].map((item, index) => (
                    <div key={index}>
                      <h4 className="text-xl font-bold text-black mb-1 leading-tight">{item.title}</h4>
                      <p className="text-gray-600 leading-relaxed">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="aspect-video bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex items-center justify-center p-12 text-center">
                <p className="text-2xl font-bold text-gray-400 italic">
                  Before: Confusing & Static
                  <br />
                  <span className="text-blue-500 not-italic">After: Clear & Growth-Led</span>
                </p>
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
