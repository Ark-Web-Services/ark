import Header from '../_components/Header';
import Footer from '../_components/Footer';
import Link from 'next/link';
import { Layout, Palette, Search, Zap, Lightbulb, ArrowRight } from 'lucide-react';

export default function InsightsPage() {
  const hubs = [
    { title: "Web Design", href: "/insights/web-design", icon: <Layout className="w-6 h-6 text-blue-600" /> },
    { title: "Branding", href: "/insights/branding", icon: <Palette className="w-6 h-6 text-blue-600" /> },
    { title: "SEO Foundations", href: "/insights/seo", icon: <Search className="w-6 h-6 text-blue-600" /> },
    { title: "Webflow", href: "/insights/webflow", icon: <Zap className="w-6 h-6 text-blue-600" /> },
    { title: "Strategy", href: "/insights/website-strategy", icon: <Lightbulb className="w-6 h-6 text-blue-600" /> }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-8 leading-tight">
              Insights on websites, branding, and inbound growth
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Our articles and guides are designed to help you understand how to turn your website into a compounding marketing asset.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-24">
            {hubs.map((hub, index) => (
              <Link 
                key={index}
                href={hub.href}
                className="p-8 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-xl hover:border-blue-100 transition-all flex flex-col items-center text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-6">
                  {hub.icon}
                </div>
                <h3 className="text-lg font-bold text-black mb-4">{hub.title}</h3>
                <div className="mt-auto text-blue-600">
                  <ArrowRight className="w-5 h-5" />
                </div>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                  <h2 className="text-3xl font-bold text-black border-b border-gray-100 pb-4">Popular Guides</h2>
                  {[
                      { title: "How much does a custom website cost for a service business?", category: "Web Design" },
                      { title: "Website redesign vs full rebuild: what should you choose?", category: "Strategy" },
                      { title: "What makes a service business website convert?", category: "Web Design" },
                      { title: "How branding improves conversion on a website", category: "Branding" }
                  ].map((article, i) => (
                      <div key={i} className="group cursor-pointer">
                          <span className="text-sm font-bold text-blue-600 uppercase tracking-wider">{article.category}</span>
                          <h3 className="text-2xl font-bold text-black group-hover:text-blue-600 transition-colors mt-2">{article.title}</h3>
                      </div>
                  ))}
              </div>
              <div className="bg-blue-600 rounded-3xl p-10 text-white flex flex-col justify-between">
                  <div>
                      <h3 className="text-2xl font-bold mb-4 text-white">Subscribe to Inbound Insights</h3>
                      <p className="text-blue-100 mb-8">Get the latest strategies for growth-led web design and SEO foundations.</p>
                      <input type="email" placeholder="email@company.com" className="w-full px-6 py-4 bg-white/10 border border-white/20 rounded-xl outline-none focus:bg-white/20 text-white placeholder:text-white/40 mb-4" />
                      <button className="w-full bg-white text-blue-600 font-bold py-4 rounded-xl hover:bg-blue-50 transition-colors">Join the List</button>
                  </div>
              </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
