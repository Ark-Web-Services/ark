import Isotope from "isotope-layout";
import Link from "next/link";
import * as Icon from 'react-feather';
import { useCallback, useEffect, useRef, useState } from "react";

export default function PortfolioFilterOne() {
    const isotope = useRef();
    const [filterKey, setFilterKey] = useState("*");
    useEffect(() => {
        setTimeout(() => {
            isotope.current = new Isotope(".works-row", {
                itemSelector: ".masonry__item",
                // layoutMode: "fitRows",
                percentPosition: true,
                masonry: {
                    columnWidth: ".masonry__item",
                },
                animationOptions: {
                    duration: 750,
                    easing: "linear",
                    queue: false,
                },
            });
        }, 0);
    }, []);
    useEffect(() => {
        if (isotope.current) {
            filterKey === "*"
                ? isotope.current.arrange({ filter: `*` })
                : isotope.current.arrange({ filter: `.${filterKey}` });
        }
    }, [filterKey]);
    const handleFilterKeyChange = useCallback((key) => () => {
        setFilterKey(key);
    },
        []
    );

    const activeBtn = (value) => (value === filterKey ? "active" : "");

    return (
        <>
            <div className="row justify-center">
                <div className="col-auto">
                    <div className="filter-button-group">
                        <button className={`button text-base mr-20 ${activeBtn("*")}`} onClick={handleFilterKeyChange("*")} data-filter="*">All
                            Projects</button>
                        <button className={`button text-base mr-20`} onClick={handleFilterKeyChange("web_design")} data-filter=".web_design">Web
                            Design</button>
                        <button className={`button text-base mr-20`} onClick={handleFilterKeyChange("web_apps")} data-filter=".web_apps">Web Apps</button>
                        <button className={`button text-base mr-20`} onClick={handleFilterKeyChange("e_commerce")} data-filter=".e_commerce">E-Commerce</button>
                        <button className={`button text-base mr-20`} onClick={handleFilterKeyChange("custom_dev")} data-filter=".e_commerce">Custom Development</button>
                    </div>
                </div>
            </div>
            <div className="works-row masonry -col-3 -gap-32 pt-60 md:pt-40 js-masonry js-masonry-no-filter">
                <div className="masonry__sizer"></div>
                <div className="masonry__item -no-ratio  web_design branding">
                    <div className="h:zoom">
                        <div className="relative hover-group overflow-hidden rounded-8">
                            <div className="ratio ratio-37:40 bg-image h:zoom__item rounded-8 js-lazy" style={{ backgroundImage: 'url("../img/portfolio/cards/Arkwebservices.png")' }} />
                            <div className="text-white absolute-full-center z-2 | opac-0 hg:opacity-100 t-base">
                                <div className="bg-dark-2 opac-60 rounded-8 absolute-full-center z-1" />
                                <div className="d-flex justify-center items-center text-xl fw-600 absolute-full-center z-2">
                                    view project
                                    <Icon.ArrowRight className="icon ml-12" />
                                </div>
                                <Link data-barba href="/" className="absolute-full-center z-3" />
                            </div>
                        </div>
                        <div className="mt-20">
                            <div className="x-gap-10 y-gap-10">
                                {/* <a data-barba href="#" className="decoration-none text-sm">#branding</a> */}
                                <a data-barba href="#" className="decoration-none text-sm">#webdesign</a>
                                {/* <a data-barba href="#" className="decoration-none text-sm">#development</a> */}
                            </div>
                            <h4 className="text-2xl fw-600 mt-16">Ark Web Services</h4>
                        </div>
                    </div>
                </div>
                <div className="masonry__item -no-ratio  web_design web_apps custom_dev">
                    <div className="h:zoom">
                        <div className="relative hover-group overflow-hidden rounded-8">
                            <div className="ratio ratio-37:40 bg-image h:zoom__item rounded-8 js-lazy" style={{ backgroundImage: 'url("../img/portfolio/cards/seomagic3.png")' }} />
                            <div className="text-white absolute-full-center z-2 | opac-0 hg:opacity-100 t-base">
                                <div className="bg-dark-2 opac-60 rounded-8 absolute-full-center z-1" />
                                <div className="d-flex justify-center items-center text-xl fw-600 absolute-full-center z-2">
                                    view project
                                    <Icon.ArrowRight className="icon ml-12" />
                                </div>
                                <Link data-barba href="https://seomagic.ai/" className="absolute-full-center z-3" />
                            </div>
                        </div>
                        <div className="mt-20">
                            <div className="x-gap-10 y-gap-10">
                                <a data-barba href="#" className="decoration-none text-sm">#custom</a>
                                <a data-barba href="#" className="decoration-none text-sm">#webdesign</a>
                                <a data-barba href="#" className="decoration-none text-sm">#webapps</a>
                            </div>
                            <h4 className="text-2xl fw-600 mt-16">SEO Magic</h4>
                        </div>
                    </div>
                </div>
                <div className="masonry__item -no-ratio  web_design web_apps custom_dev">
                    <div className="h:zoom">
                        <div className="relative hover-group overflow-hidden rounded-8">
                            <div className="ratio ratio-37:40 bg-image h:zoom__item rounded-8 js-lazy" style={{ backgroundImage: 'url("../img/portfolio/cards/pickapro.png")' }} />
                            <div className="text-white absolute-full-center z-2 | opac-0 hg:opacity-100 t-base">
                                <div className="bg-dark-2 opac-60 rounded-8 absolute-full-center z-1" />
                                <div className="d-flex justify-center items-center text-xl fw-600 absolute-full-center z-2">
                                    view project
                                    <Icon.ArrowRight className="icon ml-12" />
                                </div>
                                <Link data-barba href="https://pickapro.com/" className="absolute-full-center z-3" />
                            </div>
                        </div>
                        <div className="mt-20">
                            <div className="x-gap-10 y-gap-10">
                                <a data-barba href="#" className="decoration-none text-sm">#custom</a>
                                <a data-barba href="#" className="decoration-none text-sm">#webdesign</a>
                                <a data-barba href="#" className="decoration-none text-sm">#webapps</a>
                            </div>
                            <h4 className="text-2xl fw-600 mt-16">Pick A Pro</h4>
                        </div>
                    </div>
                </div>
                <div className="masonry__item -no-ratio  e_commerce web_design">
                    <div className="h:zoom">
                        <div className="relative hover-group overflow-hidden rounded-8">
                            <div className="ratio ratio-37:40 bg-image h:zoom__item rounded-8 js-lazy" style={{ backgroundImage: 'url("../img/portfolio/cards/zalii.png")' }} />
                            <div className="text-white absolute-full-center z-2 | opac-0 hg:opacity-100 t-base">
                                <div className="bg-dark-2 opac-60 rounded-8 absolute-full-center z-1" />
                                <div className="d-flex justify-center items-center text-xl fw-600 absolute-full-center z-2">
                                    view project
                                    <Icon.ArrowRight className="icon ml-12" />
                                </div>
                                <Link data-barba href="https://zalii.co" className="absolute-full-center z-3" />
                            </div>
                        </div>
                        <div className="mt-20">
                            <div className="x-gap-10 y-gap-10">
                                <a data-barba href="#" className="decoration-none text-sm">#custom</a>
                                <a data-barba href="#" className="decoration-none text-sm">#ecommerce</a>
                                <a data-barba href="#" className="decoration-none text-sm">#webdesign</a>
                                <a data-barba href="#" className="decoration-none text-sm">#webapps</a>
                            </div>
                            <h4 className="text-2xl fw-600 mt-16">Zalii</h4>
                        </div>
                    </div>
                </div>
                <div className="masonry__item -no-ratio  web_design branding">
                    <div className="h:zoom">
                        <div className="relative hover-group overflow-hidden rounded-8">
                            <div className="ratio ratio-37:40 bg-image h:zoom__item rounded-8 js-lazy" style={{ backgroundImage: 'url("../img/portfolio/cards/f3pb2.png")' }} />
                            <div className="text-white absolute-full-center z-2 | opac-0 hg:opacity-100 t-base">
                                <div className="bg-dark-2 opac-60 rounded-8 absolute-full-center z-1" />
                                <div className="d-flex justify-center items-center text-xl fw-600 absolute-full-center z-2">
                                    view project
                                    <Icon.ArrowRight className="icon ml-12" />
                                </div>
                                <Link data-barba href="https://f3pb.com/" className="absolute-full-center z-3" />
                            </div>
                        </div>
                        <div className="mt-20">
                            <div className="x-gap-10 y-gap-10">
                                {/* <a data-barba href="#" className="decoration-none text-sm">#branding</a> */}
                                <a data-barba href="#" className="decoration-none text-sm">#webdesign</a>
                                {/* <a data-barba href="#" className="decoration-none text-sm">#developer</a> */}
                            </div>
                            <h4 className="text-2xl fw-600 mt-16">F3 Platform Biologics</h4>
                        </div>
                    </div>
                </div>
                <div className="masonry__item -no-ratio  web_design">
                    <div className="h:zoom">
                        <div className="relative hover-group overflow-hidden rounded-8">
                            <div className="ratio ratio-37:40 bg-image h:zoom__item rounded-8 js-lazy" style={{ backgroundImage: 'url("../img/portfolio/cards/mcsv.png")' }} />
                            <div className="text-white absolute-full-center z-2 | opac-0 hg:opacity-100 t-base">
                                <div className="bg-dark-2 opac-60 rounded-8 absolute-full-center z-1" />
                                <div className="d-flex justify-center items-center text-xl fw-600 absolute-full-center z-2">
                                    view project
                                    <Icon.ArrowRight className="icon ml-12" />
                                </div>
                                <Link data-barba href="https://mencanstopviolence.org/" className="absolute-full-center z-3" />
                            </div>
                        </div>
                        <div className="mt-20">
                            <div className="x-gap-10 y-gap-10">
                                {/* <a data-barba href="#" className="decoration-none text-sm">#branding</a> */}
                                <a data-barba href="#" className="decoration-none text-sm">#webdesign</a>
                                {/* <a data-barba href="#" className="decoration-none text-sm">#developer</a> */}
                            </div>
                            <h4 className="text-2xl fw-600 mt-16">Men Can Stop Violence</h4>
                        </div>
                    </div>
                </div>
                <div className="masonry__item -no-ratio  web_design">
                    <div className="h:zoom">
                        <div className="relative hover-group overflow-hidden rounded-8">
                            <div className="ratio ratio-37:40 bg-image h:zoom__item rounded-8 js-lazy" style={{ backgroundImage: 'url("../img/portfolio/cards/otms.png")' }} />
                            <div className="text-white absolute-full-center z-2 | opac-0 hg:opacity-100 t-base">
                                <div className="bg-dark-2 opac-60 rounded-8 absolute-full-center z-1" />
                                <div className="d-flex justify-center items-center text-xl fw-600 absolute-full-center z-2">
                                    view project
                                    <Icon.ArrowRight className="icon ml-12" />
                                </div>
                                <Link data-barba href="#" className="absolute-full-center z-3" />
                            </div>
                        </div>
                        <div className="mt-20">
                            <div className="x-gap-10 y-gap-10">
                                {/* <a data-barba href="#" className="decoration-none text-sm">#branding</a> */}
                                <a data-barba href="#" className="decoration-none text-sm">#webdesign</a>
                                {/* <a data-barba href="#" className="decoration-none text-sm">#developer</a> */}
                            </div>
                            <h4 className="text-2xl fw-600 mt-16">On The Mark Solutions</h4>
                        </div>
                    </div>
                </div>
                <div className="masonry__item -no-ratio  web_design">
                    <div className="h:zoom">
                        <div className="relative hover-group overflow-hidden rounded-8">
                            <div className="ratio ratio-37:40 bg-image h:zoom__item rounded-8 js-lazy" style={{ backgroundImage: 'url("../img/portfolio/cards/pca2.png")' }} />
                            <div className="text-white absolute-full-center z-2 | opac-0 hg:opacity-100 t-base">
                                <div className="bg-dark-2 opac-60 rounded-8 absolute-full-center z-1" />
                                <div className="d-flex justify-center items-center text-xl fw-600 absolute-full-center z-2">
                                    view project
                                    <Icon.ArrowRight className="icon ml-12" />
                                </div>
                                <Link data-barba href="https://providencecapitaladvisors.com/" className="absolute-full-center z-3" />
                            </div>
                        </div>
                        <div className="mt-20">
                            <div className="x-gap-10 y-gap-10">
                                {/* <a data-barba href="#" className="decoration-none text-sm">#branding</a> */}
                                <a data-barba href="#" className="decoration-none text-sm">#webdesign</a>
                                {/* <a data-barba href="#" className="decoration-none text-sm">#developer</a> */}
                            </div>
                            <h4 className="text-2xl fw-600 mt-16">Providence Capital Advisors</h4>
                        </div>
                    </div>
                </div>
                <div className="masonry__item -no-ratio  web_design">
                    <div className="h:zoom">
                        <div className="relative hover-group overflow-hidden rounded-8">
                            <div className="ratio ratio-37:40 bg-image h:zoom__item rounded-8 js-lazy" style={{ backgroundImage: 'url("../img/portfolio/cards/bap.png")' }} />
                            <div className="text-white absolute-full-center z-2 | opac-0 hg:opacity-100 t-base">
                                <div className="bg-dark-2 opac-60 rounded-8 absolute-full-center z-1" />
                                <div className="d-flex justify-center items-center text-xl fw-600 absolute-full-center z-2">
                                    view project
                                    <Icon.ArrowRight className="icon ml-12" />
                                </div>
                                <Link data-barba href="https://bappov.com/" className="absolute-full-center z-3" />
                            </div>
                        </div>
                        <div className="mt-20">
                            <div className="x-gap-10 y-gap-10">
                                {/* <a data-barba href="#" className="decoration-none text-sm">#marketing</a> */}
                                <a data-barba href="#" className="decoration-none text-sm">#webdesign</a>
                                {/* <a data-barba href="#" className="decoration-none text-sm">#developer</a> */}
                            </div>
                            <h4 className="text-2xl fw-600 mt-16">BAP POV</h4>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};