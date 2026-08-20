"use client";

import React from "react";
import Head from "next/head";
import Link from "next/link";
import { FileText, ChevronRight, Home, Printer, Shield } from "lucide-react";

export default function AppPrivacyPolicyPage() {
  return (
    <>
      <Head>
        <title>App Privacy Policy | Paltuu.pk</title>
        <meta
          name="description"
          content="Privacy Policy for the Paltuu mobile app."
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
                  App Privacy Policy
                </h1>
                <p className="text-gray-700 text-xs sm:text-sm md:text-base lg:text-lg mt-1">
                  How the Paltuu mobile app handles your data.
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
                  { id: "how-we-use", label: "How we use it" },
                  { id: "sharing", label: "Sharing" },
                  { id: "rights", label: "Your rights" },
                  { id: "security", label: "Security" },
                  { id: "children", label: "Children" },
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
                    August 2026
                  </span>
                </div>

                <p className="text-gray-700 text-sm sm:text-base mb-6 sm:mb-8">
                  This policy explains what the Paltuu app collects and how
                  we use it. For our website's privacy policy, see{" "}
                  <Link href="/privacy-policy" className="text-primary hover:underline">
                    here
                  </Link>
                  .
                </p>

                <section id="info-we-collect" className="scroll-mt-20">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    1. Information we collect
                  </h2>
                  <ul className="list-disc pl-4 sm:pl-5 space-y-1.5 sm:space-y-2 text-gray-700 text-sm sm:text-base">
                    <li>
                      <strong>Account info:</strong> name, email, phone, and
                      profile details.
                    </li>
                    <li>
                      <strong>Content you post:</strong> pet profiles,
                      photos, videos, comments, and adoption applications.
                    </li>
                    <li>
                      <strong>Location:</strong> only if you allow it, to
                      show pets, vets, and shelters near you.
                    </li>
                    <li>
                      <strong>Camera, photos & notifications:</strong> used
                      only when you use those features, and only with your
                      permission.
                    </li>
                    <li>
                      <strong>Sign-in info:</strong> your name and email if
                      you sign in with Google or Apple — never your
                      password.
                    </li>
                  </ul>
                </section>

                <section id="how-we-use" className="scroll-mt-20 mt-6 sm:mt-10">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    2. How we use it
                  </h2>
                  <ul className="list-disc pl-4 sm:pl-5 space-y-1.5 sm:space-y-2 text-gray-700 text-sm sm:text-base">
                    <li>To run your account and the social feed.</li>
                    <li>To connect you with shelters, rescues, and vets.</li>
                    <li>To show nearby pets, vets, and shelters.</li>
                    <li>To send you relevant notifications.</li>
                    <li>To keep the app safe and enforce our Community Guidelines.</li>
                  </ul>
                </section>

                <section id="sharing" className="scroll-mt-20 mt-6 sm:mt-10">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    3. Sharing
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    We never sell your data. Your public profile and posts
                    are visible to other users. We share information with
                    shelters/rescues when you apply to adopt, and with
                    authorities only when legally required.
                  </p>
                </section>

                <section id="rights" className="scroll-mt-20 mt-6 sm:mt-10">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    4. Your rights
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    You can update your info anytime in the app. To delete
                    your account and data, go to Profile → Settings, or
                    email{" "}
                    <a
                      href="mailto:support@paltuu.pk"
                      className="text-primary hover:underline"
                    >
                      support@paltuu.pk
                    </a>
                    .
                  </p>
                </section>

                <section id="security" className="scroll-mt-20 mt-6 sm:mt-10">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    5. Security
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    We use encryption and secure servers to protect your
                    data. No system is 100% secure, but we take it
                    seriously and act quickly if anything goes wrong.
                  </p>
                </section>

                <section id="children" className="scroll-mt-20 mt-6 sm:mt-10">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    6. Children
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    Paltuu isn't for children under 13. We don't knowingly
                    collect data from kids, and delete it if we find out we
                    have.
                  </p>
                </section>

                <section id="contact" className="scroll-mt-20 mt-6 sm:mt-10">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    7. Contact
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    Questions? Email us at{" "}
                    <a
                      href="mailto:support@paltuu.pk"
                      className="text-primary hover:underline"
                    >
                      support@paltuu.pk
                    </a>
                    .
                  </p>
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
