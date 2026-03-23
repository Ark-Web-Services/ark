'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function Faq() {
  const faqs = [
    {
      question: "Do you only work with certain types of businesses?",
      answer: "We work best with service businesses that need a clearer brand, a stronger website, and a better inbound foundation."
    },
    {
      question: "Do you offer SEO too?",
      answer: "Yes. We build SEO into the structure, targeting, and content direction of the site so it’s positioned to grow over time."
    },
    {
      question: "Do you build in Webflow or custom code?",
      answer: "We offer both, depending on your goals, complexity, and long-term content needs."
    },
    {
      question: "Can you help if we already have a website?",
      answer: "Yes. Many projects start as redesigns, repositioning efforts, or structural rebuilds."
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-black mb-12 text-center">Common questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <FaqItem key={index} question={faq.question} answer={faq.answer} />
          ))}
        </div>
      </div>
    </section>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden hover:border-blue-100 transition-colors">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <span className="text-xl font-bold text-black">{question}</span>
        {isOpen ? <ChevronUp className="w-6 h-6 text-blue-600" /> : <ChevronDown className="w-6 h-6 text-gray-400" />}
      </button>
      {isOpen && (
        <div className="p-6 pt-0 text-lg text-gray-600 leading-relaxed border-t border-gray-50">
          {answer}
        </div>
      )}
    </div>
  );
}
