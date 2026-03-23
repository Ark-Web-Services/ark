import Header from '../../_components/Header';
import Footer from '../../_components/Footer';
import ServicePageHero from '../../_components/ServicePageHero';
import FinalCta from '../../_components/homepage/FinalCta';
import { Code, Settings, Server, Shield } from 'lucide-react';

export default function CustomDevPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <ServicePageHero 
          eyebrow="Custom Development"
          h1="Custom website development for projects that need more than a standard build"
          subhead="For businesses with more complex requirements, we build custom websites that support performance, flexibility, and future growth."
        />

        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-black mb-16 text-center">When custom development makes sense</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  title: "Specific UX Requirements",
                  description: "When your product or service needs a unique way of being presented or interacted with.",
                  icon: <Settings className="w-8 h-8 text-blue-600" />
                },
                {
                  title: "Advanced Functionality",
                  description: "Custom calculators, complex forms, member portals, or dynamic data visualization.",
                  icon: <Code className="w-8 h-8 text-blue-600" />
                },
                {
                  title: "Integration Needs",
                  description: "Connecting your website seamlessly with third-party APIs or internal business tools.",
                  icon: <Server className="w-8 h-8 text-blue-600" />
                },
                {
                  title: "Performance & Security",
                  description: "Highly optimized architectures for reliability, speed, and critical security needs.",
                  icon: <Shield className="w-8 h-8 text-blue-600" />
                }
              ].map((item, index) => (
                <div key={index} className="p-10 bg-white rounded-3xl border border-gray-100 shadow-sm flex gap-8 items-start">
                  <div className="shrink-0">{item.icon}</div>
                  <div>
                    <h3 className="text-2xl font-bold text-black mb-3 leading-tight">{item.title}</h3>
                    <p className="text-gray-600 text-lg leading-relaxed">{item.description}</p>
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
