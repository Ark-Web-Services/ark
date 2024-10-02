import ClientLogos from './_compoonents/client-logos'
import Features from './_compoonents/features'
import Footer from './_compoonents/footer'
import Header from './_compoonents/header'
import Hero from './_compoonents/hero'
import Testimonials from './_compoonents/testimonials'

export default function Home() {
    return (
        <div className="min-h-screen bg-white">
            <Header />
            <main>
                <Hero />
                <ClientLogos />
                <Features />
                <Testimonials />
            </main>
            <Footer />
        </div>
    )
}