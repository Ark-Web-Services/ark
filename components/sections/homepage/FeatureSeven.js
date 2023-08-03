import Link from 'next/link';

export default function FeatureSeven() {
    return (
        <>
            <section className="layout-pt-md layout-pb-sm">
                <div className="container">
                    <div className="row y-gap-40 justify-between items-center">
                        <div className="col-xl-6 col-lg-6">
                            <div className="d-flex justify-center items-center relative">
                                <div className="absolute-full-center z-1">
                                    <img className="initial-img" src="/img/home-7/images/rect.png" alt="image" />
                                </div>
                                <div className="relative z-2 float-animation">
                                    <img className="max-w-100" src="/img/home-7/images/4.webp" alt="image" />
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-5 col-lg-6">
                            <div className="sectionHeading ">
                                <h2 className="sectionHeading__title">Design Your Custom Memory Book From <br /> Front To Back.</h2>
                            </div>
                            <p className="mt-20">Zalii provides templates for each and every page of your book to give it that special feel. You also have the option to upload your own designs.</p>
                            <Link href="/about/about-1" className="button -md -purple text-white mt-32">Design Now</Link>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};
