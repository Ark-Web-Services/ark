import Header from '../_components/Header';
import Footer from '../_components/Footer';
import FinalCta from '../_components/homepage/FinalCta';
import { Search, Layout, FileText, CheckCircle2 } from 'lucide-react';

export default function ProcessPage() {
  const steps = [
    {
      title: "Discovery",
      desc: "We define goals, audiences, current gaps, and what the website actually needs to accomplish. This is the foundation of the entire strategy.",
      icon: <Search className="w-8 h-8 text-blue-600" />
    },
    {
      title: "Messaging & Structure",
      desc: "We shape the positioning, sitemap, page hierarchy, and conversion flow. We ensure every page has a clear purpose and a target keyword.",
      icon: <FileText className="w-8 h-8 text-blue-600" />
    },
    {
      title: "Design & Build",
      desc: "We create the site with a focus on trust, usability, speed, and polish. Our designs are custom-built to reflect your professional quality.",
      icon: <Layout className="w-8 h-8 text-blue-600" />
    },
    {
      title: "Launch & Growth",
      desc: "We launch with strong foundations for SEO, future content, and ongoing optimization. We ensure your team knows how to use the site as a tool.",
      icon: <CheckCircle2 className="w-8 h-8 text-blue-600" />
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <section className="pt-32 pb-20 md:pt-48 md:pb-32 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="max-w-4xl">
              <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-6">
                Our Process
              </span>
              <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-black mb-8 leading-[1.1]">
                A clear process from strategy to <span className="text-blue-600 italic">growth.</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed max-w-3xl">
                Our process is built to reduce confusion, improve alignment, and create a site that performs after launch — not just on presentation day.
              </p>
            </div>
          </div>
        </section>

        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="space-y-12">
              {steps.map((step, index) => (
                <div key={index} className="flex flex-col lg:flex-row gap-12 p-10 bg-white rounded-3xl border border-gray-100 shadow-sm items-center hover:shadow-xl transition-all">
                  <div className="lg:w-1/4 flex flex-col items-center justify-center">
                    <div className="text-6xl font-black text-gray-100 mb-4">{`0${index + 1}`}</div>
                    <div className="p-6 bg-blue-50 rounded-2xl">
                      {step.icon}
                    </div>
                  </div>
                  <div className="lg:w-3/4">
                    <h3 className="text-3xl font-bold text-black mb-4">{step.title}</h3>
                    <p className="text-xl text-gray-600 leading-relaxed">
                      {step.desc}
                    </p>
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
