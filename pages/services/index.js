import Head from 'next/head';
import Layout from '@/components/Layout/Layout';
import Link from 'next/link';

export default function Services1() {
    return (
        <>
            <Head>
                <title>Services</title>
            </Head>
            <Layout footerLayout={11}>
                <div>
                    <section className="page-header -base -">
                        <div className="page-header__bg">
                            <img className="initial-img" src="/img/page-header/bg-light.png" alt="Page header" />
                        </div>
                        <div className="page-header__content">
                            <div className="row justify-center text-center">
                                <div className="col-lg-9 col-md-10">
                                    <div>
                                        <h1 className="page-header__title lh-14">Our Services</h1>
                                    </div>
                                </div>
                                <div className="col-xl-4 col-lg-9 col-md-10">
                                    <div className="px-20">
                                        <p className="page-header__text">In the realm of our work, everything translates into code. It's the language we use to bring your vision to life.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="layout-pt-sm">
                        <div className="container">
                            <div className="row justify-center text-center">
                                <div className="col-auto">
                                    {/* <div className="sectionHeading ">
                                        <div className="sectionHeading__subtitle">
                                            <span>What we do</span>
                                        </div>
                                        <h2 className="sectionHeading__title">Everything translates into code.</h2>
                                        <p className="sectionHeading__text mt-20">There's a method to our approach, a streamlined process designed to ensure everything flows seamlessly.<br /> We believe in the harmony of efficiency and effectiveness.</p>
                                    </div> */}
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="layout-pt-sm layout-pb-sm">
                        <div className="container">
                            <div className="row y-gap-48 items-center">
                                <div className="col-xl-5 col-lg-6">
                                    <img className="initial-img" src="/img/services/images-1.jpg" alt="image" />
                                </div>
                                <div className="col-xl-5 offset-xl-1 col-md-10 col-lg-6">
                                    <div className="sectionHeading ">
                                        <div className="sectionHeading__subtitle">
                                            {/* <span>Strategy</span> */}
                                        </div>
                                        <h2 className="sectionHeading__title">Web Design</h2>
                                    </div>
                                    <p className="mt-30 sm:mt-20 pr-100 lg:pr-0">Businesses vary in needs. Some desire a visually engaging site to showcase their brand, aiming for a lasting impression. Others require a mission-oriented website, a strategic tool guiding leads from discovery to conversion, focusing on nurturing leads and facilitating customer journeys.</p>
                                    <div className="mt-30">
                                        {/* <Link href="/services/services-3" className="button -md -accent text-white -uppercase">
                                            Get Started
                                        </Link> */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="layout-pt-sm layout-pb-sm">
                        <div className="container">
                            <div className="row y-gap-48 justify-between items-center">
                                <div className="col-xl-5 col-lg-6 col-md-10 order-lg-1 order-2">
                                    <div className="sectionHeading ">
                                        <div className="sectionHeading__subtitle">
                                            {/* <span>Design</span> */}
                                        </div>
                                        <h2 className="sectionHeading__title">E-Commerce</h2>
                                    </div>
                                    <div className="row x-gap-64 y-gap-32 pt-40 md:pt-32">
                                        <p className="mt-30 sm:mt-20 pr-100 lg:pr-0">E-Commerce sites cater to businesses selling products online. They focus on showcasing products, offering detailed descriptions, and providing online customer support. Ensuring a seamless checkout and a positive customer experience is at the heart of their design.</p>
                                    </div>
                                    <div className="mt-60 md:mt-32">
                                        {/* <Link href="/services/services-3" className="button -md -accent text-white -uppercase">
                                            Get Started
                                        </Link> */}
                                    </div>
                                </div>
                                <div className="col-xl-5 col-lg-6 order-lg-2 order-1">
                                    <img className="initial-img" src="/img/services/images.jpg" alt="image" />
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="layout-pt-sm layout-pb-sm">
                        <div className="container">
                            <div className="row y-gap-48 items-center">
                                <div className="col-xl-5 col-lg-6">
                                    <img className="initial-img" src="/img/services/images-2.jpg" alt="image" />
                                </div>
                                <div className="col-xl-5 offset-xl-1 col-md-10 col-lg-6">
                                    <div className="sectionHeading ">
                                        <div className="sectionHeading__subtitle">
                                            {/* <span>Operation</span> */}
                                        </div>
                                        <h2 className="sectionHeading__title">Web Apps</h2>
                                    </div>
                                    <p className="mt-30 sm:mt-20 pr-100 lg:pr-0">Web Apps offer advanced functionality, akin to having your software online. They support complex features on both front and backend, from online configurators to client portals. Ideal for medium to enterprise businesses, they provide tailored information and functions to meet specific needs.</p>
                                    <div className="mt-30">
                                        {/* <Link href="/services/services-3" className="button -md -accent text-white -uppercase">
                                            Get Started
                                        </Link> */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="layout-pt-sm layout-pb-sm">
                        <div className="container">
                            <div className="row y-gap-48 justify-between items-center">
                                <div className="col-xl-5 col-lg-6 col-md-10 order-lg-1 order-2">
                                    <div className="sectionHeading ">
                                        <div className="sectionHeading__subtitle">
                                            {/* <span>Launch</span> */}
                                        </div>
                                        <h2 className="sectionHeading__title"> Custom Development</h2>
                                    </div>
                                    <p className="mt-30 sm:mt-20 pr-100 lg:pr-0">Custom Development encompasses Websites, E-Commerce, Web Apps, Mobile Apps, and Software, all tailored to your brand and needs. From UI/UX, imagery, branding, copy, to front and backend, everything is bespoke. If you envision it, we can bring it to life. </p>
                                </div>
                                <div className="col-xl-5 col-lg-6 order-lg-2 order-1">
                                    <img className="initial-img" src="/img/services/images-3.jpg" alt="image" />
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="layout-pt-lg layout-pb-sm">
                        <div className="container">
                        <div className="row justify-center text-center">
                                <div className="col-xl-6 col-lg-7">
                                    <div className="sectionHeading ">
                                    <div className="sectionHeading__subtitle">
                                            <span>Our Process</span>
                                        </div>
                                        <h2 className="sectionHeading__title">How It Works</h2>
                                        <p className="sectionHeading__text mt-20">There's a method to our approach, a streamlined process designed to ensure everything flows seamlessly. We believe in the harmony of efficiency and effectiveness.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="row y-gap-32 pt-60 md:pt-48">
                                <div className="col-lg-3 col-sm-6">
                                    <div className="py-50 px-40 bg-white rounded-16 shadow-card">
                                        <div className="size-80 rounded-full d-flex justify-center items-center bg-blue-light">
                                            <img src="/img/about-4/solutions/branding.svg" alt="icon" />
                                        </div>
                                        <h4 className="text-xl fw-600 mt-20">Discovery</h4>
                                        <p className="mt-10">Immersing ourselves in your world, we strive for a profound understanding.</p>
                                        {/* <Link href="/services/services-3" className="button -simple text-accent fw-600 underline mt-12">Discover Now</Link> */}
                                    </div>
                                </div>
                                <div className="col-lg-3 col-sm-6">
                                    <div className="py-50 px-40 bg-white rounded-16 shadow-card">
                                        <div className="size-80 rounded-full d-flex justify-center items-center bg-green-light">
                                            <img src="/img/about-4/solutions/seo.svg" alt="icon" />
                                        </div>
                                        <h4 className="text-xl fw-600 mt-20">Strategy</h4>
                                        <p className="mt-10">Creating a tech roadmap, aligning timelines with your goals.</p>
                                        {/* <Link href="/services/services-3" className="button -simple text-accent fw-600 underline mt-12">Discover Now</Link> */}
                                    </div>
                                </div>
                                <div className="col-lg-3 col-sm-6">
                                    <div className="py-50 px-40 bg-white rounded-16 shadow-card">
                                        <div className="size-80 rounded-full d-flex justify-center items-center bg-yellow-light">
                                            <img src="/img/about-4/solutions/ui-design.svg" alt="icon" />
                                        </div>
                                        <h4 className="text-xl fw-600 mt-20">Design</h4>
                                        <p className="mt-10">From insights to wireframes, we shape the blueprint into tangible mockups.</p>
                                        {/* <Link href="/services/services-3" className="button -simple text-accent fw-600 underline mt-12">Discover Now</Link> */}
                                    </div>
                                </div>
                                <div className="col-lg-3 col-sm-6">
                                    <div className="py-50 px-40 bg-white rounded-16 shadow-card">
                                        <div className="size-80 rounded-full d-flex justify-center items-center bg-red-light">
                                            <img src="/img/about-4/solutions/animate.svg" alt="icon" />
                                        </div>
                                        <h4 className="text-xl fw-600 mt-20">Development</h4>
                                        <p className="mt-10">
                                        Turning ideas into reality. Post-creation, we test and review, ensuring perfection.</p>
                                        {/* <Link href="/services/services-3" className="button -simple text-accent fw-600 underline mt-12">Discover Now</Link> */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="layout-pt-sm layout-pb-lg">
                        <div className="container">
                            <div className="relative rounded-16">
                                <div className="absolute-full-center z--1">
                                    <div className="bg-image rounded-16 js-lazy" style={{ backgroundImage: 'url("/img/home-2/footer/cta.png")' }} />
                                </div>
                                <div className="py-50 px-64">
                                    <div className="row y-gap-32 justify-between items-center">
                                        <div className="col-auto">
                                            <h3 className="text-30 lh-15 text-white">Here's our invitation to you<br /> to collaborate!</h3>
                                        </div>
                                        <div className="col-auto">
                                            <button className="button -md -white text-accent">Embark</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </Layout>
        </>
    )
}