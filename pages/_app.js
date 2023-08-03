import NextNProgress from 'nextjs-progressbar';
import Head from 'next/head'

import '../public/css/vendors.css'
import '../public/css/animate.min.css'
import '../public/css/main.css'

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/navigation";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Ark Web Services | Web Design & Development</title>
      </Head>
      <NextNProgress />
      <Component {...pageProps} />
    </>
  )
}
