import HeroSection from './_components/HeroSection';

import BigGuy from './_components/BigGuy';
import ContactSection from './_components/ContactSection';
import Footer from './_components/Footer';
import Header from './_components/Header';
import NoiseSection from './_components/NoiseSection';
import ProjectSection from "./_components/ProjectSection";
import SkillSection from "./_components/SkillSection";



export default function Portfolio() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
      <Header />

      <main>
        <BigGuy />

        <NoiseSection />
        <HeroSection />

        <SkillSection />

        <ProjectSection />

        <ContactSection />
      </main>

      <Footer />
    </div>
  )
}
