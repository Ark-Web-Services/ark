import ClientLogos from './_components/ClientLogos'
import Features from './_components/Features'
import Footer from './_components/Footer'
// import Header from './_components/Header'
import Header from '../_components/Header'
import Hero from './_components/Hero'
import Testimonials from './_components/testimonials'


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