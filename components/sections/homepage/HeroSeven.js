import Link from "next/link";

export default function HeroSeven() {
  return (
    <>
      <section className="masthead -type-7 overflow-hidden">
        <div className="masthead__bg">
          <img src="/img/home-7/header/bg.png" alt="image" />
        </div>
        <div className="container">
          <div className="row items-center y-gap-64 md:justify-center">
            <div className="col-xl-7 col-lg-9 col-md-10">
              <div className="masthead__content md:text-center relative z-2">
                <h1 className="masthead__title text-white">
                  The #1 Custom <br />
                  Memory Book
                </h1>
                <p className="masthead__text text-white pt-24">
                  Remind your loved ones how much
                  <br className="sm:d-none" /> you love them.
                </p>
                <div className="masthead__buttons row y-gap-20 x-gap-24 md:justify-center items-center pt-40 sm:pt-24">
                  <div className="col-auto">
                    <Link
                      href="/contact/contact-3"
                      className="button -md -orange-2 text-white"
                    >
                      Learn More
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-auto">
              <div className="masthead__image relative z-1">
                <div className="atropos -no-shadow -no-highlight js-atropos">
                  <div className="atropos-scale">
                    <div className="atropos-rotate">
                      <div className="atropos-inner overflow-visible d-flex justify-end">
                        <img
                          data-atropos-offset={0}
                          src="/img/home-7/header/circles.svg"
                          alt="image"
                        />
                        <img
                          data-atropos-offset={2}
                          src="/img/home-7/header/family-enjoying-memory-album.png"
                          alt="image"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
