import { CheckCircle2 } from 'lucide-react';

export default function WhoItsFor() {
  const targets = [
    "Service businesses ready to generate more qualified leads",
    "Firms going through a rebrand or repositioning",
    "Teams rebuilding a site that no longer reflects the quality of their work",
    "Businesses that want a better foundation for SEO and marketing"
  ];

  return (
    <section className="py-24 bg-gray-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-video bg-blue-600 rounded-2xl flex items-center justify-center p-6 text-white text-center">
                <p className="text-xl font-bold">More Leads</p>
              </div>
              <div className="aspect-video bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-center p-6 text-black text-center mt-8">
                <p className="text-xl font-bold italic text-blue-600">Sharper Brand</p>
              </div>
              <div className="aspect-video bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center justify-center p-6 text-black text-center -mt-8">
                <p className="text-xl font-bold">SEO Growth</p>
              </div>
              <div className="aspect-video bg-black rounded-2xl flex items-center justify-center p-6 text-white text-center">
                <p className="text-xl font-bold">Better Returns</p>
              </div>
            </div>
            {/* Background elements */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-50 rounded-full blur-3xl -z-10 animate-pulse"></div>
          </div>
          
          <div className="order-1 lg:order-2">
            <h2 className="text-4xl md:text-5xl font-bold text-black mb-8 leading-tight">
              Best fit for businesses that need more than a <span className="text-blue-600 italic">brochure site</span>
            </h2>
            <p className="text-xl text-gray-700 leading-relaxed max-w-2xl mb-10">
              We work best with companies that understand their website is a business tool, not just an aesthetic expense.
            </p>
            <ul className="space-y-6">
              {targets.map((target, index) => (
                <li key={index} className="flex items-start gap-4">
                  <CheckCircle2 className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
                  <p className="text-lg md:text-xl text-gray-900 font-medium">{target}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
