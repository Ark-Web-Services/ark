import Layout from '@/components/layout/Layout';
import Link from 'next/link';

export default function Page404() {
    return (
        <>
            <Layout>
                <section className="no-page relative">
                    <div className="no-page__bg">
                        <img src="/img/general/bg.png" alt="image" />
                    </div>
                    <div className="container">
                        <div className="row justify-center items-center">
                            <div className="col-12">
                                <div className="no-page__content text-center">
                                    <h1 className="no-page__title">404</h1>
                                    <h3 className="no-page__subtitle text-3xl fw-700">Oops...</h3>
                                    <p className="mt-30">We're sorry, but something went wrong.</p>
                                    <div className="no-page__button mt-30">
                                        <Link href="/" className="button col-lg-3 -md -accent -uppercase text-white">Back to homepage</Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </Layout>
        </>
    )
}