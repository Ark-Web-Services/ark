import Atropos from 'atropos/react';
import { useCallback } from "react";

import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

export default function HeroOne({ bgPath, textWhite }) {
    const particlesInit = useCallback(async engine => {
        await loadFull(engine);
    }, []);

    const particlesLoaded = useCallback(async container => {
        // await console.log();
    }, []);

    return (
        <>
            <section className="masthead -type-1 overflow-hidden">
                <div className="masthead__bg wow animate__animated animate__fadeIn overflow-hidden relative">
                    <div className="masthead absolute-full-center" id="js-masthead-1-particles">
                        {/* <Particles
                            id="tsparticles"
                            init={particlesInit}
                            loaded={particlesLoaded}

                            options={{
                                fpsLimit: 120,
                                fullScreen: { enable: false },
                                interactivity: {
                                    modes: {
                                        push: {
                                            quantity: 4,
                                        },
                                        repulse: {
                                            distance: 200,
                                            duration: 0.4,
                                        },
                                    },
                                },
                                particles: {
                                    color: {
                                        value: ["#00ff96", "#0044EB", "#1A3454"],
                                    },
                                    collisions: {
                                        enable: true,
                                    },
                                    move: {
                                        directions: "none",
                                        enable: true,
                                        outModes: {
                                            default: "bounce",
                                        },
                                        random: false,
                                        speed: 1,
                                        straight: false,
                                    },
                                    number: {
                                        density: {
                                            enable: true,
                                            area: 500,
                                        },
                                        value: 40,
                                    },
                                    opacity: {
                                        value: 0.5,
                                    },
                                    shape: {
                                        type: "circle",
                                    },
                                    size: {
                                        value: { min: 1, max: 5 },
                                    },
                                },
                                detectRetina: true,
                            }}
                        /> */}
                    </div>
                    <img src={`../img/${bgPath}/bg.png`} alt="bg" />
                    <img className="wow animate__animated animate__fadeInUp" src="/img/home-1/masthead/rect.svg" alt="bg" />
                </div>
                <div className="container">
                    <div className="row">
                        <div className="col-xl-7 col-lg-6">
                            <div className="masthead__content relative z-2">
                                <div className="masthead__subtitle wow animate__animated animate__fadeInUp">
                                    <span>On sale for a limited time</span>
                                </div>
                                <h1 className={`masthead__title wow animate__animated animate__fadeInUp ${textWhite}`}>
                                    Premium Startup &amp; App<br />
                                    <span className={`${textWhite ? textWhite : "text-accent"} wow animate__animated animate__fadeInUp`}>Landing Page</span>
                                </h1>
                                <p className={`masthead__text wow animate__animated animate__fadeInUp ${textWhite}`}>
                                    Besides its beautiful design. Sassio is an incredibly rich core<br className="sm:d-none" />
                                    framework for you to showcase your App.
                                </p>
                                <div className="masthead__buttons row y-gap-10 pt-32 md:pt-20">
                                    {/* <div className="col-auto text-white wow animate__animated animate__fadeInUp">
                                        <a href="#" className="button -store bg-dark-2 text-white">
                                            <div className="button__icon wow animate__animated animate__fadeInUp">
                                                <img src="/img/home-1/icons/apple.svg" alt="" />
                                            </div>
                                            <div className="button__content">
                                                <div>Download on the</div>
                                                <div>Apple Store</div>
                                            </div>
                                        </a>
                                    </div> */}
                                    {/* <div className="col-auto text-white wow animate__animated animate__fadeInUp" data-wow-delay=".2s">
                                        <a href="#" className="button -store bg-dark-2 text-white">
                                            <div className="button__icon">
                                                <img src="/img/home-1/icons/google.svg" alt="" />
                                            </div>
                                            <div className="button__content text-white">
                                                <div>Get in on</div>
                                                <div>Google Play</div>
                                            </div>
                                        </a>
                                    </div> */}
                                </div>
                            </div>
                        </div>
                        <div className="col-xl-auto col-lg-6">
                            <div className="masthead__image relative z-1">
                                <Atropos
                                    shadow={false}
                                    data-atropos-offset={-5}
                                >
                                    <img src="/img/home-1/masthead/phones.png" alt="phone" />
                                </Atropos>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}