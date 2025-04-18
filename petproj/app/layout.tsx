import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import ClientProvider from "./ClientProvider";
import "./globals.css";
import Footer from "@/components/footer";
import AppClientWrapper from "@/context/AppClientWrapper";
import { Analytics } from "@vercel/analytics/react";
import { Toaster } from "react-hot-toast";

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

                {/* ✅ Google AdSense Script */}
                <script
                    async
                    src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1403927121021328"
                    crossOrigin="anonymous"
                ></script>
            </head>
            <body className={montserrat.className}>
                <AppClientWrapper>
                    <ClientProvider>
                        {children}
                        <Analytics />
                    </ClientProvider>
                </AppClientWrapper>
                <Footer />
                <Toaster />
            </body>
        </html>
    );
}
