import NextNProgress from 'nextjs-progressbar';
import Head from 'next/head'

import '../public/css/vendors.css'
import '../public/css/animate.min.css'
import '../public/css/main.css'

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/navigation";
import Script from 'next/script';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Ark Web Services | Web Design & Development</title>
      </Head>
      <Script
                src="https://www.google.com/recaptcha/api.js?render=6Lem8CApAAAAAG__QpiKaanzep4uw7BrJ_0lwZFV"
                strategy="beforeInteractive"
            />
      <NextNProgress />
      <Component {...pageProps} />
    </>
  )
}
