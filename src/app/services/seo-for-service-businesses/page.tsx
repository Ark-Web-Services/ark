import Header from '../../_components/Header';
import Footer from '../../_components/Footer';
import ServicePageHero from '../../_components/ServicePageHero';
import FinalCta from '../../_components/homepage/FinalCta';
import { Search, MapPin, Layout, FileText } from 'lucide-react';

export default function SeoPage() {
  const pillars = [
    {
      title: "Foundational SEO",
      description: "Building the core site structure that tells search engines exactly what you offer.",
      icon: <Search className="w-8 h-8 text-blue-600" />
    },
    {
      title: "Service-Specific Targeting",
      description: "Dedicated intent pages for every core service you provide.",
      icon: <Layout className="w-8 h-8 text-blue-600" />
    },
    {
      title: "Local & National Search",
      description: "Reaching the right buyers in your backyard or across the country.",
      icon: <MapPin className="w-8 h-8 text-blue-600" />
    },
    {
      title: "Content & Insights Hub",
      description: "A framework for demonstrating authority and capturing informational search demand.",
      icon: <FileText className="w-8 h-8 text-blue-600" />
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <ServicePageHero 
          eyebrow="SEO Foundations"
          h1="SEO foundations that help your website earn inbound traffic over time"
          subhead="We help service businesses create the page structure, targeting strategy, and content roadmap needed to turn a website into a long-term inbound channel."
        />

        <section className="py-24 bg-gray-50 overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl font-bold text-black mb-8 leading-tight">
                  A beautiful website is useless if no one can find it.
                </h2>
                <p className="text-xl text-gray-600 leading-relaxed mb-10">
                  Most agency websites are built on templates that ignore search intent. We do the opposite: we build the architecture search engines want to see.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {pillars.map((pillar, index) => (
                    <div key={index} className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <div className="mb-4">{pillar.icon}</div>
                      <h4 className="text-lg font-bold text-black mb-2">{pillar.title}</h4>
                      <p className="text-gray-600 text-sm leading-relaxed">{pillar.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="relative">
                <div className="aspect-[4/5] bg-black rounded-3xl p-12 text-white flex flex-col justify-center shadow-2xl">
                  <h3 className="text-3xl font-bold mb-8">What SEO Foundations include:</h3>
                  <ul className="space-y-6">
                    {[
                      "Keyword research and mapping",
                      "Intent-led sitemap architecture",
                      "Optimized meta tags and schema markup",
                      "Page speed and performance optimization",
                      "Internal linking strategy",
                      "Industry-specific content roadmap"
                    ].map((item, index) => (
                      <li key={index} className="flex items-center gap-4 border-b border-white/10 pb-4">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        <span className="text-xl text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {/* Decorative element */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-600/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
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
