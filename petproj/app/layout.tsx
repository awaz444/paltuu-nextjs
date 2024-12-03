import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import ClientProvider from "./ClientProvider";
import "./globals.css";
import Footer from "@/components/Footer";
import Navbar from "@/components/navbar";
import AppClientWrapper from "@/context/AppClientWrapper";


const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Paltuu",
  description: "Pakistan's First Pet Adoption Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon-light.png" id="favicon" />
      </head>
      <body className={montserrat.className}>
    <AppClientWrapper> {/* Navbar is a Client Component */}
            <ClientProvider>{children}</ClientProvider> {/* ClientProvider wraps client-side Redux */}
            </AppClientWrapper>
        <Footer />
      </body>
    </html>
  );
}
