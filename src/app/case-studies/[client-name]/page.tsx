import Header from '../../_components/Header';
import Footer from '../../_components/Footer';
import FinalCta from '../../_components/homepage/FinalCta';
import { ArrowLeft, CheckCircle2, TrendingUp, Target } from 'lucide-react';
import Link from 'next/link';

export default function CaseStudyPage({ params }: { params: { 'client-name': string } }) {
  const clientName = params['client-name'].split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <section className="pt-32 pb-20 md:pt-48 md:pb-32 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <Link href="/case-studies" className="flex items-center gap-2 text-blue-600 font-bold mb-12 hover:-translate-x-2 transition-transform">
              <ArrowLeft className="w-5 h-5" />
              Back to Case Studies
            </Link>
            
            <div className="max-w-4xl">
              <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-6">
                Case Study
              </span>
              <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-black mb-8 leading-[1.1]">
                {clientName}: Building a high-authority conversion machine
              </h1>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 border-y border-gray-100 py-10 my-12">
                <div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Service</p>
                    <p className="text-lg font-bold text-black">Web Design & SEO</p>
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Industry</p>
                    <p className="text-lg font-bold text-black">Professional Services</p>
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Duration</p>
                    <p className="text-lg font-bold text-black">8 Weeks</p>
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Outcome</p>
                    <p className="text-lg font-bold text-blue-600">+45% Inquiries</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
              <div className="lg:col-span-2 space-y-16">
                <div>
                    <h2 className="text-3xl font-bold text-black mb-6">The Challenge</h2>
                    <p className="text-xl text-gray-600 leading-relaxed">
                        The client had a website that looked professional but failed to communicate their unique value proposition. Visitors were confused by the messaging, and search visibility was non-existent for their core services.
                    </p>
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-black mb-6">The Strategy</h2>
                    <p className="text-xl text-gray-600 leading-relaxed mb-8">
                        We focused on three core pillars: messaging clarity, intent-led structure, and premium visual trust.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[
                            { title: "Messaging Pivot", desc: "Rewriting the homepage to focus on client outcomes.", icon: <Target className="w-6 h-6 text-blue-600" /> },
                            { title: "Sitemap Rebuild", desc: "Creating dedicated pages for each core service area.", icon: <TrendingUp className="w-6 h-6 text-blue-600" /> }
                        ].map((item, index) => (
                            <div key={index} className="p-8 bg-white rounded-2xl border border-gray-100 shadow-sm">
                                <div className="mb-4">{item.icon}</div>
                                <h4 className="font-bold text-black mb-2">{item.title}</h4>
                                <p className="text-gray-600">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
              </div>
              
              <div className="space-y-8">
                  <div className="p-10 bg-black text-white rounded-3xl shadow-xl">
                      <h3 className="text-2xl font-bold mb-6">Key Results</h3>
                      <div className="space-y-6">
                          {[
                              "45% increase in qualified leads",
                              "100% improvement in page load speed",
                              "Top 3 rankings for 5 core services",
                              "Zero bounce rate on service pages"
                          ].map((result, i) => (
                              <div key={i} className="flex gap-4 items-start">
                                  <CheckCircle2 className="w-6 h-6 text-blue-500 shrink-0" />
                                  <span className="text-gray-300 text-lg">{result}</span>
                              </div>
                          ))}
                      </div>
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
