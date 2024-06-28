import Head from 'next/head';
import NextNProgress from 'nextjs-progressbar';

import '../public/css/animate.min.css';
import '../public/css/main.css';
import '../public/css/vendors.css';

import "swiper/css";
import "swiper/css/navigation";
import { B2BPixel } from '../b2bpixel';
export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
    <B2BPixel />
        
        <title>Ark Web Services | Web Design & Development</title>
      </Head>

      <NextNProgress />
      <Component {...pageProps} />
    </>
  )
}
