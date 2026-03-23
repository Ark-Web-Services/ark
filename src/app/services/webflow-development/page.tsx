import Header from '../../_components/Header';
import Footer from '../../_components/Footer';
import ServicePageHero from '../../_components/ServicePageHero';
import FinalCta from '../../_components/homepage/FinalCta';
import { Zap, CheckCircle2, Layout, Sliders, LineChart } from 'lucide-react';

export default function WebflowPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <ServicePageHero 
          eyebrow="Webflow Development"
          h1="Webflow development for fast, flexible, marketing-ready websites"
          subhead="We build Webflow sites that are clean, scalable, and easy to manage — without sacrificing design quality or search performance."
        />

        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="max-w-3xl mb-16">
              <h2 className="text-4xl font-bold text-black mb-6">Why teams choose Webflow</h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                Modern service businesses need to move fast. Webflow gives you the power of code without the slow development cycles of traditional builds.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  title: "High Performance",
                  description: "Lightning-fast load times that benefit both users and SEO.",
                  icon: <Zap className="w-6 h-6 text-blue-600" />
                },
                {
                  title: "Visual Freedom",
                  description: "Custom designs built exactly as intended, not forced into templates.",
                  icon: <Layout className="w-6 h-6 text-blue-600" />
                },
                {
                  title: "Easy Management",
                  description: "A simple CMS that makes updating content easy for anyone.",
                  icon: <Sliders className="w-6 h-6 text-blue-600" />
                },
                {
                  title: "SEO Friendly",
                  description: "Native tools that make indexation and optimization simple.",
                  icon: <LineChart className="w-6 h-6 text-blue-600" />
                }
              ].map((item, index) => (
                <div key={index} className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <div className="mb-6">{item.icon}</div>
                  <h3 className="text-xl font-bold text-black mb-4">{item.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-black mb-12">Who Webflow is best for</h2>
            <div className="flex flex-wrap justify-center gap-6">
              {[
                "Service businesses ready for a faster website",
                "Marketing teams wanting more control over content",
                "Companies tired of WordPress plug-in bloat",
                "Fires going through a rebrand or pivot",
                "SaaS startups needing a high-performance landing page"
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 px-8 py-4 rounded-full bg-blue-50 border border-blue-100">
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-black">{item}</span>
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
