import Link from 'next/link';
import { useState } from 'react';
import * as Icon from 'react-feather';


export default function MenuMobile({ navColor, navToggled }) {
    const [navToggledMobileSubmenu, setnavToggledMobileSubmenu] = useState({
        status: false,
        key: "",
    }
    );
    const navHandleMobile = (key) => {
        if (navToggledMobileSubmenu.key === key) {
            setnavToggledMobileSubmenu({
                status: false,
            });
        } else {
            setnavToggledMobileSubmenu({
                status: true,
                key,
            });
        }
    };

    return (
        <>
            <div className={`menu d-none js-menu ${navToggled ? "is-active mobile-menu-open" : ""}`}>
                <div className="menu__container">
                    <div className="mobile__back js-nav-list-back pointer-events-none" style={navToggled ? { opacity: 0, transform: 'translate(0px, -16px)' } : null}>
                        <Link href="#">Home</Link>
                    </div>

                    <ul className={`nav js-navList ${navToggled ? "is-active is-list-displayed" : ""}`}>
                        <li className={`${navColor}`}>
                            <Link href="/">
                                Home
                            </Link>
                        </li>
                        <li className={`${navColor}`}>
                            <Link href="/about">
                                About
                            </Link>
                        </li>
                        <li className={`${navColor}`}>
                            <Link href="/services">
                                Services
                            </Link>
                        </li>
                        {/* <li className={`${navColor}`}>
                            <Link href="/casestudies">
                                Case Studies
                            </Link>
                        </li> */}
                        <li className={`${navColor}`}>
                            <Link href="/portfolio">
                                Portfolio
                            </Link>
                        </li>
                    </ul>
                </div>
                <div className="mobile__footer js-mobile-footer">
                    <div className="mobile__copyright">
                        <p>© Copyright 2023. Sassio - NextJS</p>
                    </div>
                    <div className="mobile__socials">
                        <Link href="/#">
                            <i className="fa fa-facebook" aria-hidden="true" />
                        </Link>
                        <Link href="/#">
                            <i className="fa fa-twitter" aria-hidden="true" />
                        </Link>
                        <Link href="/#">
                            <i className="fa fa-instagram" aria-hidden="true" />
                        </Link>
                        <Link href="/#">
                            <i className="fa fa-linkedin" aria-hidden="true" />
                        </Link>
                    </div>
                </div>
            </div>
        </>
    )
}