"use client";

import React from "react";
import Head from "next/head";
import Link from "next/link";
import { FileText, ChevronRight, Home, Printer, ShieldAlert } from "lucide-react";

export default function ChildSafetyPage() {
  return (
    <>
      <Head>
        <title>Child Safety Standards | Paltuu.pk</title>
        <meta
          name="description"
          content="Paltuu's zero-tolerance policy against Child Sexual Abuse and Exploitation (CSAE) and Child Sexual Abuse Material (CSAM)."
        />
      </Head>

      <div className="min-h-screen bg-gray-100">
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
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-black font-bold mb-0">
                  Child Safety Standards
                </h1>
                <p className="text-gray-700 text-xs sm:text-sm md:text-base lg:text-lg mt-1">
                  Paltuu.pk — zero tolerance for content that exploits or endangers children.
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
                <p className="font-semibold text-gray-800 text-sm">On this page</p>
              </div>
              <ul className="space-y-3">
                {[
                  { id: "zero-tolerance", label: "Zero-Tolerance Policy" },
                  { id: "reporting", label: "Reporting and Enforcement" },
                  { id: "contact", label: "Contact Information" },
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
                    June 2026
                  </span>
                </div>

                <p className="text-gray-700 text-sm sm:text-base mb-6 sm:mb-8">
                  Paltuu is committed to maintaining a safe environment for all users. We have a strict, zero-tolerance policy against Child Sexual Abuse and Exploitation (CSAE) and Child Sexual Abuse Material (CSAM).
                </p>

                <section id="zero-tolerance" className="scroll-mt-20">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    Zero-Tolerance Policy
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    We do not allow any content that exploits or endangers children. Any accounts found uploading, sharing, or promoting CSAM will be immediately terminated, the content will be removed, and the incident will be reported to the relevant national authorities and the National Center for Missing &amp; Exploited Children (NCMEC).
                  </p>
                </section>

                <section id="reporting" className="scroll-mt-20 mt-6 sm:mt-10">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    Reporting and Enforcement
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    Users can report any concerning content directly within the Paltuu app using the &quot;Report&quot; feature attached to every post and profile. Our moderation team reviews all reports promptly and takes appropriate action to ensure the safety of our community.
                  </p>
                </section>

                <section id="contact" className="scroll-mt-20 mt-6 sm:mt-10">
                  <h2 className="flex items-center gap-2 sm:gap-3 text-lg sm:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full"></div>
                    Contact Information
                  </h2>
                  <p className="text-gray-700 text-sm sm:text-base">
                    For urgent matters regarding child safety on our platform, please contact our designated safety officer:
                  </p>
                  <ul className="list-disc pl-4 sm:pl-5 space-y-1.5 sm:space-y-2 text-gray-700 text-sm sm:text-base mt-3">
                    <li>
                      <strong>Email:</strong>{" "}
                      <a
                        href="mailto:safety@paltuu.pk"
                        className="text-primary hover:underline"
                      >
                        safety@paltuu.pk
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
