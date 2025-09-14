"use client";

import React from "react";
import Head from "next/head";
import Link from "next/link";
import { FileText, ChevronRight, Home, Printer } from "lucide-react";

const TermsAndConditionsPage = () => {
  return (
    <>
      <Head>
        <title>Terms & Conditions | Paltuu.pk</title>
        <meta
          name="description"
          content="Terms & Conditions for Paltuu.pk — Pakistan's first dedicated pet adoption platform and marketplace."
        />
      </Head>

      <div className="min-h-screen bg-gray-100">
        {/* Page Container */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 sm:py-8">
          {/* Header */}
          <header className="bg-white text-primary border border-primary p-4 sm:p-6 md:p-8 rounded-2xl shadow-lg mb-6 sm:mb-10">
            <div className="flex flex-row items-center gap-3 sm:gap-6">
              <div className="bg-primary flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl bg-white/20 flex items-center justify-center shadow-lg">
                <img
                  className="p-2 sm:p-3"
                  src="/favicon-dark.png"
                  alt="paltuu logo"
                />
              </div>

              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-black mb-0">
                  Terms & Conditions
                </h1>
                <p className="text-gray-700 text-xs sm:text-sm md:text-base lg:text-lg mt-1">
                  Welcome to Paltuu.pk. By accessing or using our services, you
                  agree to comply with our terms.
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
                  { id: "general", label: "General Terms" },
                  { id: "services", label: "Use of Services" },
                  { id: "marketplace", label: "Marketplace Transactions" },
                  { id: "adoption", label: "Pet Adoption & Rescue" },
                  { id: "liability", label: "Liability" },
                  { id: "changes", label: "Changes to Terms" },
                  { id: "contact", label: "Contact Us" },
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
                <section id="general" className="scroll-mt-20">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    1. General Terms
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    Paltuu.pk is Pakistan's first dedicated pet adoption
                    platform and marketplace. By using our site, you confirm
                    that you are at least 18 years old or accessing under
                    supervision of a guardian.
                  </p>
                </section>

                <section id="services" className="scroll-mt-20 mt-6 sm:mt-10">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    2. Use of Services
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    Our services include pet adoption, marketplace for
                    pet-related products, and collaboration with rescue shelters
                    and givers. You agree not to misuse our platform for illegal
                    activities, fraudulent listings, or harmful practices
                    towards animals.
                  </p>
                </section>

                <section
                  id="marketplace"
                  className="scroll-mt-20 mt-6 sm:mt-10"
                >
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    3. Marketplace Transactions
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    All purchases on our marketplace are subject to product
                    availability and seller policies. Paltuu.pk acts as a
                    facilitator and is not liable for disputes between buyers
                    and sellers, but we may intervene in case of policy
                    violations.
                  </p>
                </section>

                <section id="adoption" className="scroll-mt-20 mt-6 sm:mt-10">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-2">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    4. Pet Adoption & Rescue Shelters
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    Adoption services involve coordination between adopters,
                    rescue shelters, and pet givers. We do not guarantee health,
                    behavior, or suitability of pets. Adopters are encouraged to
                    visit shelters, verify pet information, and ensure they are
                    capable of responsible ownership.
                  </p>
                </section>

                <section id="liability" className="scroll-mt-20 mt-6 sm:mt-10">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    5. Liability
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    Paltuu.pk will not be responsible for direct or indirect
                    damages arising from misuse of the platform, delivery
                    issues, or adoption arrangements. Responsibility lies with
                    the buyer, adopter, or seller involved.
                  </p>
                </section>

                <section id="changes" className="scroll-mt-20 mt-6 sm:mt-10">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    6. Changes to Terms
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    We may update these Terms & Conditions at any time.
                    Continued use of Paltuu.pk after updates constitutes
                    acceptance of the new terms.
                  </p>
                </section>

                <section id="contact" className="scroll-mt-20 mt-6 sm:mt-10">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    7. Contact Us
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    For questions regarding these Terms & Conditions, please
                    contact us at:
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
};

export default TermsAndConditionsPage;
