import Header from '../../_components/Header';
import Footer from '../../_components/Footer';
import ServicePageHero from '../../_components/ServicePageHero';
import FinalCta from '../../_components/homepage/FinalCta';
import { CheckCircle2, UserCheck, BarChart3, MessageSquare } from 'lucide-react';

export default function ConsultantPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <ServicePageHero 
          eyebrow="Web Design for Consultants"
          h1="Websites for consultants who need sharper positioning and stronger lead generation"
          subhead="We help consultants present their expertise more clearly, communicate their value faster, and convert more of the right visitors into inquiries."
        />

        <section className="py-24 bg-gray-50">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-16 items-center">
              <div className="lg:w-1/2">
                <h2 className="text-3xl md:text-5xl font-bold text-black mb-8 leading-tight">Your website is your silent <span className="text-blue-600">business developer.</span></h2>
                <p className="text-xl text-gray-600 leading-relaxed mb-8">
                  For consultants, the website often makes or breaks the trust needed to secure a high-ticket engagement.
                </p>
                <div className="space-y-6">
                  {[
                    { title: "Positioning-Led Design", desc: "Clearly stating what you do and who you do it for." },
                    { title: "Authority Demonstration", desc: "Creating space for case studies, insights, and proofs." },
                    { title: "Inbound Flow", desc: "Guiding users from curiosity to a discovery call." }
                  ].map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                        <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-black text-xl">{item.title}</h4>
                        <p className="text-gray-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:w-1/2 grid grid-cols-1 gap-6">
                  <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
                    <UserCheck className="w-12 h-12 text-blue-600" />
                    <div>
                      <h4 className="text-xl font-bold text-black">Build Authority</h4>
                      <p className="text-gray-600">Showcase your expertise with clear messaging.</p>
                    </div>
                  </div>
                  <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
                    <BarChart3 className="w-12 h-12 text-blue-600" />
                    <div>
                      <h4 className="text-xl font-bold text-black">Generate Inquiries</h4>
                      <p className="text-gray-600">Turn readers into discovery call bookings.</p>
                    </div>
                  </div>
                  <div className="p-8 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-center gap-6">
                    <MessageSquare className="w-12 h-12 text-blue-600" />
                    <div>
                      <h4 className="text-xl font-bold text-black">Clarify Value</h4>
                      <p className="text-gray-600">Explain exactly what makes your approach better.</p>
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
