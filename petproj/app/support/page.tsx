"use client";

import React from "react";
import Head from "next/head";
import Link from "next/link";
import {
  Mail,
  Home,
  HelpCircle,
  MessageCircle,
  Trash2,
  ShieldCheck,
  FileText,
} from "lucide-react";

const faqs = [
  {
    question: "How do I contact Paltuu support?",
    answer:
      'Email us at support@paltuu.pk and we will get back to you within 2 business days.',
  },
  {
    question: "How do I delete my account?",
    answer:
      'You can delete your account from Profile → Settings → Delete Account in the app, or by emailing support@paltuu.pk. See our Delete Account page for full details.',
  },
  {
    question: "I found a bug or the app is crashing. What should I do?",
    answer:
      'Email support@paltuu.pk with your device model, OS version, and a short description of what happened. Screenshots or screen recordings help us fix it faster.',
  },
  {
    question: "How do I report a listing, user, or lost & found post?",
    answer:
      'Use the report option available on the listing or profile inside the app. For anything urgent, email support@paltuu.pk.',
  },
];

const links = [
  { href: "/privacy-policy", label: "Privacy Policy", icon: ShieldCheck },
  { href: "/terms-and-conditions", label: "Terms & Conditions", icon: FileText },
  { href: "/delete-account", label: "Delete Account", icon: Trash2 },
];

export default function SupportPage() {
  return (
    <>
      <Head>
        <title>Support | Paltuu.pk</title>
        <meta
          name="description"
          content="Get help with the Paltuu app. Contact support, find answers to common questions, and access account and policy pages."
        />
      </Head>

      <div className="min-h-screen bg-gray-100">
        <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 sm:py-8">
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
                  Support
                </h1>
                <p className="text-gray-700 text-xs sm:text-sm md:text-base lg:text-lg mt-1">
                  Paltuu.pk — help and contact for the Paltuu app
                </p>
              </div>
            </div>
          </header>

          {/* Contact card */}
          <section className="bg-white rounded-2xl p-5 sm:p-8 shadow-md border border-primary mb-6 sm:mb-8">
            <h2 className="flex items-center gap-2 text-lg sm:text-2xl font-semibold text-gray-900 mb-4">
              <Mail className="w-5 h-5 text-primary" />
              Contact us
            </h2>
            <p className="text-gray-700 text-sm sm:text-base mb-2">
              For any questions, issues, or feedback about the Paltuu app, email us at{" "}
              <a
                href="mailto:support@paltuu.pk"
                className="text-primary font-medium hover:underline"
              >
                support@paltuu.pk
              </a>
              .
            </p>
            <p className="text-gray-600 text-sm">
              We typically respond within 2 business days.
            </p>
          </section>

          {/* FAQ */}
          <section className="bg-white rounded-2xl p-5 sm:p-8 shadow-md border border-primary mb-6 sm:mb-8">
            <h2 className="flex items-center gap-2 text-lg sm:text-2xl font-semibold text-gray-900 mb-6">
              <HelpCircle className="w-5 h-5 text-primary" />
              Frequently asked questions
            </h2>
            <div className="space-y-5">
              {faqs.map((faq, index) => (
                <div key={index}>
                  <p className="flex items-start gap-2 font-semibold text-gray-800 text-sm sm:text-base">
                    <MessageCircle className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    {faq.question}
                  </p>
                  <p className="text-gray-600 text-sm mt-1 ml-6">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Related links */}
          <section className="bg-white rounded-2xl p-5 sm:p-8 shadow-md border border-primary mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-2xl font-semibold text-gray-900 mb-4">
              Related pages
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              {links.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors shadow-md font-medium text-sm sm:text-base"
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  {label}
                </Link>
              ))}
            </div>
          </section>

          {/* Footer action */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors shadow-md font-medium text-sm sm:text-base"
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5" />
              Back to Paltuu
            </Link>
          </div>
        </div>

        <footer className="px-4 sm:px-6 py-6 sm:py-8 bg-gray-100 text-center text-gray-600 mt-2 text-xs sm:text-sm">
          <div className="max-w-4xl mx-auto">
            <p>© {new Date().getFullYear()} Paltuu.pk. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
