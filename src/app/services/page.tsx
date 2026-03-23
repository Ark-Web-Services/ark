import Header from '../_components/Header';
import Footer from '../_components/Footer';
import Link from 'next/link';
import { Layout, Palette, Search, Code, RefreshCw, Zap } from 'lucide-react';

export default function ServicesPage() {
  const services = [
    {
      title: "Web Design",
      href: "/services/web-design",
      description: "Strategic, high-converting websites that clarify your offer and build trust.",
      icon: <Layout className="w-8 h-8 text-blue-600" />
    },
    {
      title: "Branding",
      href: "/services/branding",
      description: "Sharper positioning, visual identity, and messaging that feels consistent.",
      icon: <Palette className="w-8 h-8 text-blue-600" />
    },
    {
      title: "SEO Foundations",
      href: "/services/seo-for-service-businesses",
      description: "Site structure and targeting that help you earn inbound traffic over time.",
      icon: <Search className="w-8 h-8 text-blue-600" />
    },
    {
      title: "Website Redesign",
      href: "/services/website-redesign",
      description: "Transform an underperforming site into a high-converting growth asset.",
      icon: <RefreshCw className="w-8 h-8 text-blue-600" />
    },
    {
      title: "Webflow Development",
      href: "/services/webflow-development",
      description: "Fast, flexible, and marketing-ready websites built on Webflow.",
      icon: <Zap className="w-8 h-8 text-blue-600" />
    },
    {
      title: "Custom Development",
      href: "/services/custom-website-development",
      description: "Advanced functionality and technical flexibility for complex projects.",
      icon: <Code className="w-8 h-8 text-blue-600" />
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-8 leading-tight">
              Website, branding, and SEO services built for growth
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Find the right path based on what your business needs now: a stronger website, clearer brand positioning, better SEO foundations, or a full rebuild.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
            {services.map((service, index) => (
              <Link 
                key={index}
                href={service.href}
                className="group p-10 rounded-3xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-2xl hover:border-blue-100 transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  {service.icon}
                </div>
                <h3 className="text-2xl font-bold text-black mb-4 group-hover:text-blue-600 transition-colors">
                  {service.title}
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                  {service.description}
                </p>
                <div className="flex items-center gap-2 text-blue-600 font-bold">
                  Learn more
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 group-hover:translate-x-2 transition-transform">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>

          <div className="bg-gray-50 rounded-[2rem] p-12 md:p-20 border border-gray-100">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">Not sure which service you need?</h2>
              <p className="text-xl text-gray-600 mb-10">
                Most projects are a combination of several services. Book a discovery call and we'll help you define the best scope for your goals.
              </p>
              <Link
                href="/contact"
                className="inline-block px-10 py-5 bg-blue-600 text-white rounded-full text-xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
              >
                Book a Discovery Call
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
