'use client'

import { useEffect, useState } from "react";
import Head from "next/head";
import { CheckCircleIcon, EnvelopeIcon, StarIcon, BoltIcon } from "@heroicons/react/24/solid";
import Confetti from "react-confetti";
import { useRouter } from "next/router";
import Image from "next/image";

const SuccessPage = () => {
    const [showConfetti, setShowConfetti] = useState(true);
    const primaryColor = "#a03048";
    const primaryLight = "#f8e8eb";

    useEffect(() => {
        // Confetti will show for 5 seconds (5000ms)
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

            {/* Confetti animation - triggers immediately on page load */}
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
                            <div className="flex items-start gap-4">
                                <CheckCircleIcon className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-800">Exclusive Updates</h3>
                                    <p className="text-gray-600">
                                        Be the first to know about new features, perks, and insider news.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <BoltIcon className="h-6 w-6 text-[--color-primary] mt-1 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-800">VIP Access</h3>
                                    <p className="text-gray-600">
                                        Early invites to beta programs, events, and founder-only rewards.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <EnvelopeIcon className="h-6 w-6 text-[--color-primary] mt-1 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-lg text-gray-800">Stay Connected</h3>
                                    <p className="text-gray-600">
                                        We've sent a confirmation email. Check your inbox!
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Social Media Links */}
                        <div className="text-center">
                            <p className="font-medium text-gray-700 mb-3">Follow us for updates:</p>
                            <div className="flex justify-center space-x-4">
                                <a href="#" className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition">
                                    <TwitterIcon />
                                </a>
                                <a href="#" className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition">
                                    <FacebookIcon />
                                </a>
                                <a href="#" className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition">
                                    <InstagramIcon />
                                </a>
                            </div>
                        </div>

                        <div
                            className="rounded-2xl p-4 border"
                            style={{ backgroundColor: primaryLight, borderColor: primaryColor }}
                        >
                            <p className="text-center" style={{ color: primaryColor }}>
                                <span className="font-semibold">Pro Tip:</span> Follow us on social media for sneak peeks!
                            </p>
                        </div>

                        <div className="flex justify-center">
                            <button
                                className="text-white font-medium py-3 px-6 rounded-2xl transition-all shadow-md hover:shadow-lg"
                                style={{ backgroundColor: primaryColor }}
                            >
                                Explore Founder Benefits
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
};

// Social media icon components
const TwitterIcon = () => (
    <svg className="w-5 h-5 text-[#1DA1F2]" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
    </svg>
);

const FacebookIcon = () => (
    <svg className="w-5 h-5 text-[#4267B2]" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
    </svg>
);

const InstagramIcon = () => (
    <svg className="w-5 h-5 text-[#E1306C]" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
    </svg>
);

export default SuccessPage;