import Layout from '../components/Layout/Layout';
import AboutOne from '../components/sections/homepage/AboutOne';
import ClientOne from '../components/sections/homepage/ClientOne';
import CreativeVisionOne from '../components/sections/homepage/CreativeVisionOne';
import BlogOne from '../components/sections/homepage/BlogOne';
import FeatureOne from '../components/sections/homepage/FeatureOne';
import HeroFive from '../components/sections/homepage/HeroFive';
import Pricing from '../components/sections/homepage/Pricing';
import SuccessOne from '../components/sections/homepage/SuccessOne';
import TestimonialSix from '../components/sections/homepage/TestimonialSix';

export default function Home1() {
    return (
        <>
            <Layout
                logo="logo" // logo, logo-flat, logo-5
            >
                <HeroFive />
                {/* <ClientOne /> */}
                <CreativeVisionOne />
                <AboutOne />
                {/* <FeatureOne /> */}
                <SuccessOne />
                <TestimonialSix />
                <Pricing />
                {/* <BlogOne /> */}
            </Layout>
        </>
    )
}
