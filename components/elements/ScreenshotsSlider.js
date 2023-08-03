import { Pagination } from 'swiper';
import SwiperCore from "swiper/core";
import { Swiper, SwiperSlide } from 'swiper/react';

SwiperCore.use([Pagination])

export default function ScreenshotsSlider() {
    return (
        <>
            <Swiper
                spaceBetween={150}
                slidesPerView={3}
                pagination={{
                    clickable: true,
                    el: '.js-pagination'
                }}
            >
                <SwiperSlide>
                    <div className="phone-slider-image">
                        <img src="/img/home-1/appScreens/iPhone-1.jpg" alt="phone image" />
                    </div>
                </SwiperSlide>
                <SwiperSlide>
                    <div className="phone-slider-image">
                        <img src="/img/home-1/appScreens/iPhone-2.jpg" alt="phone image" />
                    </div>
                </SwiperSlide>
                <SwiperSlide>
                    <div className="phone-slider-image">
                        <img src="/img/home-1/appScreens/iPhone-3.jpg" alt="phone image" />
                    </div>
                </SwiperSlide>
                <SwiperSlide>
                    <div className="phone-slider-image">
                        <img src="/img/home-1/appScreens/iPhone-1.jpg" alt="phone image" />
                    </div>
                </SwiperSlide>
                <SwiperSlide>
                    <div className="phone-slider-image">
                        <img src="/img/home-1/appScreens/iPhone-2.jpg" alt="phone image" />
                    </div>
                </SwiperSlide>
                <SwiperSlide>
                    <div className="phone-slider-image">
                        <img src="/img/home-1/appScreens/iPhone-3.jpg" alt="phone image" />
                    </div>
                </SwiperSlide>
                <SwiperSlide>
                    <div className="phone-slider-image">
                        <img src="/img/home-1/appScreens/iPhone-1.jpg" alt="phone image" />
                    </div>
                </SwiperSlide>

            </Swiper>
            <div className="pagination -slider -white mt-48 js-pagination"></div>
        </>
    )
}