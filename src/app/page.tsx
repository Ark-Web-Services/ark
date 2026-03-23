
import Header from './_components/Header';
import Footer from './_components/Footer';
import Hero from './_components/homepage/Hero';
import Problem from './_components/homepage/Problem';
import ServicesSnapshot from './_components/homepage/ServicesSnapshot';
import WhoItsFor from './_components/homepage/WhoItsFor';
import Outcomes from './_components/homepage/Outcomes';
import Strategy from './_components/homepage/Strategy';
import CaseStudiesSnapshot from './_components/homepage/CaseStudiesSnapshot';
import Process from './_components/homepage/Process';
import Faq from './_components/homepage/Faq';
import FinalCta from './_components/homepage/FinalCta';

export default function Page() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <Hero />
        <Problem />
        <ServicesSnapshot />
        <WhoItsFor />
        <Outcomes />
        <Strategy />
        <CaseStudiesSnapshot />
        <Process />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
