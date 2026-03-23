import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export default function CaseStudiesSnapshot() {
  const projects = [
    {
      client: "Service Firm X",
      description: "Repositioned the brand, restructured the site, and launched a clearer conversion path for their target audience.",
      results: ["45% increase in qualified inquiries", "Improved conversion rate", "Faster page speed"],
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=800"
    },
    {
      client: "Tech Consultant Y",
      description: "Clarified the value proposition and designed a high-authority website that filters in better-fit clients.",
      results: ["2x more demo requests", "100% SEO foundation score", "Consistent brand across all pages"],
      image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800"
    }
  ];

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">Selected work and outcomes</h2>
            <p className="text-xl text-gray-600">
              We focus on building websites that solve business problems and create measurable impact.
            </p>
          </div>
          <Link 
            href="/case-studies" 
            className="text-blue-600 font-bold flex items-center gap-2 hover:gap-4 transition-all"
          >
            View All Case Studies 
            <ArrowUpRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {projects.map((project, index) => (
            <div key={index} className="group cursor-pointer">
              <div className="aspect-[16/10] overflow-hidden rounded-3xl bg-gray-100 mb-8 relative">
                <Image 
                  src={project.image} 
                  alt={project.client}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
              </div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-2xl md:text-3xl font-bold text-black">{project.client}</h3>
                <div className="w-12 h-12 rounded-full border border-gray-200 flex items-center justify-center group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-all">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
              </div>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                {project.description}
              </p>
              <div className="flex flex-wrap gap-3">
                {project.results.map((result, i) => (
                  <span key={i} className="px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-semibold">
                    {result}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
