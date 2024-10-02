import { GeistSans } from "geist/font/sans";
import "~/styles/globals.css";

import { TRPCReactProvider } from "~/trpc/react";
import { Providers } from "./_components/providers";

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
    <html lang="en" className={`${GeistSans.variable}`}>
      <body>
        <Providers>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </Providers>
      </body>
    </html>
  );
}
