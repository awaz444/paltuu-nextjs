"use client";

import React from "react";
import Head from "next/head";
import Link from "next/link";
import { FileText, ChevronRight, Home, Printer, RefreshCcw } from "lucide-react";

export default function ReturnRefundPolicyPage(): JSX.Element {
  return (
    <>
      <Head>
        <title>Return & Refund Policy | Paltuu.pk</title>
        <meta
          name="description"
          content="Return and Refund Policy for Paltuu.pk — Learn how returns, refunds, and cancellations work on our pet marketplace."
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Page Container */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
          {/* Header */}
          <header className="bg-white text-primary border border-1 border-primary p-8 rounded-2xl shadow-lg mb-10">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="bg-primary flex-shrink-0 w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center shadow-lg">
                <img className="p-3" src="/favicon-dark.png" alt="paltuu logo" />
              </div>

              <div className="text-center md:text-left">
                <h1 className="text-3xl text-black md:text-4xl font-bold mb-2">
                  Return & Refund Policy
                </h1>
                <p className="text-black text-lg">
                  Paltuu.pk has transparent policies to protect buyers, sellers, and pets.
                </p>
              </div>
            </div>
          </header>

          {/* Body */}
          <div className="flex flex-col lg:flex-row gap-8">
            {/* TOC */}
            <aside className="lg:w-72 flex-shrink-0 bg-white rounded-2xl p-6 shadow-md h-fit sticky top-6 border border-1 border-primary">
              <div className="flex items-center gap-2 mb-6">
                <FileText className="w-5 h-5 text-primary" />
                <p className="font-semibold text-gray-800">On this page</p>
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
                      className="flex items-center gap-2 p-3 rounded-lg hover:bg-primary/5 transition-colors text-gray-700 hover:text-primary group"
                    >
                      <ChevronRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      <span className="text-sm">{item.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </aside>

            {/* Content */}
            <article className="flex-1 bg-white rounded-2xl p-8 shadow-md border border-1 border-primary">
              <div className="prose prose-primary max-w-none">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                  <span>Last updated:</span>
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">
                    January 2024
                  </span>
                </div>

                <section id="overview" className="scroll-mt-20">
                  <h2 className="flex items-center gap-3 text-2xl font-semibold text-gray-900 mb-4">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    1. Overview
                  </h2>
                  <p className="text-gray-700">
                    At Paltuu.pk, we aim to ensure that every adoption, marketplace
                    purchase, or shelter-related transaction is handled fairly and with
                    transparency. This policy explains how returns, refunds, and
                    cancellations work on our platform.
                  </p>
                </section>

                <section id="eligibility" className="scroll-mt-20 mt-10">
                  <h2 className="flex items-center gap-3 text-2xl font-semibold text-gray-900 mb-4">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    2. Eligibility for returns
                  </h2>
                  <p className="text-gray-700">
                    Returns are accepted only for eligible products purchased through
                    the marketplace. Items must be:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-gray-700">
                    <li>Unused, unopened, and in original packaging.</li>
                    <li>Reported within 7 days of delivery.</li>
                    <li>
                      Products such as pet food, medicine, and hygiene products are not
                      eligible once opened.
                    </li>
                  </ul>
                </section>

                <section id="process" className="scroll-mt-20 mt-10">
                  <h2 className="flex items-center gap-3 text-2xl font-semibold text-gray-900 mb-4">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    3. Return process
                  </h2>
                  <p className="text-gray-700">
                    To request a return, please contact our support team with:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-gray-700">
                    <li>Order ID and product details.</li>
                    <li>Clear reason for return (with photos if damaged/defective).</li>
                    <li>Proof of purchase (receipt or confirmation email).</li>
                  </ul>
                </section>

                <section id="refunds" className="scroll-mt-20 mt-10">
                  <h2 className="flex items-center gap-3 text-2xl font-semibold text-gray-900 mb-4">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    4. Refund timelines
                  </h2>
                  <p className="text-gray-700">
                    Approved refunds will be processed to your original payment method
                    within 7–14 business days, depending on your bank/payment provider.
                  </p>
                </section>

                <section id="non-refundable" className="scroll-mt-20 mt-10">
                  <h2 className="flex items-center gap-3 text-2xl font-semibold text-gray-900 mb-4">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    5. Non-refundable items
                  </h2>
                  <ul className="list-disc pl-5 space-y-2 text-gray-700">
                    <li>Adoption fees, donations, and shelter service charges.</li>
                    <li>Opened food, medicines, and hygiene-related products.</li>
                    <li>Digital services and vet consultation fees.</li>
                  </ul>
                </section>

                <section id="cancellations" className="scroll-mt-20 mt-10">
                  <h2 className="flex items-center gap-3 text-2xl font-semibold text-gray-900 mb-4">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    6. Order cancellations
                  </h2>
                  <p className="text-gray-700">
                    Orders can be cancelled before shipping. Once dispatched, you will
                    need to follow the return process.
                  </p>
                </section>

                <section id="contact" className="scroll-mt-20 mt-10">
                  <h2 className="flex items-center gap-3 text-2xl font-semibold text-gray-900 mb-4">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    7. Contact
                  </h2>
                  <p className="text-gray-700">For return and refund support:</p>
                  <ul className="list-disc pl-5 space-y-2 text-gray-700">
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

                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors shadow-md font-medium"
                  >
                    <Home className="w-5 h-5" />
                    Back to Paltuu
                  </Link>
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors shadow-md font-medium"
                  >
                    <Printer className="w-5 h-5" />
                    Print / Save
                  </button>
                </div>
              </div>
            </article>
          </div>
        </div>

        {/* Footer */}
        <footer className="px-6 py-8 bg-gray-100 text-center text-gray-600 mt-12">
          <div className="max-w-6xl mx-auto">
            <p>© {new Date().getFullYear()} Paltuu.pk. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
