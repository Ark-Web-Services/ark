import Approach from './components/Approach'
import CallToAction from './components/CallToAction'
import ClientLogos from './components/ClientLogos'
import ClientShowcase from './components/ClientShowcase'
import Footer from './components/Footer'
import Header from './components/Header'
import Hero from './components/Hero'
import Portfolio from './components/Portfolio'
import Services from './components/Services'
import Story from './components/Story'
import Testimonials from './components/Testimonials'

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