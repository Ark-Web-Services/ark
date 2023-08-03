import React from 'react';

export default function TestimonialSix() {
    return (
        <>
            <section className="layout-pt-lg layout-pb-lg section-bg-color">
                <div className="section-bg-color__item -wide bg-light-accent" />
                <div className="container">
                    <div className="row justify-center text-center">
                        <div className="col-xl-7 col-lg-8 col-md-10">
                            <div className="sectionHeading ">
                                <h2 className="sectionHeading__title">The Experience</h2>
                                <p className="sectionHeading__text mt-20">We prefer to let our work speak for itself, so we let our clients share their experiences.</p>
                            </div>
                        </div>
                    </div>
                    <div className="row x-gap-32 y-gap-32 pt-60 sm:pt-40">
                        <div className="col-lg-4 col-sm-6">
                            <div>
                                <div className="size-80 rounded-full">
                                    <div className="bg-image rounded-full js-lazy" style={{ backgroundImage: 'url("/img/avatars/1.png")' }} />
                                </div>
                                <div data-split="lines">
                                    <h4 className="text-xl fw-600 mt-30">Expectations Exceeded</h4>
                                    <p className="mt-20">I would absolutely recommend you guys. As I mentioned, you have exceeded our
                                        expectations with this project so far, and you have proven to be very reliable. We love
                                        working with you guys, and plan to use you for any other projects we might have in the
                                        future, as well as some of the great things to come with Pick A Pro!</p>
                                    <div className="mt-30">
                                        <h5 className="text-lg fw-600">Dominic Stramonine</h5>
                                        <p className="mt-4">Pick A Pro</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-4 col-sm-6">
                            <div>
                                <div className="size-80 rounded-full">
                                    <div className="bg-image rounded-full js-lazy" style={{ backgroundImage: 'url("../img/avatars/2.png")' }} />
                                </div>
                                <div data-split="lines">
                                    <h4 className="text-xl fw-600 mt-30">Vision Enhanced</h4>
                                    <p className="mt-20">Ark Web Services is the best web design services I’ve ever used. Not
                                        only was my website delivered on time it was better than I was
                                        expecting. The staff at Ark web services was very polite and helpful in
                                        this journey. Also they have years of experience in the web services
                                        field and was able to enhance my vision on my website and bring my
                                        dream to a reality. I can’t thank them enough for their amazing service</p>
                                    <div className="mt-30">
                                        <h5 className="text-lg fw-600">Cedric President</h5>
                                        <p className="mt-4">Presidential Consulting</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-4 col-sm-6">
                            <div>
                                <div className="size-80 rounded-full">
                                    <div className="bg-image rounded-full js-lazy" style={{ backgroundImage: 'url("../img/avatars/3.png")' }} />
                                </div>
                                <div data-split="lines">
                                    <h4 className="text-xl fw-600 mt-30">True Professionals</h4>
                                    <p className="mt-20">Ark Web Services did an amazing job understanding our needs and
                                        developing a web presence that really supports our business.
                                        Sometimes as business owners we think we know the best way to
                                        showcase or develop our business but it takes a true professional to
                                        listen to our needs and develop a platform that exceeds expectations
                                        for the business and our customers...well done!</p>
                                    <div className="mt-30">
                                        <h5 className="text-lg fw-600">Kris Olson</h5>
                                        <p className="mt-4">Charleston Paranormal</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};
