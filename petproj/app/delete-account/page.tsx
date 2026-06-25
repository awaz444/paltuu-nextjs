"use client";

import React from "react";
import Head from "next/head";
import Link from "next/link";
import {
  Trash2,
  ChevronRight,
  Home,
  Smartphone,
  Mail,
  AlertTriangle,
  CheckCircle,
  Clock,
  ShieldOff,
} from "lucide-react";

const steps = [
  {
    icon: Smartphone,
    title: "Open the Paltuu app",
    description:
      'Launch the Paltuu app on your Android device and make sure you are signed in to the account you want to delete.',
  },
  {
    icon: ChevronRight,
    title: 'Go to Profile → Settings',
    description:
      'Tap your profile icon in the bottom navigation bar, then tap the Settings icon in the top-right corner.',
  },
  {
    icon: Trash2,
    title: 'Tap "Delete Account"',
    description:
      'Scroll to the bottom of Settings and tap "Delete Account". You will be asked to confirm your decision.',
  },
  {
    icon: CheckCircle,
    title: 'Confirm deletion',
    description:
      'Read the confirmation prompt and tap "Yes, delete my account". Your account and all associated data will be scheduled for permanent deletion.',
  },
];

const deletedData = [
  'Account profile (name, email address, phone number, bio)',
  'Profile photo and any photos you uploaded',
  'Pet profiles and all associated photos',
  'Social posts, comments, and likes',
  'Lost & found listings',
  'Adoption applications you submitted',
  'Follows, blocks, and notification preferences',
  'Push notification tokens (FCM)',
  'Location data (city preferences)',
];

const retainedData = [
  {
    item: 'Adoption records where you were the adopter or shelter party',
    reason: 'Required for welfare tracking and dispute resolution',
    period: 'Up to 1 year after deletion',
  },
  {
    item: 'Transaction and order records (if applicable)',
    reason: 'Legal and financial compliance',
    period: 'Up to 5 years (as required by applicable law)',
  },
  {
    item: 'Abuse / safety reports filed against your account',
    reason: 'Platform safety and trust enforcement',
    period: 'Up to 1 year after deletion',
  },
];

export default function DeleteAccountPage() {
  return (
    <>
      <Head>
        <title>Delete Account | Paltuu.pk</title>
        <meta
          name="description"
          content="Request deletion of your Paltuu account and all associated data. Learn what data is deleted, what is retained, and for how long."
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
                  Delete Your Account
                </h1>
                <p className="text-gray-700 text-xs sm:text-sm md:text-base lg:text-lg mt-1">
                  Paltuu.pk — how to request account and data deletion
                </p>
              </div>
            </div>
          </header>

          {/* Warning banner */}
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm sm:text-base">
              <strong>This action is permanent.</strong> Once your account is deleted, it cannot be
              recovered. Please make sure you have saved any information you may need before
              proceeding.
            </p>
          </div>

          {/* Step-by-step */}
          <section className="bg-white rounded-2xl p-5 sm:p-8 shadow-md border border-primary mb-6 sm:mb-8">
            <h2 className="flex items-center gap-2 text-lg sm:text-2xl font-semibold text-gray-900 mb-6">
              <Smartphone className="w-5 h-5 text-primary" />
              How to delete your account in the app
            </h2>
            <ol className="space-y-5">
              {steps.map((step, index) => (
                <li key={index} className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm sm:text-base">
                      {step.title}
                    </p>
                    <p className="text-gray-600 text-sm mt-0.5">{step.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Can't access the app? */}
          <section className="bg-white rounded-2xl p-5 sm:p-8 shadow-md border border-primary mb-6 sm:mb-8">
            <h2 className="flex items-center gap-2 text-lg sm:text-2xl font-semibold text-gray-900 mb-4">
              <Mail className="w-5 h-5 text-primary" />
              Can't access the app? Request by email
            </h2>
            <p className="text-gray-700 text-sm sm:text-base mb-4">
              If you are unable to access your account or the app, you can request deletion by
              emailing us. Send a message to{" "}
              <a
                href="mailto:support@paltuu.pk?subject=Account%20Deletion%20Request"
                className="text-primary font-medium hover:underline"
              >
                support@paltuu.pk
              </a>{" "}
              with the subject line <strong>"Account Deletion Request"</strong> and include:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-gray-700 text-sm sm:text-base">
              <li>The email address registered to your Paltuu account</li>
              <li>Your Paltuu username (if known)</li>
              <li>A brief confirmation that you wish to delete your account and all associated data</li>
            </ul>
            <p className="text-gray-600 text-sm mt-4">
              We will process your request within <strong>7 business days</strong> and send a
              confirmation once deletion is complete.
            </p>
          </section>

          {/* What gets deleted */}
          <section className="bg-white rounded-2xl p-5 sm:p-8 shadow-md border border-primary mb-6 sm:mb-8">
            <h2 className="flex items-center gap-2 text-lg sm:text-2xl font-semibold text-gray-900 mb-4">
              <ShieldOff className="w-5 h-5 text-primary" />
              What data is permanently deleted
            </h2>
            <p className="text-gray-600 text-sm sm:text-base mb-4">
              Upon confirmed deletion, the following data is permanently and irreversibly removed
              from Paltuu's systems:
            </p>
            <ul className="space-y-2">
              {deletedData.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-gray-700 text-sm sm:text-base">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* What is retained */}
          <section className="bg-white rounded-2xl p-5 sm:p-8 shadow-md border border-primary mb-6 sm:mb-8">
            <h2 className="flex items-center gap-2 text-lg sm:text-2xl font-semibold text-gray-900 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              Data retained after deletion &amp; retention periods
            </h2>
            <p className="text-gray-600 text-sm sm:text-base mb-5">
              A small subset of data may be retained for legal, safety, or operational reasons.
              This data is not used for any commercial or marketing purpose.
            </p>
            <div className="space-y-4">
              {retainedData.map((row, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-gray-200 p-4 bg-gray-50"
                >
                  <p className="font-semibold text-gray-800 text-sm sm:text-base mb-1">
                    {row.item}
                  </p>
                  <p className="text-gray-600 text-sm">
                    <span className="font-medium">Why:</span> {row.reason}
                  </p>
                  <p className="text-gray-600 text-sm mt-0.5">
                    <span className="font-medium">Retention period:</span> {row.period}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Footer actions */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors shadow-md font-medium text-sm sm:text-base"
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5" />
              Back to Paltuu
            </Link>
            <Link
              href="/privacy-policy"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors shadow-md font-medium text-sm sm:text-base"
            >
              View Privacy Policy
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
