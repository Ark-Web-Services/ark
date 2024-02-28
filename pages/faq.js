import Layout from '@/components/Layout/Layout';
import { useEffect, useRef, useState } from 'react';
import * as Icon from 'react-feather';
export default function Faqs() {
    const [activeKey, setActiveKey] = useState(null);
    const contentRefs = useRef([]);
    const handleToggle = (key) => {
        setActiveKey(prevActiveKey => prevActiveKey === key ? null : key);
    };
    // useEffect(() => {
    //     if (contentRef.current) {
    //         const contentHeight = contentRef.current.scrollHeight;
    //         const newMaxHeight = active.status ? `${contentHeight}px` : '0';
    //         contentRef.current.style.maxHeight = newMaxHeight;
    //     }
    // }, [active.status]);
    useEffect(() => {
        Object.entries(contentRefs.current).forEach(([key, content]) => {
            const isKeyActive = parseInt(key) === activeKey;
            content.style.maxHeight = isKeyActive ? `${content.scrollHeight}px` : '0px';
        });
    }, [activeKey]);

    return (
        <>
            <Layout
                footerLayout={11}
            >
                <div>
                    <section className="page-header -base -">
                        <div className="page-header__bg">
                            <img className="initial-img" src="/img/page-header/bg-light.png" alt="Page header" />
                        </div>
                        <div className="page-header__content">
                            <div className="row justify-center text-center">
                                <div className="col-lg-9 col-md-10">
                                    <div>
                                        <h1 className="page-header__title lh-14">Frequently Asked Questions</h1>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="layout-pt-lg layout-pb-lg">
                        <div className="container">
                            <div className="row y-gap-60 justify-center">

                                <div className="col-xl-8 col-lg-9 col-md-11">
                                    <div className="accordion -bordered pt-32 js-accordion">
                                        <div className={activeKey == 5 ? "accordion__item is-active" : "accordion__item"} onClick={() => handleToggle(5)}>
                                            <div className="accordion__button text-black">
                                                <div className="accordion__icon">
                                                    <Icon.Plus className="icon" />
                                                    <Icon.Minus className="icon" />
                                                </div>
                                                <button className="text-lg md:text-base fw-600 text-black"> What does the package include?</button>
                                            </div>
                                            <div className="accordion__content" ref={el => el && (contentRefs.current[5] = el)}>
                                                <div className="accordion__content__inner">
                                                    <p>
                                                        Each of our packages is tailored to meet the diverse needs of our clients, leveraging the full power of Next.js and the T3 stack. Generally, our packages include custom web application development, responsive design, SEO optimization, and basic maintenance for a set period post-launch. Additionally, we offer optional add-ons such as e-commerce integration, advanced SEO strategies, and extended maintenance and support plans.

                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={activeKey == 6 ? "accordion__item is-active" : "accordion__item"} onClick={() => handleToggle(6)}>
                                            <div className="accordion__button text-black">
                                                <div className="accordion__icon">
                                                    <Icon.Plus className="icon" />
                                                    <Icon.Minus className="icon" />
                                                </div>
                                                <button className="text-lg md:text-base fw-600 text-black">What are the customization options for my web application?</button>
                                            </div>
                                            <div className="accordion__content" ref={el => el && (contentRefs.current[6] = el)}>
                                                <div className="accordion__content__inner">
                                                    <p>
                                                        Every web application we develop is fully customized to meet our clients' unique requirements and business goals. Our customization options range from aesthetic elements like themes and layouts to functional features such as user authentication, database integration, and dynamic content. We also offer advanced customizations, including API integrations, e-commerce functionalities, and bespoke user interaction models. Throughout the development process, we work closely with you to ensure that every aspect of the application aligns with your vision and objectives, providing a truly personalized web solution.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={activeKey == 7 ? "accordion__item is-active" : "accordion__item"} onClick={() => handleToggle(7)}>
                                            <div className="accordion__button text-black">
                                                <div className="accordion__icon">
                                                    <Icon.Plus className="icon" />
                                                    <Icon.Minus className="icon" />
                                                </div>
                                                <button className="text-lg md:text-base fw-600 text-black">How do I pay for your service?</button>
                                            </div>
                                            <div className="accordion__content" ref={el => el && (contentRefs.current[7] = el)}>
                                                <div className="accordion__content__inner">
                                                    <p>
                                                        We offer flexible payment options to suit your project's needs and budget. Payments can be made through bank transfers, credit cards, or PayPal. We typically begin with a deposit at the start of the project, followed by milestone-based payments to ensure transparency and satisfaction at every phase of development.

                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={activeKey == 8 ? "accordion__item is-active" : "accordion__item"} onClick={() => handleToggle(8)}>
                                            <div className="accordion__button text-black">
                                                <div className="accordion__icon">
                                                    <Icon.Plus className="icon" />
                                                    <Icon.Minus className="icon" />
                                                </div>
                                                <button className="text-lg md:text-base fw-600 text-black">Can I suggest a new feature?</button>
                                            </div>
                                            <div className="accordion__content" ref={el => el && (contentRefs.current[8] = el)}>
                                                <div className="accordion__content__inner">
                                                    <p>

                                                        Absolutely! We encourage our clients to share their ideas and suggestions for new features. Our development process is collaborative and iterative, and client feedback is crucial to us. If you have a feature in mind, let's discuss it! Our team will evaluate the feasibility and work with you to integrate it into your project, ensuring that the final product truly aligns with your vision.

                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={activeKey == 9 ? "accordion__item is-active" : "accordion__item"} onClick={() => handleToggle(9)}>
                                            <div className="accordion__button text-black">
                                                <div className="accordion__icon">
                                                    <Icon.Plus className="icon" />
                                                    <Icon.Minus className="icon" />
                                                </div>
                                                <button className="text-lg md:text-base fw-600 text-black">Do you integrate generative AI in  web applications?</button>
                                            </div>
                                            <div className="accordion__content" ref={el => el && (contentRefs.current[9] = el)}>
                                                <div className="accordion__content__inner">
                                                    <p>
                                                        Our approach at Ark Web Services integrates advanced AI technologies, including OpenAI services, into our web applications to elevate the digital experience. Our expertise spans from implementing natural language processing and chatbots for enhanced user engagement to utilizing generative AI for creating bespoke sound and visual content. This innovative use of AI not only automates processes but also introduces a new level of personalization and interactivity to web applications. By leveraging AI, we aim to unlock new potentials for our clients, ensuring their web presence is not just functional but truly transformative.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={activeKey == 10 ? "accordion__item is-active" : "accordion__item"} onClick={() => handleToggle(10)}>
                                            <div className="accordion__button text-black">
                                                <div className="accordion__icon">
                                                    <Icon.Plus className="icon" />
                                                    <Icon.Minus className="icon" />
                                                </div>
                                                <button className="text-lg md:text-base fw-600 text-black">What kind of post-launch support and maintenance services do you offer?</button>
                                            </div>
                                            <div className="accordion__content" ref={el => el && (contentRefs.current[10] = el)}>
                                                <div className="accordion__content__inner">
                                                    <p>
                                                        We understand the importance of not just launching a project but nurturing it for long-term success. Our commitment extends beyond the initial go-live, offering ongoing support and maintenance services tailored to each client's needs. Whether it's updating content, fine-tuning features, or ensuring your web application scales smoothly with your growing business, we're here to provide the expertise and assistance you need. This approach ensures that your digital assets remain cutting-edge, secure, and aligned with evolving market trends, helping you maintain a competitive edge.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    <div className="svg-shape">
                        <svg width={1920} height={60} viewBox="0 0 1920 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0 30C0 13.4315 13.4315 0 30 0H1890C1906.57 0 1920 13.4315 1920 30V60H0V30Z" fill="#1A3454" />
                        </svg>
                    </div>
                </div>

            </Layout>

        </>
    )
}