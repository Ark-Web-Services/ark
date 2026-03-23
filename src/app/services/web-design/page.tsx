import Header from '../../_components/Header';
import Footer from '../../_components/Footer';
import ServicePageHero from '../../_components/ServicePageHero';
import FinalCta from '../../_components/homepage/FinalCta';
import { CheckCircle2 } from 'lucide-react';

export default function WebDesignPage() {
  const sections = [
    {
      title: "What’s wrong with most websites",
      description: "Most agencies focus on making things look pretty. But a beautiful site that doesn't clarify your message is a missed opportunity.",
      points: [
          "Vague messaging that confuses visitors",
          "Passive design that doesn't guide action",
          "Unclear structure that search engines can't follow",
          "Lack of trust signals that would make a prospect pick up the phone"
      ]
    },
    {
      title: "What our web design solves",
      description: "We don't just 'make a website.' We build a strategic growth tool that connects your business with your audience.",
      points: [
          "Strategic positioning based on your business goals",
          "Conversion-led page flow and visual hierarchy",
          "On-page SEO fundamentals from day one",
          "Premium aesthetics that reflect your professional quality"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <ServicePageHero 
          eyebrow="Web Design"
          h1="Web design that makes your business easier to trust — and easier to choose"
          subhead="We design websites that clarify your offer, guide users toward action, and give your business a more credible online presence."
        />

        {/* Core Content Sections */}
        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
              {sections.map((section, index) => (
                <div key={index} className="p-10 bg-white rounded-3xl border border-gray-100 shadow-sm">
                  <h2 className="text-3xl font-bold text-black mb-6">{section.title}</h2>
                  <p className="text-lg text-gray-600 mb-8 leading-relaxed italic border-l-4 border-blue-600 pl-6">
                    {section.description}
                  </p>
                  <ul className="space-y-4">
                    {section.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
                        <span className="text-lg text-gray-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Deliverables Section */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-black mb-12 text-center">What's included in a web design project</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                "Strategic Sitemap",
                "High-Fidelity UI Design",
                "Mobile Responsive Layouts",
                "Conversion Flow Strategy",
                "Core Messaging & Copy Support",
                "On-Page SEO foundations",
                "Custom Animation & Interactions",
                "Foundational Content Architecture"
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-6 rounded-2xl bg-gray-50 border border-gray-100">
                  <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></div>
                  <span className="font-semibold text-black">{item}</span>
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
