import Link from 'next/link';

export default function CreativeVisionOne() {
    return (
        <>
            <section className="layout-pt-sm layout-pb-sm">
                <div className="container">
                    <div className="row y-gap-48 justify-between items-center">
                    <div className="col-xl-7 col-lg-7">
                            <div className="image-group -type-1">
                                <img src="/img/about-1/about/pattern.png" alt="image" />
                                <img src="/img/about-1/about/back.png" alt="image" />
                                <img src="/img/about-1/about/front.png" alt="image" />
                            </div>
                        </div>
                        <div className="col-xl-5 col-lg-5 col-md-10">
                            <div className="pr-48 lg:pr-0">
                                <div className="sectionHeading ">
                                    <div className="sectionHeading__subtitle">
                                        <span>Who We Work With</span>
                                    </div>
                                    <h2 className="sectionHeading__title">We collaborate, <br />create &amp; celebrate</h2>
                                    <p className="sectionHeading__text mt-20">We've had the privilege of collaborating with diverse businesses across various industries, building meaningful relationships along the journey. We don't limit ourselves to a specific industry or niche; instead, we thrive on variety. What truly excites us is partnering with businesses that are a joy to work with, have a clear vision, and exude a passion for their craft. Because when you love what you do, we love working with you.</p>
                                </div>
                                <Link href="/portfolio" className="button -md rounded-8 -light-accent text-accent mt-40">Our Work</Link>
                            </div>
                        </div>

                    </div>
                </div>
            </section>
        </>
    );
};
