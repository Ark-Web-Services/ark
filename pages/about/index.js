import Head from 'next/head';
import CounterUp from '@/components/elements/CounterUp';
import Layout from '@/components/Layout/Layout';
import TeamSliderOne from '@/components/slider/TeamSliderOne';
import TestimonialSliderOne from '@/components/slider/TestimonialSliderOne';

export default function About1() {
    return (
        <>
            <Head>
                <title>About Us</title>
            </Head>
            <Layout
                headerLayout={1}
                footerLayout={11}
            >
                <section className="page-header -base -">
                    <div className="page-header__bg">
                        <img className="initial-img" src="/img/page-header/bg-light.png" alt="Page header" />
                    </div>
                    <div className="page-header__content">
                        <div className="row justify-center text-center">
                            <div className="col-lg-9 col-md-10">
                                <div>
                                    <h1 className="page-header__title lh-14">About us</h1>
                                </div>
                            </div>
                            <div className="col-xl-4 col-lg-9 col-md-10">
                                <div className="px-20">
                                    {/* <p className="page-header__text">There are plenty of web design agencies but there's no one like us.</p> */}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* team */}
                <section className="layout-pt-sm layout2-pb-sm">
                    <div className="container">
                        <div className="row justify-center">
                            <div className="col text-center">
                                <div className="sectionHeading ">
                                    <div className="sectionHeading__subtitle">
                                        <span>Meet The Team</span>
                                    </div>
                                    <h2 className="sectionHeading__title">The team that addresses everyone's challenges.</h2>
                                </div>
                            </div>
                        </div>
                        <div className="sectionSlider overflow-hidden pt-60 js-sectionSlider" data-cursor-slider="slider" data-gap={30} data-slider-col="base-4 lg-3 md-2 sm-1" data-pagination>
                            <div className="swiper-wrapper">
                                <TeamSliderOne />
                            </div>
                            {/* <div className="pagination -slider mt-60 js-pagination" /> */}
                        </div>
                    </div>
                </section>
                {/* who we are */}
                <section className="layout-pt-sm layout-pb-sm">
                    <div className="container">
                        <div className="row">
                            <div className="col-xl-7 col-lg-9">
                                <div className="sectionHeading ">
                                    <div className="sectionHeading__subtitle">
                                        <span>Who we are</span>
                                    </div>
                                    <h2 className="sectionHeading__title">We are fathers, husbands, entrepreneurs, car enthusiasts, <br />and the list goes on.</h2>
                                </div>
                            </div>
                        </div>
                        <div className="row y-gap-32 justify-between pt-40">
                            <div className="col-xl-5 col-lg-6">
                                <h4 className="text-xl fw-600">Our Vision</h4>
                                <p className="text-16 fw-600 mt-16">There are plenty of web design agencies but there's no one like us.</p>
                            </div>
                            <div className="col-lg-6">
                                <h4 className="text-xl fw-600">Our Values</h4>
                                <p className="mt-16">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas varius tortor nibh, sit amet tempor nibh finibus et. Aenean eu enim justo. Vestibulum aliquam hendrerit molestie. Mauris malesuada nisi sit amet augue accumsan tincidunt. Maecenas tincidunt, velit ac porttitor pulvinar, tortor eros facilisis libero, vitae commodo nunc quam et ligula. Ut nec ipsum sapien. Interdum et malesuada fames ac ante ipsum primis in faucibus. Integer id nisi nec nulla luctus.</p>
                            </div>
                        </div>
                    </div>
                </section>
                {/* about company */}
                <section className="layout-pt-lg layout-pb-lg section-bg-color">
                    <div className="section-bg-color__item -wide" />
                    <div className="container">
                        <div className="row y-gap-48 justify-between items-center">
                            <div className="col-xl-5 col-lg-6">
                                <div className="rounded-8">
                                    <img className="initial-img rounded-8" src="/img/about-2/about/team.png" alt="image" />
                                </div>
                            </div>
                            <div className="col-xl-6 col-lg-6">
                                <div className="wow animate__animated animate__fadeIn">
                                    <div className="sectionHeading ">
                                        <div className="sectionHeading__subtitle">
                                            <span>What we</span>
                                        </div>
                                        <h2 className="sectionHeading__title">We help startups launch,<br /> grow and succeed very fast</h2>
                                    </div>
                                </div>
                                <div className="row y-gap-40 pt-32">
                                    <div className="col-sm-6">
                                        <h4 className="text-xl fw-600">Company Benefits</h4>
                                        <p className="mt-20">Since 2017, we have led innovation and new product delivery in business startup services delivered online.</p>
                                    </div>
                                    <div className="col-sm-6">
                                        <h4 className="text-xl fw-600">Competitive Salary</h4>
                                        <p className="mt-20">Since 2017, we have led innovation and new product delivery in business startup services delivered online.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* partners */}
                <section className="layout-pt-sm layout-pb-xl">
                    <div className="container">
                        <div className="row justify-center">
                            <div className="col text-center">
                                <div className="sectionHeading ">
                                    <div className="sectionHeading__subtitle">
                                        <span>Partners</span>
                                    </div>
                                    <h2 className="sectionHeading__title">We work with the best brands</h2>
                                </div>
                            </div>
                        </div>
                        <div className="row y-gap-32 justify-between md:justify-center items-center mt-64">
                            <div className="col-lg-auto col-md-3 col-4">
                                <div className="d-flex justify-center items-center px-4">
                                    <img className="col-lg-12 col-10" src="/img/clients/1.svg" alt="clients image" />
                                </div>
                            </div>
                            <div className="col-lg-auto col-md-3 col-4">
                                <div className="d-flex justify-center items-center px-4">
                                    <img className="col-lg-12 col-10" src="/img/clients/2.svg" alt="clients image" />
                                </div>
                            </div>
                            <div className="col-lg-auto col-md-3 col-4">
                                <div className="d-flex justify-center items-center px-4">
                                    <img className="col-lg-12 col-10" src="/img/clients/3.svg" alt="clients image" />
                                </div>
                            </div>
                            <div className="col-lg-auto col-md-3 col-4">
                                <div className="d-flex justify-center items-center px-4">
                                    <img className="col-lg-12 col-10" src="/img/clients/4.svg" alt="clients image" />
                                </div>
                            </div>
                            <div className="col-lg-auto col-md-3 col-4">
                                <div className="d-flex justify-center items-center px-4">
                                    <img className="col-lg-12 col-10" src="/img/clients/5.svg" alt="clients image" />
                                </div>
                            </div>
                            <div className="col-lg-auto col-md-3 col-4">
                                <div className="d-flex justify-center items-center px-4">
                                    <img className="col-lg-12 col-10" src="/img/clients/6.svg" alt="clients image" />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

            </Layout>
        </>
    )
}