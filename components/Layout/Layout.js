import { useEffect, useState } from 'react'

import Footer from './Footer/Footer'
import Header1 from './Header/Header'

export default function Layout({ children, navColor, logo, verticalLine }) {
    const [scroll, setScroll] = useState(0)
    const [navToggled, setNavToggled] = useState(false);
    const navHandle = () => setNavToggled(!navToggled);
    useEffect(() => {
        document.addEventListener("scroll", () => {
            const scrollCheck = window.scrollY > 100
            if (scrollCheck !== scroll) {
                setScroll(scrollCheck)
            }
        })
    })
    return (
        <>
            <div className="barba-container">
                <main className='main-content'>
                    < Header1 navColor={navColor} scroll={scroll} logo={logo} navToggled={navToggled} navHandle={navHandle} />


                    {verticalLine &&
                        <div className="lines -vertical-lines">
                            <span></span>
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    }
                    <div className="content-wrapper  js-content-wrapper">
                        {children}
                    </div>

                    < Footer />

                </main>
            </div>
        </>
    )
}