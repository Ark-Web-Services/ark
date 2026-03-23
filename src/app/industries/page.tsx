import Header from '../_components/Header';
import Footer from '../_components/Footer';
import Link from 'next/link';
import { Gavel, Briefcase, Home, Stethoscope, Rocket, ArrowRight } from 'lucide-react';

export default function IndustriesPage() {
  const industries = [
    {
      title: "Law Firm Web Design",
      href: "/industries/law-firm-web-design",
      description: "Build authority and trust with a professional website for your practice.",
      icon: <Gavel className="w-8 h-8 text-blue-600" />
    },
    {
      title: "Consulting & Professional Services",
      href: "/industries/web-design-for-consultants",
      description: "Sharpen your positioning and lead generation as an expert consultant.",
      icon: <Briefcase className="w-8 h-8 text-blue-600" />
    },
    {
      title: "Home Services",
      href: "/industries/web-design-for-home-services",
      description: "Get more calls and local visibility for your service business.",
      icon: <Home className="w-8 h-8 text-blue-600" />
    },
    {
      title: "Healthcare & Clinics",
      href: "/industries/web-design-for-healthcare-brands",
      description: "Patient-first websites that establish credibility at first glance.",
      icon: <Stethoscope className="w-8 h-8 text-blue-600" />
    },
    {
      title: "B2B SaaS",
      href: "/industries/web-design-for-b2b-saas",
      description: "Clarify complex messaging and improve your demo request flow.",
      icon: <Rocket className="w-8 h-8 text-blue-600" />
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-8 leading-tight">
              Website and branding solutions tailored to the way your industry sells
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Different businesses need different trust signals, conversion paths, and messaging strategies. Explore how we tailor websites by industry.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-24">
            {industries.map((industry, index) => (
              <Link 
                key={index}
                href={industry.href}
                className="group p-10 rounded-3xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-2xl hover:border-blue-100 transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  {industry.icon}
                </div>
                <h3 className="text-2xl font-bold text-black mb-4 group-hover:text-blue-600 transition-colors">
                  {industry.title}
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                  {industry.description}
                </p>
                <div className="flex items-center gap-2 text-blue-600 font-bold">
                  Learn more
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </div>
              </Link>
            ))}
          </div>

          <div className="bg-black rounded-[2rem] p-12 md:p-20 text-center">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">Don't see your industry?</h2>
            <p className="text-xl text-gray-400 mb-10 max-w-3xl mx-auto">
              We work with any service business that needs a high-converting website and a sharper digital presence. Let's talk about your specific goals.
            </p>
            <Link
              href="/contact"
              className="inline-block px-10 py-5 bg-blue-600 text-white rounded-full text-xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20"
            >
              Talk About Your Project
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
