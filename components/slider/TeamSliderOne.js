import React from 'react';
import SwiperCore, { Autoplay, Navigation, Pagination } from "swiper";
import { Swiper, SwiperSlide } from "swiper/react";

SwiperCore.use([Autoplay, Navigation, Pagination]);

export default function TeamSliderOne() {
    const data = [
        { img: "1", name: "Aaron Sommerville", title: "Full-stack Developer" },
        { img: "2", name: "Douglas Slingerland", title: "Full-stack Developer" },
        { img: "3", name: "Justin Johnson", title: "Project Manager" },
        // { img: "4", name: "Emma Johnson", title: "Marketing Manager" },
        // { img: "5", name: "William Brown", title: "Project Manager" },
        // { img: "6", name: "Sophia White", title: "Software Developer" },
    ];    
    return (
        <>
            <Swiper
                slidesPerView={4}
                spaceBetween={30}
                loop={true}
                pagination={true}
                autoplay={{
                    delay: 2500,
                    disableOnInteraction: false
                }}
                navigation={{
                    prevEl: ".swiper-button-prev-style-3",
                    nextEl: ".swiper-button-next-style-3",
                }}
                breakpoints={{
                    320: {
                        slidesPerView: 1,
                        spaceBetween: 30,
                    },
                    575: {
                        slidesPerView: 2,
                        spaceBetween: 30,
                    },
                    767: {
                        slidesPerView: 3,
                        spaceBetween: 30,
                    },
                    991: {
                        slidesPerView: 4,
                        spaceBetween: 30,
                    },
                    1199: {
                        slidesPerView: 4,
                        spaceBetween: 30,
                    },
                    1350: {
                        slidesPerView: 4,
                        spaceBetween: 30,
                    },
                }}
                className="swiper-wrapper pt-5"
            >
                {data.map((item, i) => (
    <SwiperSlide className="swiper-slide" key={i}>
        <div className="wow animate__animated animate__fadeIn">
            <div className="ratio ratio-27:33">
                <img className="absolute-full-center object-fit-cover rounded-8" src={`../img/team/${item.img}.png`} alt="Image" />
            </div>
            <div className="mt-20">
                <h4 className="text-xl fw-600">{item.name}</h4>
                <p className="mt-4">{item.title}</p>
            </div>
        </div>
    </SwiperSlide>
))}

            </Swiper>
        </>
    );
};
