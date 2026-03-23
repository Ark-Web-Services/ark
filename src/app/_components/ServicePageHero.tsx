import Link from 'next/link';

interface ServicePageHeroProps {
  eyebrow: string;
  h1: string;
  subhead: string;
  primaryCtaText?: string;
}

export default function ServicePageHero({ 
  eyebrow, 
  h1, 
  subhead, 
  primaryCtaText = "Book a Discovery Call" 
}: ServicePageHeroProps) {
  return (
    <section className="pt-32 pb-20 md:pt-48 md:pb-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="max-w-4xl">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-6">
            {eyebrow}
          </span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-black mb-8 leading-[1.1]">
            {h1}
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed max-w-3xl">
            {subhead}
          </p>
          <Link
            href="/contact"
            className="inline-block px-10 py-5 bg-blue-600 text-white rounded-full text-xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
          >
            {primaryCtaText}
          </Link>
        </div>
      </div>
    </section>
  );
}
