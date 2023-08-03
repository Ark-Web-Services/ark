export default function AboutOne() {
  return (
    <>
      <section className="layout-pt-sm layout-pb-sm overflow-visible">
        <div className="container">
          <div className="row justify-center text-center">
            <div className="col-auto">
              <div className="sectionHeading">
                <div className="sectionHeading__subtitle wow animate__animated animate__fadeInUp">
                  <span>What We Do</span>
                </div>
                <h2 className="sectionHeading__title wow animate__animated animate__fadeInUp">
                  Web Design & Development
                </h2>
              </div>
            </div>
          </div>
          <div className="row y-gap-32 pt-80 md:pt-60 sm:pt-24">
            <div className="col-md-6 wow animate__animated animate__fadeInUp">
              <div className="d-flex rounded-8 py-40 pr-60 pl-50 md:px-34 md:py-34 sm:px-30 sm:py-30 md:direction-column bg-white shadow-card hover-up">
                <div className="mr-48 md:mr-0">
                <img src="/img/home-1/company/pen-tool.svg" alt="icon" />
                </div>
                <div className="md:mt-20">
                  <h4 className="text-xl fw-600 lh-1">Web Design</h4>
                  <p className="mt-20 md:mt-12">
                  Each website serves a unique role. Often, sites are aesthetically pleasing as a business showcase or purpose-driven, targeting leads and conversions.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6 wow animate__animated animate__fadeInUp">
              <div className="d-flex rounded-8 py-40 pr-60 pl-50 md:px-34 md:py-34 sm:px-30 sm:py-30 md:direction-column bg-white shadow-card hover-up">
                <div className="mr-48 md:mr-0">
                  <img src="/img/home-1/company/cloud-storage.svg" alt="icon" />
                </div>
                <div className="md:mt-20">
                  <h4 className="text-xl fw-600 lh-1">E-Commerce</h4>
                  <p className="mt-20 md:mt-12">
                  For businesses selling tangible and virtual goods online, with capabilities to oversee inventory, process transactions, and offer customer aid.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6 wow animate__animated animate__fadeInUp">
              <div className="d-flex rounded-8 py-40 pr-60 pl-50 md:px-34 md:py-34 sm:px-30 sm:py-30 md:direction-column bg-white shadow-card hover-up">
                <div className="mr-48 md:mr-0">
                <img src="/img/home-1/company/timer.svg" alt="icon" />  
                </div>
                <div className="md:mt-20">
                  <h4 className="text-xl fw-600 lh-1">Web Apps</h4>
                  <p className="mt-20 md:mt-12">
                  These are intricate, merging aesthetic allure and goal-driven aims with added backend features like client portals, online directories, and dashboard interfaces.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-6 wow animate__animated animate__fadeInUp">
              <div className="d-flex rounded-8 py-40 pr-60 pl-50 md:px-34 md:py-34 sm:px-30 sm:py-30 md:direction-column bg-white shadow-card hover-up">
                <div className="mr-48 md:mr-0">
                <img src="/img/home-1/company/touch.svg" alt="icon" />
                </div>
                <div className="md:mt-20">
                  <h4 className="text-xl fw-600 lh-1">Custom Development</h4>
                  <p className="mt-20 md:mt-12">
                  These sites are entirely bespoke, inside and out. They're the most complex, time-intensive, and purpose-driven. If you dream it, we can create it.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
