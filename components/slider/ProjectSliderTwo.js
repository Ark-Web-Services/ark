import React from 'react';
import { Autoplay, Navigation, Pagination } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";

export default function ProjectSliderTwo() {
    const data = [
        { img: "1.jpg" },
        { img: "2.jpg" },
        { img: "3.jpg" },
        { img: "1.jpg" },
    ];
    return (
        <>
            <Swiper
                slidesPerView={3}
                spaceBetween={30}
                loop={true}
                // pagination={true}
                autoplay={{
                    delay: 2500,
                    disableOnInteraction: false
                }}
                modules={[Autoplay, Navigation, Pagination]}
                navigation={{
                    prevEl: ".swiper-button-prev-style-3",
                    nextEl: ".swiper-button-next-style-3",
                }}
                className="swiper-wrapper pt-5"
            >
                {data.map((item, i) => (
                    <SwiperSlide className="swiper-slide" key={i}>
                        <div className="ratio ratio-8:5">
                            <img className="absolute-full-center object-fit-cover" src={`../img/about-2/slider/${item.img}`} alt="image" />
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </>
    );
};

