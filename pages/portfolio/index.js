import Head from 'next/head';
import Layout from '@/components/Layout/Layout';
import dynamic from 'next/dynamic';
import Link from "next/link";

const PortfolioFilterOne = dynamic(() => import('@/components/portfolio/PortfolioFilterOne'), {
    ssr: false,
})

export default function Portfolio1() {
    return (
        <>
            <Head>
                <title>Portfolio</title>
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
                                    <h1 className="page-header__title lh-14">Portfolio</h1>
                                </div>
                            </div>
                            <div className="col-xl-4 col-lg-9 col-md-10">
                                <div className="px-20">
                                    <p className="page-header__text">We've been privileged to collaborate with some truly exceptional clients.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                    <section className="layout-pt-lg layout-pb-sm">
                        <div className="section-filter">
                            <div className="container">
                                <PortfolioFilterOne />
                            </div>
                        </div>
                    </section>
                    <section className="layout-pt-sm layout-pb-lg">
                        <div className="container">
                            <div className="row justify-center text-center">
                                <div className="col-auto">
                                    <div className="sectionHeading ">
                                        <h2 className="sectionHeading__title">We help startups launch and succeed very fast</h2>
                                        <p className="sectionHeading__text mt-20">We appreciate your trust greatly! Our clients choose us and our products<br className="md:d-none" /> because they know we are the best.</p>
                                    </div>
                                    <Link href="/contact/" className="button -md -accent text-white mt-40 md:mt-30">Get In Touch</Link>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </Layout>
        </>
    )
}