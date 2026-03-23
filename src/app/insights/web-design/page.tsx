import Header from '../../_components/Header';
import Footer from '../../_components/Footer';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function WebDesignInsights() {
  const articles = [
    { title: "What makes a service business website convert?", date: "March 15, 2024", readTime: "8 min read" },
    { title: "How much does a custom website cost for a service business?", date: "March 10, 2024", readTime: "12 min read" },
    { title: "5 signs your website is losing you qualified inquiries", date: "February 28, 2024", readTime: "6 min read" },
    { title: "The psychology of trust in high-ticket service web design", date: "February 15, 2024", readTime: "10 min read" }
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
              Web Design Insights
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Strategic advice on building websites that clarify your message and drive inbound growth.
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
                    <div className="text-blue-600 font-bold flex items-center gap-2 group-hover:gap-3 transition-all">
                        Read Story
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                        </svg>
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
