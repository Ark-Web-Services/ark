import Header from '../_components/Header'
import Approach from './_components/Approach'
import CallToAction from './_components/CallToAction'
import ClientLogos from './_components/ClientLogos'
import ClientShowcase from './_components/ClientShowcase'
import Footer from './_components/Footer'
import Hero from './_components/Hero'
import Portfolio from './_components/Portfolio'
import Services from './_components/Services'
import Story from './_components/Story'
import Testimonials from './_components/Testimonials'

export default function Home() {
    return (
        <div className="min-h-screen bg-white">
            <Header />
            <main>
                <Hero />
                <ClientShowcase />
                <ClientLogos />
                <Portfolio />
                <Services />
                <Approach />
                <Testimonials />
                <Story />
                <CallToAction />
            </main>
            <Footer />
        </div>
    )
}