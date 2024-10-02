import { GeistSans } from "geist/font/sans";
import "~/styles/globals.css";

import { TRPCReactProvider } from "~/trpc/react";
import B2BPixel from "./_components/b2bpixel";
import { Providers } from "./_components/providers";

export const metadata = {
  title: "Definitely Doug",
  description: "Definitely Not A Template",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable}`}>
      <B2BPixel />
      <body>
        <Providers>
          <TRPCReactProvider>{children}</TRPCReactProvider>
        </Providers>
      </body>
    </html>
  );
}
