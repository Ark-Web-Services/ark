import Link from 'next/link';
import { Palette, Search, Layout, Code } from 'lucide-react';

export default function ServicesSnapshot() {
  const services = [
    {
      title: "Web Design",
      description: "Strategic, high-converting websites that make your offer easier to understand and easier to trust.",
      icon: <Layout className="w-6 h-6 text-blue-600" />,
      link: "/services/web-design"
    },
    {
      title: "Branding",
      description: "Clearer positioning, stronger visual identity, and messaging that feels consistent across every page.",
      icon: <Palette className="w-6 h-6 text-blue-600" />,
      link: "/services/branding"
    },
    {
      title: "SEO Foundations",
      description: "Site structure, page targeting, and content planning that help your website earn inbound traffic over time.",
      icon: <Search className="w-6 h-6 text-blue-600" />,
      link: "/services/seo-for-service-businesses"
    },
    {
      title: "Webflow & Custom Development",
      description: "Flexible builds for businesses that need more than a template without sacrificing speed or usability.",
      icon: <Code className="w-6 h-6 text-blue-600" />,
      link: "/services/webflow-development"
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">What we help with</h2>
            <p className="text-xl text-gray-600">
              We combine strategy, design, and technology to help service businesses build a stronger online presence.
            </p>
          </div>
          <Link 
            href="/services" 
            className="text-blue-600 font-bold flex items-center gap-2 hover:gap-4 transition-all"
          >
            View All Services 
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <Link 
              key={index} 
              href={service.link}
              className="group p-8 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-xl hover:border-blue-100 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {service.icon}
              </div>
              <h3 className="text-xl font-bold text-black mb-4 group-hover:text-blue-600 transition-colors">
                {service.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {service.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
