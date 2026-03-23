import Header from '../_components/Header';
import Footer from '../_components/Footer';
import CaseStudiesSnapshot from '../_components/homepage/CaseStudiesSnapshot';
import FinalCta from '../_components/homepage/FinalCta';

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <section className="pt-32 pb-20 md:pt-48 md:pb-32 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="max-w-4xl">
              <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-6">
                Our Work
              </span>
              <h1 className="text-4xl md:text-7xl font-bold tracking-tight text-black mb-8 leading-[1.1]">
                Selected work and <span className="text-blue-600 italic">results.</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed max-w-3xl">
                See how strategy, messaging, design, and structure come together in real client projects. We focus on building websites that solve business problems and create measurable impact.
              </p>
            </div>
          </div>
        </section>

        {/* Reuse the snapshot component for now as it has the layout we want */}
        <CaseStudiesSnapshot />

        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
