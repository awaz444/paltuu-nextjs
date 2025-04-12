'use client'

import { useEffect, useState } from "react";
import Head from "next/head";
import { CheckCircleIcon, EnvelopeIcon, BoltIcon } from "@heroicons/react/24/solid";
import Confetti from "react-confetti";
import Image from "next/image";

const SuccessPage = () => {
    const [showConfetti, setShowConfetti] = useState(true);
    const primaryColor = "#a03048";
    const primaryLight = "#f8e8eb";

    useEffect(() => {
        const confettiTimer = setTimeout(() => {
            setShowConfetti(false);
        }, 10000);

        return () => clearTimeout(confettiTimer);
    }, []);

    return (
        <>
            <Head>
                <title>Welcome to Paltuu Founders Club!</title>
                <meta name="description" content="Exclusive access for early supporters" />
            </Head>

            {showConfetti && (
                <Confetti
                    width={typeof window !== "undefined" ? window.innerWidth : 0}
                    height={typeof window !== "undefined" ? window.innerHeight : 0}
                    recycle={false}
                    numberOfPieces={200}
                    colors={[primaryColor, "#d1a0a9", "#f8e8eb", "#ffffff"]}
                />
            )}

            <style jsx global>{`
                :root {
                    --color-primary: ${primaryColor};
                    --color-primary-light: ${primaryLight};
                }
            `}</style>

            <div className="min-h-screen bg-gradient-to-br from-[#faf5f6] to-[#f0e4e8] flex flex-col items-center justify-center p-4 relative overflow-hidden">
                <div className="max-w-2xl w-full bg-white rounded-3xl shadow-lg overflow-hidden z-10">
                    {/* Header */}
                    <div
                        className="p-8 text-center rounded-3xl"
                        style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, #7a1c3a 100%)` }}
                    >
                        <div className="flex justify-center mb-4">
                            <div className="h-10 w-10 relative">
                                <Image
                                    src="/white_icon.svg"
                                    alt="Founders Club Icon"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                            Welcome to the <span className="text-yellow-300">Founders Club!</span>
                        </h1>
                        <p className="text-white/90 text-lg">
                            Thank you for being an early supporter of Paltuu.
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-8 md:p-10 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-4">
                                {/* First two items */}
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-[--color-primary] mt-1 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-semibold text-base sm:text-lg text-gray-800">Exclusive Updates</h3>
                                            <p className="text-gray-600 text-sm sm:text-base">
                                                Be the first to know about new features, perks, and insider news.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <BoltIcon className="h-5 w-5 sm:h-6 sm:w-6 text-[--color-primary] mt-1 flex-shrink-0" />
                                        <div>
                                            <h3 className="font-semibold text-base sm:text-lg text-gray-800">VIP Access</h3>
                                            <p className="text-gray-600 text-sm sm:text-base">
                                                Early invites to beta programs, events, and founder-only rewards.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Last item */}
                                <div className="flex items-start gap-4 pt-2">
                                    <EnvelopeIcon className="h-5 w-5 sm:h-6 sm:w-6 text-[--color-primary] mt-1 flex-shrink-0" />
                                    <div>
                                        <h3 className="font-semibold text-base sm:text-lg text-gray-800">Next Steps</h3>
                                        <p className="text-gray-600 text-sm sm:text-base">
                                            Keep an eye on your inbox for exciting updates<br />
                                            Get ready to meet your new best friend (before anyone else does!)
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Social Media Section */}
                        <div className="text-center space-y-4">
                            <div className="space-y-2">
                                <h3 className="font-semibold text-lg text-gray-800">Stay Connected</h3>
                                <div className="flex justify-center items-center space-x-4">
                                    <a href="#" className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition">
                                        <InstagramIcon />
                                    </a>
                                    <a href="#" className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition">
                                        <TikTokIcon />
                                    </a>
                                    <a href="#" className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition">
                                        <LinkedInIcon />
                                    </a>
                                </div>
                                <p className="text-[--color-primary] text-sm mt-2">
                                    Tag us and share the love using <strong className="font-bold">#FoundersWithPaws</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

// Social Media Icon Components
const InstagramIcon = () => (
    <svg className="w-5 h-5 text-[#E1306C]" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
    </svg>
);

const TikTokIcon = () => (
    <svg className="w-5 h-5 text-[#000000]" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
);

const LinkedInIcon = () => (
    <svg className="w-5 h-5 text-[#0077B5]" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
);

export default SuccessPage;