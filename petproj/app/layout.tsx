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
import ApplyThemeColor from "@/components/ApplyThemeColor";
import PageTransition from "@/components/PageTransition";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import PWARegister from "@/components/PWARegister";
import CartSyncProvider from "@/components/CartSyncProvider";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Paltuu - Pakistan's First Pet Adoption Platform",
    template: "%s | Paltuu",
  },
  description:
    "Buy pet products online in Pakistan at Paltuu.pk. Shop food, accessories & grooming essentials, plus adopt or foster pets and connect with vets in Karachi, Lahore & Islamabad.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Paltuu",
  },
};

export const viewport = {
  themeColor: "#A03048",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon-maroon.png" id="favicon" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-status-bar-style" content="default" />
        <meta name="mobile-web-app-title" content="Paltuu" />
        
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1403927121021328"
          crossOrigin="anonymous"
        ></script>
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
            <CartSyncProvider>
              <ApplyThemeColor />
              <ThemeInitializer />
              <PWARegister />
              <NavbarWrapper />

              <main className="flex-grow">
                <PageTransition>
                  {children}
                </PageTransition>
              </main>

              <div className="fixed right-2 z-[998] bottom-20 sm:bottom-4">
                <ChatBot />
              </div>
              <PWAInstallPrompt />
              <Analytics />
            </CartSyncProvider>
          </ClientProvider>
        </AppClientWrapper>

        <Footer />
        <Toaster />
      </body>
    </html>
  );
}