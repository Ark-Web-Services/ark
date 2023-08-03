import Link from 'next/link';

export default function Logo({ logo }) {
    return (
        <>
            <div className="header__logo">
                <Link className="base-logo" href="/">
                    <img
                        className="base-logo-first"
                        src="/img/general/logo-dark.png"
                        alt="logo"
                        style={{ width: '150px', height: '60px' }}
                    />
                    <img
                        className="base-logo-second"
                        src="/img/general/logo-dark.png"
                        alt="logo"
                        style={{ width: '150px', height: '60px' }}
                    />
                </Link>
                <Link className="menu-logo" href="/">
                    <img src="/img/general/logo-dark.png" alt="logo" style={{ width: '101px', height: '50px' }}/>
                </Link>
            </div>
        </>
    )
}