import Image from "next/image";
import Link from "next/link";
export default function Logo({ logo }) {
  return (
    <>
      <div className="header__logo">
        <Link className="base-logo" href="/">
          <Image
            className="base-logo-first"
            src={`/img/general/${logo ? logo : "logo"}.svg`}
            alt="logo"
            height={50}
            width={100}
          />
          <Image
            className="base-logo-second"
            src="/img/general/logo-dark.svg"
            alt="logo"
            height={50}
            width={100}
          />
        </Link>
        <Link className="menu-logo" href="/">
          <Image
            src="/img/general/logo-dark.svg"
            alt="logo"
            height={50}
            width={100}
          />
        </Link>
      </div>
    </>
  );
}
