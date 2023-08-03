import Link from 'next/link';
import * as Icon from 'react-feather';

export default function FeatureEight() {
    return (
        <>
            <section className="layout-pt-lg layout-pb-lg">
                <div className="container">
                    <div className="row y-gap-40 justify-between items-center">
                        <div className="col-xl-5 col-lg-6 order-lg-1 order-2">
                            <div className="sectionHeading ">
                                <h2 className="sectionHeading__title">Invite Your Family <br /> And Friends</h2>
                            </div>
                            <p className="pr-64 mt-32">After you create your account you can invite your family and friends to Zalii so they can upload each special moment into your custom memory book.</p>
                            <div className="pt-32 y-gap-20">
                                <div className="d-flex items-center">
                                    <div className="size-32 rounded-full bg-light-3 mr-12 d-flex justify-center items-center">
                                        <Icon.Check className="icon size-14 text-black" />
                                    </div>
                                    <h5 className="text-lg fw-600">Easy Invite Process</h5>
                                </div>
                                <div className="d-flex items-center">
                                    <div className="size-32 rounded-full bg-light-3 mr-12 d-flex justify-center items-center">
                                        <Icon.Check className="icon size-14 text-black" />
                                    </div>
                                    <h5 className="text-lg fw-600">Simple Interface</h5>
                                </div>
                                <div className="d-flex items-center">
                                    <div className="size-32 rounded-full bg-light-3 mr-12 d-flex justify-center items-center">
                                        <Icon.Check className="icon size-14 text-black" />
                                    </div>
                                    <h5 className="text-lg fw-600">Drag & Drop</h5>
                                </div>
                            </div>
                            <Link href="/about/about-1" className="button -md -accent text-white mt-40">Start Today</Link>
                        </div>
                        <div className="col-xl-6 col-lg-6 order-lg-2 order-1">
                            <div className="d-flex justify-center items-center relative">
                                <div className="absolute-full-center z-1">
                                    <img className="initial-img" src="/img/home-7/images/rect.png" alt="image" />
                                </div>
                                <div className="relative z-2 float-animation">
                                    <img className="initial-img" src="/img/home-7/images/3.webp" alt="image" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};