import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import ClientProvider from "./ClientProvider";
import "./globals.css";
import Footer from "@/components/footer";
import ChatBot from "@/components/ChatBot";
import AppClientWrapper from "@/context/AppClientWrapper";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "react-hot-toast";
import Script from "next/script";
import NavbarWrapper from "@/components/NavbarWrapper";
import ThemeInitializer from "./ThemeInitializer";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Paltuu - Pakistan's First Pet Adoption Platform",
    template: "%s | Paltuu" // This will be overridden by page titles
  },
  description: "Pakistan's First Pet Adoption Platform - Find pets, products, and everything for your furry friends",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon-light.png" id="favicon" />

        {/* ✅ Primary color bootstrapped BEFORE hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var user = localStorage.getItem("user");
                  var parsed = user ? JSON.parse(user) : null;
                  var color = parsed?.primaryColor || "#A03048";
                  document.documentElement.style.setProperty("--primary-color", color);
                } catch (e) {
                  document.documentElement.style.setProperty("--primary-color", "#A03048");
                }
              })();
            `,
          }}
        />

        {/* Google AdSense Script */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1403927121021328"
          crossOrigin="anonymous"
        ></script>

        {/* Google Analytics Script */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-724EM6FN42"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-724EM6FN42');
          `}
        </Script>
      </head>
      <body className={`${montserrat.className} flex flex-col min-h-screen`}>
        <AppClientWrapper>
          <ClientProvider>
            {/* ✅ ThemeInitializer still here to handle dynamic updates */}
            <ThemeInitializer />
            <NavbarWrapper />

            <main className="flex-grow">{children}</main>

            <div className="fixed right-2 z-[999] bottom-20 sm:bottom-4">
              <ChatBot />
            </div>
            <Analytics />
          </ClientProvider>
        </AppClientWrapper>

        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
