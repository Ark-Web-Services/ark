import Header from '../../_components/Header';
import Footer from '../../_components/Footer';
import ServicePageHero from '../../_components/ServicePageHero';
import FinalCta from '../../_components/homepage/FinalCta';
import { Rocket, Target, Zap, MousePointer2 } from 'lucide-react';

export default function B2BSaasPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <ServicePageHero 
          eyebrow="B2B SaaS Website Design"
          h1="Website design for B2B SaaS teams that need clearer positioning and better conversion paths"
          subhead="We help SaaS companies clarify their message, sharpen their homepage structure, and design stronger paths to demo requests or signups."
        />

        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-black mb-6">Simplify the complex</h2>
              <p className="text-xl text-gray-600 leading-relaxed">
                B2B SaaS websites often fail by overcomplicating the technical details. We help you focus on the outcome and the value for the buyer.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { 
                  title: "Positioning Rebuild", 
                  desc: "Aligning your website copy with the actual problem you solve for customers.", 
                  icon: <Target className="w-8 h-8 text-blue-600" /> 
                },
                { 
                  title: "Conversion Flow UX", 
                  desc: "Optimizing the path from 'I'm interested' to 'I'm a lead'.", 
                  icon: <MousePointer2 className="w-8 h-8 text-blue-600" /> 
                },
                { 
                  title: "Performance & SEO", 
                  desc: "Highly optimized architectures built for speed and long-term search gains.", 
                  icon: <Zap className="w-8 h-8 text-blue-600" /> 
                },
                { 
                  title: "Growth Foundations", 
                  desc: "Scalable structures that allow you to ship landing pages fast.", 
                  icon: <Rocket className="w-8 h-8 text-blue-600" /> 
                }
              ].map((item, index) => (
                <div key={index} className="p-10 bg-white rounded-3xl border border-gray-100 shadow-sm flex gap-8 items-start hover:border-blue-200 transition-colors">
                  <div className="shrink-0">{item.icon}</div>
                  <div>
                    <h3 className="text-2xl font-bold text-black mb-3 leading-tight">{item.title}</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">{item.desc}</p>
                  </div>
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
