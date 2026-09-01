import type { Metadata } from "next";
import AppLinksClient from "./AppLinksClient";

// Static, shareable "get the app" landing page — no DB work, so it can be
// statically rendered and cached at the edge.
export const metadata: Metadata = {
  title: "Get the App",
  description:
    "Download the Paltuu app for iPhone and Android — adopt pets, book at-home vet visits in Karachi, shop pet essentials, and help reunite lost pets.",
  alternates: { canonical: "/app" },
  openGraph: {
    title: "Get the Paltuu App",
    description:
      "Download Paltuu for iOS and Android — Pakistan's pet adoption and care platform.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Get the Paltuu App",
    description: "Download Paltuu for iOS and Android.",
  },
};

export default function AppLandingPage() {
  return <AppLinksClient />;
}
