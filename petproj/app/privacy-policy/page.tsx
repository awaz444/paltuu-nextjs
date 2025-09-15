"use client";

import React from "react";
import Head from "next/head";
import Link from "next/link";
import { FileText, ChevronRight, Home, Printer, Shield } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy | Paltuu.pk</title>
        <meta
          name="description"
          content="Privacy Policy for Paltuu.pk: Learn how we collect, use, and protect your data while using our pet marketplace and rescue shelter services."
        />
      </Head>

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
              {/* Heading + Subtext */}
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-black font-bold mb-0">
                  Privacy Policy
                </h1>
                <p className="text-gray-700 text-xs sm:text-sm md:text-base lg:text-lg mt-1">
                  Paltuu.pk - keeping pets and people safe, informed, and
                  connected.
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
                  { id: "info-we-collect", label: "Information we collect" },
                  { id: "how-we-use", label: "How we use your information" },
                  { id: "sharing", label: "Sharing of information" },
                  { id: "rights", label: "Your rights" },
                  { id: "security", label: "Data security" },
                  { id: "cookies", label: "Cookies & tracking" },
                  { id: "children", label: "Children's privacy" },
                  { id: "changes", label: "Changes to this policy" },
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

                <section id="info-we-collect" className="scroll-mt-20">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    1. Information we collect
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    When you use Paltuu.pk (website, mobile app, and related
                    services), we may collect both information you provide
                    directly and data collected automatically. This helps us
                    operate the marketplace, support shelters, handle adoptions,
                    and connect vets and pet owners.
                  </p>
                  <ul className="list-disc pl-4 sm:pl-5 space-y-1.5 sm:space-y-2 text-gray-700 text-sm sm:text-base">
                    <li>
                      <strong>Account information:</strong> name, email, phone,
                      password, profile details.
                    </li>
                    <li>
                      <strong>Pet & listing data:</strong> pet info, images,
                      health records, adoption applications, shelter
                      submissions.
                    </li>
                    <li>
                      <strong>Marketplace & transactions:</strong>{" "}
                      billing/shipping info, order history, payment processor
                      data.
                    </li>
                    <li>
                      <strong>Rescue & shelter services:</strong> shelter
                      registrations, rescue requests, volunteer contacts.
                    </li>
                    <li>
                      <strong>Usage & device data:</strong> IP address, browser,
                      device, pages visited, interactions.
                    </li>
                    <li>
                      <strong>Cookies & tracking:</strong> used for
                      personalization, analytics, and security.
                    </li>
                  </ul>
                </section>

                <section id="how-we-use" className="scroll-mt-20 mt-6 sm:mt-10">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    2. How we use your information
                  </h2>
                  <ul className="list-disc pl-4 sm:pl-5 space-y-1.5 sm:space-y-2 text-gray-700 text-sm sm:text-base">
                    <li>To create and manage accounts and authentication.</li>
                    <li>
                      To run the pet marketplace: listings, sales, purchases,
                      and disputes.
                    </li>
                    <li>To handle adoption requests and rescue operations.</li>
                    <li>
                      To connect shelters, vets, and adopters where necessary.
                    </li>
                    <li>
                      To send updates, notifications, and (with consent)
                      marketing.
                    </li>
                    <li>
                      To prevent fraud, ensure safety, and enforce policies.
                    </li>
                    <li>
                      To analyze and improve Paltuu.pk's features and services.
                    </li>
                  </ul>
                </section>

                <section id="sharing" className="scroll-mt-20 mt-6 sm:mt-10">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    3. Sharing of information
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    We never sell your personal information. We may share data
                    with:
                  </p>
                  <ul className="list-disc pl-4 sm:pl-5 space-y-1.5 sm:space-y-2 text-gray-700 text-sm sm:text-base">
                    <li>
                      <strong>Shelters & rescues:</strong> for adoption and
                      rescue cases.
                    </li>
                    <li>
                      <strong>Buyers & sellers:</strong> to complete marketplace
                      transactions.
                    </li>
                    <li>
                      <strong>Vets & providers:</strong> for verification and
                      pet services.
                    </li>
                    <li>
                      <strong>Payment gateways & delivery partners:</strong> to
                      process transactions and shipments.
                    </li>
                    <li>
                      <strong>Authorities:</strong> when legally required or to
                      protect safety.
                    </li>
                  </ul>
                </section>

                <section id="rights" className="scroll-mt-20 mt-6 sm:mt-10">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    4. Your rights
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    You have rights including:
                  </p>
                  <ul className="list-disc pl-4 sm:pl-5 space-y-1.5 sm:space-y-2 text-gray-700 text-sm sm:text-base">
                    <li>Accessing and updating your personal data.</li>
                    <li>Requesting deletion of your information.</li>
                    <li>Opting out of marketing messages.</li>
                    <li>Managing cookies and privacy settings.</li>
                  </ul>
                  <p className="text-gray-700 text-sm sm:text-base mt-3 sm:mt-4">
                    Contact us to exercise your rights (see below).
                  </p>
                </section>

                <section id="security" className="scroll-mt-20 mt-6 sm:mt-10">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    5. Data security
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    We use encryption, secure servers, and access controls to
                    protect data. While no system is completely secure, we act
                    quickly if a breach occurs and notify affected users if
                    required.
                  </p>
                </section>

                <section id="cookies" className="scroll-mt-20 mt-6 sm:mt-10">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    6. Cookies & tracking
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    Cookies help us keep you signed in, personalize your
                    experience, and analyze traffic. You can disable cookies in
                    your browser, but some features may stop working.
                  </p>
                </section>

                <section id="children" className="scroll-mt-20 mt-6 sm:mt-10">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    7. Children's privacy
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    Paltuu.pk is not designed for children under 13. We do not
                    knowingly collect data from children. If we learn of such
                    data, we will delete it.
                  </p>
                </section>

                <section id="changes" className="scroll-mt-20 mt-6 sm:mt-10">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    8. Changes to this policy
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    We may update this Privacy Policy occasionally. Updates will
                    be posted here with a new "Last updated" date.
                  </p>
                </section>

                <section id="contact" className="scroll-mt-20 mt-6 sm:mt-10">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    9. Contact
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    If you have questions, please contact us:
                  </p>
                  <ul className="list-disc pl-4 sm:pl-5 space-y-1.5 sm:space-y-2 text-gray-700 text-sm sm:text-base">
                    <li>
                      <strong>Email:</strong>{" "}
                      <a
                        href="mailto:support@paltuu.pk"
                        className="text-primary hover:underline"
                      >
                        support@paltuu.pk
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
