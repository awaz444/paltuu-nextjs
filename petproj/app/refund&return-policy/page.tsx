"use client";

import React from "react";
import Head from "next/head";
import Link from "next/link";
import {
  FileText,
  ChevronRight,
  Home,
  Printer,
  RefreshCcw,
} from "lucide-react";

export default function ReturnRefundPolicyPage() {
  return (
    <>
      <div className="min-h-screen bg-gray-100">
        {/* Page Container */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 sm:py-8">
          {/* Header */}
          <header className="bg-white text-primary border border-primary p-4 sm:p-6 md:p-8 rounded-2xl shadow-lg mb-6 sm:mb-10">
            <div className="flex flex-row items-center gap-3 sm:gap-6">
              {/* Icon */}
              <div className="bg-primary flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl bg-white/20 flex items-center justify-center shadow-lg">
                <img
                  className="p-2 sm:p-3"
                  src="/favicon-dark.png"
                  alt="paltuu logo"
                />
              </div>

              {/* Title + Subtitle */}
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-black font-bold mb-0">
                  Return & Refund Policy
                </h1>
                <p className="text-gray-700 text-xs sm:text-sm md:text-base lg:text-lg mt-1">
                  Paltuu.pk has transparent policies to protect buyers, sellers,
                  and pets.
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
                  { id: "eligibility", label: "Eligibility for returns" },
                  { id: "process", label: "Return process" },
                  { id: "refunds", label: "Refund timelines" },
                  { id: "non-refundable", label: "Non-refundable items" },
                  { id: "cancellations", label: "Order cancellations" },
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

                <section id="overview" className="scroll-mt-20">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    1. Overview
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    At Paltuu.pk, we aim to ensure that every adoption,
                    marketplace purchase, or shelter-related transaction is
                    handled fairly and with transparency. This policy explains
                    how returns, refunds, and cancellations work on our
                    platform.
                  </p>
                </section>

                <section
                  id="eligibility"
                  className="scroll-mt-20 mt-6 sm:mt-10"
                >
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    2. Eligibility for returns
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    Returns are accepted only for eligible products purchased
                    through the marketplace. Items must be:
                  </p>
                  <ul className="list-disc pl-4 sm:pl-5 space-y-1.5 sm:space-y-2 text-gray-700 text-sm sm:text-base">
                    <li>Unused, unopened, and in original packaging.</li>
                    <li>Reported within 7 days of delivery.</li>
                    <li>
                      Products such as pet food, medicine, and hygiene products
                      are not eligible once opened.
                    </li>
                  </ul>
                </section>

                <section id="process" className="scroll-mt-20 mt-6 sm:mt-10">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    3. Return process
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    To request a return, please contact our support team with:
                  </p>
                  <ul className="list-disc pl-4 sm:pl-5 space-y-1.5 sm:space-y-2 text-gray-700 text-sm sm:text-base">
                    <li>Order ID and product details.</li>
                    <li>
                      Clear reason for return (with photos if
                      damaged/defective).
                    </li>
                    <li>Proof of purchase (receipt or confirmation email).</li>
                  </ul>
                </section>

                <section id="refunds" className="scroll-mt-20 mt-6 sm:mt-10">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    4. Refund timelines
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    Approved refunds will be processed to your original payment
                    method within 7–14 business days, depending on your
                    bank/payment provider.
                  </p>
                </section>

                <section
                  id="non-refundable"
                  className="scroll-mt-20 mt-6 sm:mt-10"
                >
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    5. Non-refundable items
                  </h2>
                  <ul className="list-disc pl-4 sm:pl-5 space-y-1.5 sm:space-y-2 text-gray-700 text-sm sm:text-base">
                    <li>
                      Adoption fees, donations, and shelter service charges.
                    </li>
                    <li>
                      Opened food, medicines, and hygiene-related products.
                    </li>
                    <li>Digital services and vet consultation fees.</li>
                  </ul>
                </section>

                <section
                  id="cancellations"
                  className="scroll-mt-20 mt-6 sm:mt-10"
                >
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    6. Order cancellations
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    Orders can be cancelled before shipping. Once dispatched,
                    you will need to follow the return process.
                  </p>
                </section>

                <section id="contact" className="scroll-mt-20 mt-6 sm:mt-10">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    7. Contact
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    For return and refund support:
                  </p>
                  <ul className="list-disc pl-4 sm:pl-5 space-y-1.5 sm:space-y-2 text-gray-700 text-sm sm:text-base">
                    <li>
                      <strong>WhatsApp Us:</strong>{" "}
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
