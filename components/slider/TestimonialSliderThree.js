import React from 'react';
import SwiperCore, { Autoplay, Navigation, Pagination } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";

SwiperCore.use([Autoplay, Navigation, Pagination]);

export default function 
TestimonialSliderThree() {
    const data = [
        { img: "1" },
        { img: "2" },
        { img: "3" },
        { img: "4" },
        { img: "5" },
    ];

    return (
        <>
            <Swiper
                slidesPerView={1}
                spaceBetween={30}
                loop={true}
                // pagination={true}
                autoplay={{
                    delay: 2500,
                    disableOnInteraction: false
                }}
                navigation={{
                    prevEl: ".js-prev",
                    nextEl: ".js-next",
                }}
                className="swiper-wrapper pt-5"
            >
                {data.map((item, i) => (
                    <SwiperSlide className="swiper-slide" key={i}>
                        <div className="text-center text-white">
                            <div className="d-flex direction-column justify-center">
                            <div className="">
                                <img
                                className="size-96 rounded-full"
                                src={`../img/avatars/${item.img}.png`}
                                alt="image"
                                />
                            </div>
                            <div className="mt-20">
                                <div className="text-16 fw-600  --font-light">Devon Lane</div>
                                <p className="">Team Leader, Paypal</p>
                            </div>
                            </div>
                            <p className="text-xl italic fw-600 lh-17 mt-24">
                                Qui debitis galisum et dolores quisquam At ipsa consequatur? 33 maiores internos sit dolores obcaecati ut quidem iusto et totam velit sit distinctio voluptatem! Id laboriosam eveniet est accusamus.
                            </p>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </>
    );
};
