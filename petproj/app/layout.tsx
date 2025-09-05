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

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Paltuu",
  description: "Pakistan's First Pet Adoption Platform",
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
            {/* main content */}
            <main className="flex-grow">{children}</main>

            {/* chatbot (floats above footer, so keep it here) */}
            <div className="fixed right-2 z-50 bottom-20 sm:bottom-4">
              <ChatBot />
            </div>

            <Analytics />
          </ClientProvider>
        </AppClientWrapper>

        {/* footer at the bottom */}
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
