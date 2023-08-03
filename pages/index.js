import Layout from '@/components/Layout/Layout';
import AboutOne from '@/components/sections/homepage/AboutOne';
import ClientOne from '@/components/sections/homepage/ClientOne';
import CreativeVisionOne from '@/components/sections/homepage/CreativeVisionOne';
import BlogOne from '@/components/sections/homepage/BlogOne';
import FeatureOne from '@/components/sections/homepage/FeatureOne';
import HeroFive from '@/components/sections/homepage/HeroFive';
import PricingFive from '@/components/sections/homepage/PricingFive';
import SuccessOne from '@/components/sections/homepage/SuccessOne';
import TestimonialSix from '@/components/sections/homepage/TestimonialSix';

export default function Home1() {
    return (
        <>
            <Layout
                headerLayout={1}
                footerLayout={11}
                logo="logo" // logo, logo-flat, logo-5
                // verticalLine // if vertical line true, show vertical line show
            >
                <HeroFive />
                {/* <ClientOne /> */}
                <CreativeVisionOne />
                <AboutOne />
                {/* <FeatureOne /> */}
                <SuccessOne />
                <TestimonialSix />
                <PricingFive />
                {/* <BlogOne /> */}
            </Layout>
        </>
    )
}
