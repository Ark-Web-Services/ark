import { ArrowRight, BarChart3, Users, Search, ShoppingCart, Globe } from 'lucide-react';

export default function Outcomes() {
  const outcomes = [
    {
      title: "Make your offer clearer in the first 10 seconds",
      description: "No more confusion about what you do or who you serve. We clarify your message so visitors stay engaged.",
      icon: <Users className="w-5 h-5 text-blue-600" />
    },
    {
      title: "Filter in better-fit leads",
      description: "Dedicated conversion paths and strategic copy ensure the inquiries you get are from people ready to buy.",
      icon: <ShoppingCart className="w-5 h-5 text-blue-600" />
    },
    {
      title: "Support SEO with search-intent-driven pages",
      description: "We build the structure you need to rank for specifically targeted service and industry keywords.",
      icon: <Search className="w-5 h-5 text-blue-600" />
    },
    {
      title: "Give your team a stronger sales tool",
      description: "Your website should do the heavy lifting of building trust and authority before the first call.",
      icon: <BarChart3 className="w-5 h-5 text-blue-600" />
    },
    {
      title: "Help your business look as established as it is",
      description: "Premium design and polished interactions that match the professional quality of your services.",
      icon: <Globe className="w-5 h-5 text-blue-600" />
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-black mb-6">What a better website should actually do</h2>
          <p className="text-xl text-gray-600">
            A beautiful website that doesn’t improve trust, clarity, or conversion is a missed opportunity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {outcomes.map((outcome, index) => (
            <div 
              key={index} 
              className="p-8 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-6">
                {outcome.icon}
              </div>
              <h3 className="text-xl font-bold text-black mb-4">{outcome.title}</h3>
              <p className="text-gray-600 leading-relaxed mb-6">{outcome.description}</p>
            </div>
          ))}
          
          <div className="p-8 rounded-2xl bg-blue-600 text-white flex flex-col justify-between hover:scale-[1.02] transition-transform shadow-xl shadow-blue-100">
            <div>
              <h3 className="text-2xl font-bold mb-4">Ready to fix the foundation?</h3>
              <p className="text-blue-100 text-lg mb-8">
                Let's turn your website into a growth asset.
              </p>
            </div>
            <a 
              href="/contact" 
              className="inline-flex items-center gap-2 font-bold text-white group"
            >
              Get started now 
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
