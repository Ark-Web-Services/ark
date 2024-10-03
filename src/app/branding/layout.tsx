import "~/styles/globals.css";

import Header from "../_components/Header";

export const metadata = {
  title: "Ark Web Studio",
  description: "Global leader in web design and innovation, driving brand growth.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
