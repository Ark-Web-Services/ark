import { GeistSans } from "geist/font/sans";
import "~/styles/globals.css";

import { TRPCReactProvider } from "~/trpc/react";
import { Providers } from "./_components/providers";

export const metadata = {
  title: "ARK Web Services | Web Design, Branding & SEO for Service Businesses",
  description: "ARK Web Services helps service businesses build high-converting websites, stronger brands, and SEO foundations that drive inbound leads.",
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
