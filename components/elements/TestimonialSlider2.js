
import React from 'react';
import { Autoplay, Navigation } from 'swiper';
import SwiperCore from "swiper/core";
import { Swiper, SwiperSlide } from 'swiper/react';

SwiperCore.use([Navigation])

export default function TestimonialSlider2() {
    const navigationPrevRef = React.useRef(null)
    const navigationNextRef = React.useRef(null)

    return (
        <>
            <Swiper
                spaceBetween={50}
                slidesPerView={3}
                centeredSlides={true}
                navigation={{
                    prevEl: navigationPrevRef.current,
                    nextEl: navigationNextRef.current,
                }}
                onBeforeInit={(swiper) => {
                    swiper.params.navigation.prevEl = navigationPrevRef.current;
                    swiper.params.navigation.nextEl = navigationNextRef.current;
                }}
                autoplay={{
                    delay: 2500,
                    disableOnInteraction: false,
                }}
                loop={true}
                modules={[Autoplay, Navigation]}
            >
                <SwiperSlide>
                    <div className="d-flex direction-column pl-56 py-60 pr-64 md:px-40 md:py-40 border-light rounded-16 testimonials-active__item">
                        <div className="testimonials-quote">
                            <i className="icon icon-testimonials-quote" />
                        </div>
                        <div className="d-flex items-center">
                            <div className="size-60 mr-20">
                                <img
                                    className="initial-img rounded-full"
                                    src="/img/home-2/testimonials/1.jpg"
                                    alt="image"
                                />
                            </div>
                            <div className="">
                                <div className="text-lg fw-600 text-dark-1">Devon Lane</div>
                                <div className="">Team Leader, Paypal</div>
                            </div>
                        </div>
                        <p className="text-lg lh-18 mt-40 md:mt-20">
                            The template is really nice and offers quite a large set of
                            options. It is beautiful and the coding is done quickly and
                            seamlessly. Thank you!
                        </p>
                    </div>
                </SwiperSlide>
                <SwiperSlide>
                    <div className="d-flex direction-column pl-56 py-60 pr-64 md:px-40 md:py-40 border-light rounded-16 testimonials-active__item">
                        <div className="testimonials-quote">
                            <i className="icon icon-testimonials-quote" />
                        </div>
                        <div className="d-flex items-center">
                            <div className="size-60 mr-20">
                                <img
                                    className="initial-img rounded-full"
                                    src="/img/home-2/testimonials/1.jpg"
                                    alt="image"
                                />
                            </div>
                            <div className="">
                                <div className="text-lg fw-600 text-dark-1">Devon Lane</div>
                                <div className="">Team Leader, Paypal</div>
                            </div>
                        </div>
                        <p className="text-lg lh-18 mt-40 md:mt-20">
                            The template is really nice and offers quite a large set of
                            options. It is beautiful and the coding is done quickly and
                            seamlessly. Thank you!
                        </p>
                    </div>
                </SwiperSlide>
                <SwiperSlide>
                    <div className="d-flex direction-column pl-56 py-60 pr-64 md:px-40 md:py-40 border-light rounded-16 testimonials-active__item">
                        <div className="testimonials-quote">
                            <i className="icon icon-testimonials-quote" />
                        </div>
                        <div className="d-flex items-center">
                            <div className="size-60 mr-20">
                                <img
                                    className="initial-img rounded-full"
                                    src="/img/home-2/testimonials/1.jpg"
                                    alt="image"
                                />
                            </div>
                            <div className="">
                                <div className="text-lg fw-600 text-dark-1">Devon Lane</div>
                                <div className="">Team Leader, Paypal</div>
                            </div>
                        </div>
                        <p className="text-lg lh-18 mt-40 md:mt-20">
                            The template is really nice and offers quite a large set of
                            options. It is beautiful and the coding is done quickly and
                            seamlessly. Thank you!
                        </p>
                    </div>
                </SwiperSlide>
                <SwiperSlide>
                    <div className="d-flex direction-column pl-56 py-60 pr-64 md:px-40 md:py-40 border-light rounded-16 testimonials-active__item">
                        <div className="testimonials-quote">
                            <i className="icon icon-testimonials-quote" />
                        </div>
                        <div className="d-flex items-center">
                            <div className="size-60 mr-20">
                                <img
                                    className="initial-img rounded-full"
                                    src="/img/home-2/testimonials/1.jpg"
                                    alt="image"
                                />
                            </div>
                            <div className="">
                                <div className="text-lg fw-600 text-dark-1">Devon Lane</div>
                                <div className="">Team Leader, Paypal</div>
                            </div>
                        </div>
                        <p className="text-lg lh-18 mt-40 md:mt-20">
                            The template is really nice and offers quite a large set of
                            options. It is beautiful and the coding is done quickly and
                            seamlessly. Thank you!
                        </p>
                    </div>
                </SwiperSlide>
            </Swiper>
        </>
    )
}