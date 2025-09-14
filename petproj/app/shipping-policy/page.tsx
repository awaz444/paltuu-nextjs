"use client";

import React from "react";
import Head from "next/head";
import Link from "next/link";
import { FileText, ChevronRight, Home, Printer } from "lucide-react";

export default function ShippingPolicyPage(): JSX.Element {
  return (
    <>
      <Head>
        <title>Shipping & Service Policy | Paltuu.pk</title>
        <meta
          name="description"
          content="Shipping & Service Policy for Paltuu.pk — Learn how product shipping, pet deliveries, and shelter services are handled."
        />
      </Head>

      <div className="min-h-screen bg-gray-100">
        {/* Page Container */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 sm:py-8">
          {/* Header */}
          <header className="bg-white text-primary border border-primary p-4 sm:p-6 md:p-8 rounded-2xl shadow-lg mb-6 sm:mb-10">
            <div className="flex flex-row items-center gap-3 sm:gap-6">
              {/* Logo */}
              <div className="bg-primary flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl bg-white/20 flex items-center justify-center shadow-lg">
                <img
                  className="p-2 sm:p-3"
                  src="/favicon-dark.png"
                  alt="paltuu logo"
                />
              </div>

              {/* Heading + Subtext */}
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-black font-bold mb-0">
                  Shipping & Service Policy
                </h1>
                <p className="text-gray-700 text-xs sm:text-sm md:text-base lg:text-lg mt-1">
                  Learn how we deliver products, pets, and services at
                  Paltuu.pk.
                </p>
              </div>
            </div>
          </header>

          {/* Body */}
          <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
            {/* TOC */}
            <aside className="hidden lg:block lg:w-72 flex-shrink-0 bg-white rounded-2xl p-6 shadow-md h-fit sticky top-6 border border-primary">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5 text-primary" />
                <p className="font-semibold text-gray-800 text-sm">
                  On this page
                </p>
              </div>
              <ul className="space-y-3">
                {[
                  { id: "overview", label: "Overview" },
                  { id: "ecommerce", label: "Product shipping" },
                  { id: "pet-delivery", label: "Pet adoption delivery" },
                  { id: "shelters", label: "For shelters & givers" },
                  { id: "fees", label: "Shipping & service fees" },
                  { id: "contact", label: "Contact" },
                ].map((item) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-primary/5 transition-colors text-gray-700 hover:text-primary group text-sm"
                    >
                      <ChevronRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span>{item.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </aside>

            {/* Content */}
            <article className="flex-1 bg-white rounded-2xl p-5 sm:p-8 shadow-md border border-primary">
              <div className="prose prose-primary max-w-none">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">
                  <span>Last updated:</span>
                  <span className="bg-primary/10 text-primary px-2 py-0.5 sm:px-3 sm:py-1 rounded-full">
                    January 2024
                  </span>
                </div>

                {/* Sections */}
                <section id="overview" className="scroll-mt-20">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    1. Overview
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    At Paltuu.pk, we handle shipping for both marketplace
                    products and pet adoption services with care and
                    transparency. This policy outlines delivery timelines,
                    responsibilities, and conditions for all services.
                  </p>
                </section>

                <section id="ecommerce" className="scroll-mt-20 mt-6 sm:mt-10">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    2. Product shipping
                  </h2>
                  <ul className="list-disc pl-4 sm:pl-5 space-y-1.5 sm:space-y-2 text-gray-700 text-sm sm:text-base">
                    <li>Orders processed within 24–48 business hours.</li>
                    <li>Delivery time 2–5 business days across Pakistan.</li>
                    <li>Shipping charges calculated at checkout.</li>
                    <li>Delays will be communicated via SMS or email.</li>
                  </ul>
                </section>

                <section
                  id="pet-delivery"
                  className="scroll-mt-20 mt-6 sm:mt-10"
                >
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    3. Pet adoption delivery
                  </h2>
                  <ul className="list-disc pl-4 sm:pl-5 space-y-1.5 sm:space-y-2 text-gray-700 text-sm sm:text-base">
                    <li>
                      Pets are handed over at safe, agreed locations or verified
                      addresses.
                    </li>
                    <li>
                      Transported in safe carriers with proper ventilation.
                    </li>
                    <li>
                      Health and vaccination checks are required before
                      delivery.
                    </li>
                    <li>
                      Adopters may pay a minimal transport/service fee depending
                      on distance.
                    </li>
                  </ul>
                </section>

                <section id="shelters" className="scroll-mt-20 mt-6 sm:mt-10">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    4. For rescue shelters & givers
                  </h2>
                  <ul className="list-disc pl-4 sm:pl-5 space-y-1.5 sm:space-y-2 text-gray-700 text-sm sm:text-base">
                    <li>
                      Pets should be healthy and fit for adoption transfer.
                    </li>
                    <li>Provide vaccination/health documents if available.</li>
                    <li>
                      Coordinate with adopters or our team for delivery
                      scheduling.
                    </li>
                    <li>
                      Any special needs must be disclosed before handover.
                    </li>
                  </ul>
                </section>

                <section id="fees" className="scroll-mt-20 mt-6 sm:mt-10">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    5. Shipping & service fees
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    Shipping charges for products are shown at checkout.
                    Adoption service or transport fees depend on distance, pet
                    size, and arrangements with shelters/givers. All costs are
                    communicated upfront.
                  </p>
                </section>

                <section id="contact" className="scroll-mt-20 mt-6 sm:mt-10">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    6. Contact
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    For shipping and delivery support:
                  </p>
                  <ul className="list-disc pl-4 sm:pl-5 space-y-1.5 sm:space-y-2 text-gray-700 text-sm sm:text-base">
                    <li>
                      <strong>Whatsapp Us:</strong>{" "}
                      <a
                        href="https://wa.me/+923394022568"
                        className="text-primary hover:underline"
                      >
                        +923394022568
                      </a>
                    </li>
                    <li>
                      <strong>Website:</strong>{" "}
                      <a
                        href="https://www.paltuu.pk"
                        className="text-primary hover:underline"
                      >
                        www.paltuu.pk
                      </a>
                    </li>
                  </ul>
                </section>

                {/* Buttons */}
                <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors shadow-md font-medium text-sm sm:text-base"
                  >
                    <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                    Back to Paltuu
                  </Link>
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors shadow-md font-medium text-sm sm:text-base"
                  >
                    <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
                    Print / Save
                  </button>
                </div>
              </div>
            </article>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-4 sm:px-6 py-6 sm:py-8 bg-gray-100 text-center text-gray-600 mt-8 sm:mt-12 text-xs sm:text-sm">
          <div className="max-w-6xl mx-auto">
            <p>© {new Date().getFullYear()} Paltuu.pk. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
