import Header from '../../_components/Header';
import Footer from '../../_components/Footer';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function StrategyInsights() {
  const articles = [
    { title: "Website redesign vs full rebuild: what should you choose?", date: "March 22, 2024", readTime: "9 min read" },
    { title: "The 80/20 of high-converting service websites", date: "March 06, 2024", readTime: "7 min read" },
    { title: "Building a website that solves business problems", date: "February 25, 2024", readTime: "11 min read" },
    { title: "How to audit your own website for conversion killers", date: "February 08, 2024", readTime: "14 min read" }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <Link href="/insights" className="flex items-center gap-2 text-blue-600 font-bold mb-12 hover:-translate-x-2 transition-transform">
            <ArrowLeft className="w-5 h-5" />
            Back to Insights
          </Link>
          
          <div className="max-w-3xl mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-8 leading-tight">
              Website Strategy Insights
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Strategic thinking on how your website should support your business goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {articles.map((article, index) => (
              <div key={index} className="group cursor-pointer p-10 rounded-3xl border border-gray-100 bg-gray-50 hover:bg-white hover:shadow-2xl hover:border-blue-100 transition-all">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm font-bold text-blue-600 uppercase tracking-wider">Article</span>
                  <span className="text-sm text-gray-400">{article.date}</span>
                </div>
                <h3 className="text-2xl font-bold text-black mb-6 group-hover:text-blue-600 transition-colors leading-tight">
                  {article.title}
                </h3>
                <div className="flex items-center justify-between mt-auto">
                    <span className="text-sm font-medium text-gray-500">{article.readTime}</span>
                    <div className="text-blue-600 font-bold flex items-center gap-2">
                        Read Story
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
