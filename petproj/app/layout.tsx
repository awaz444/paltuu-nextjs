// app/layout.tsx
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import ClientProvider from "./ClientProvider"; // Import your ClientProvider
import "./globals.css";
import Footer from "@/components/footer";

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
            <body className={montserrat.className}>
                <ClientProvider>{children}</ClientProvider>
                <Footer />
            </body>
        </html>
    );
}
