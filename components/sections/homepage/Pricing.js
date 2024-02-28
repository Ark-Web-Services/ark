import Link from 'next/link';
import * as Icon from 'react-feather';

export default function Pricing() {
    return (
        <>
            <section className="layout-pt-lg layout-pb-sm">
                <div className="container">
                    <div className="row justify-center text-center">
                        <div className="col-xl-7 col-lg-8 col-md-10">
                            <div className="sectionHeading ">
                                <h2 className="sectionHeading__title">Pricing</h2>
                                <p className="sectionHeading__text mt-20">We often field queries about our pricing. Here are quick packages for those in a rush. Each website is unique with a distinct goal. If time allows, we recommend a call to discuss pricing!</p>
                            </div>
                        </div>
                    </div>
                    <div className="row x-gap-32 y-gap-32 layout-pt-sm">
                        <div className="col-lg-4 col-md-6">
                            <div>
                                <div className="relative rounded-16 pt-80 pb-60 px-40 text-center bg-white shadow-card">
                                    <div className="text-xl lh-1 fw-600">Basic</div>
                                    <h3 className="text-3xl fw-700 mt-4">$5,000</h3>
                                    {/* <div>per month</div> */}
                                    <div className="pt-32">
                                        <img src="/img/pricing/3/1.svg" alt="image" />
                                    </div>
                                    <p className="text-left mt-32">Standard listing submission, active for<br /> 30 days.</p>
                                    <ul className="y-gap-18 pt-40">
                                        <li className="d-flex items-center">
                                            <Icon.Check className="size-14 mr-10" />
                                            <p className="lh-13">5 Core Pages</p>
                                        </li>
                                        <li className="d-flex items-center">
                                            <Icon.Check className="size-14 mr-10" />
                                            <p className="lh-13">Home</p>
                                        </li>
                                        <li className="d-flex items-center">
                                            <Icon.Check className="size-14 mr-10" />
                                            <p className="lh-13">About</p>
                                        </li>
                                        <li className="d-flex items-center">
                                            <Icon.Check className="size-14 mr-10" />
                                            <p className="lh-13">Services</p>
                                        </li>
                                        <li className="d-flex items-center">
                                            <Icon.Check className="size-14 mr-10" />
                                            <p className="lh-13">News / Events</p>
                                        </li>
                                        <li className="d-flex items-center">
                                            <Icon.Check className="size-14 mr-10" />
                                            <p className="lh-13">Contact</p>
                                        </li>
                                    </ul>
                                    <div className="d-flex justify-center mt-40">
                                        <Link href="faq" className="button -md -dark-4 -uppercase col-12 text-white">
                                            Contact
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div>
                                <div className="relative rounded-16 pt-80 pb-60 px-40 text-center bg-white shadow-card">
                                    <div className="text-xl lh-1 fw-600 text-red-2">Professional</div>
                                    <h3 className="text-3xl fw-700 text-red-2 mt-4">$10,000</h3>
                                    {/* <div>per month</div> */}
                                    <div className="pt-32">
                                        <img src="/img/pricing/3/2.svg" alt="image" />
                                    </div>
                                    <p className="text-left mt-32">Standard listing submission, active for<br /> 30 days.</p>
                                    <ul className="y-gap-18 pt-40">
                                        <li className="d-flex items-center">
                                            <Icon.Check className="size-14 mr-10" />
                                            <p className="lh-13">5 Core Pages</p>
                                        </li>
                                        <li className="d-flex items-center">
                                            <Icon.Check className="size-14 mr-10" />
                                            <p className="lh-13">Copy Writing</p>
                                        </li>
                                        <li className="d-flex items-center">
                                            <Icon.Check className="size-14 mr-10" />
                                            <p className="lh-13">Speed Optimization</p>
                                        </li>
                                        <li className="d-flex items-center">
                                            <Icon.Check className="size-14 mr-10" />
                                            <p className="lh-13">Graphic Design</p>
                                        </li>
                                        <li className="d-flex items-center">
                                            <Icon.Check className="size-14 mr-10" />
                                            <p className="lh-13">Stock Images</p>
                                        </li>
                                        <br />
                                    </ul>
                                    <div className="d-flex justify-center mt-40">
                                        <Link href="faq" className="button -md -red-2 -uppercase col-12 text-white">
                                            contact
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-4 col-md-6">
                            <div>
                                <div className="relative rounded-16 pt-80 pb-60 px-40 text-center bg-white shadow-card">
                                    <div className="text-xl lh-1 fw-600">Custom</div>
                                    <h3 className="text-3xl fw-700 mt-4">Call for Pricing</h3>
                                    {/* <div>per month</div> */}
                                    <div className="pt-32">
                                        <img src="/img/pricing/3/3.svg" alt="image" />
                                    </div>
                                    <p className="text-left mt-32">Standard listing submission, active for<br /> 30 days.</p>
                                    <ul className="y-gap-18 pt-40">
                                        <li className="d-flex items-center">
                                            <Icon.Check className="size-14 mr-10" />
                                            <p className="lh-13">Core Pages</p>
                                        </li>
                                        <li className="d-flex items-center">
                                            <Icon.Check className="size-14 mr-10" />
                                            <p className="lh-13">Copy Writing</p>
                                        </li>
                                        <li className="d-flex items-center">
                                            <Icon.Check className="size-14 mr-10" />
                                            <p className="lh-13">Graphic Design</p>
                                        </li>
                                        <li className="d-flex items-center">
                                            <Icon.Check className="size-14 mr-10" />
                                            <p className="lh-13">Speed Optimization</p>
                                        </li>
                                        <li className="d-flex items-center">
                                            <Icon.Check className="size-14 mr-10" />
                                            <p className="lh-13">E-Commerce</p>
                                        </li>
                                        <li className="d-flex items-center">
                                            <Icon.Check className="size-14 mr-10" />
                                            <p className="lh-13">Custom Development</p>
                                        </li>
                                    </ul>
                                    <div className="d-flex justify-center mt-40">
                                        <Link href="faq" className="button -md -dark-4 -uppercase col-12 text-white">
                                            contact
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* row end */}
                </div>
            </section>
        </>
    );
};
