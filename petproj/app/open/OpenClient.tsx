"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

export default function OpenClient() {
  const [path, setPath] = useState("");
  const [failed, setFailed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  // Read path from URL on client only — avoids useSearchParams + Suspense issues at build time
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setPath(params.get("path") || "");

    // Detect OS
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    if (/iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream) {
      setIsIOS(true);
    }
  }, []);

  useEffect(() => {
    if (!path) return;
    const cleanPath = decodeURIComponent(path).replace(/^\/+/, "");
    
    // Attempt redirect
    const redirectUrl = `paltuu://${cleanPath}`;
    
    const start = Date.now();
    
    // Attempt redirect via location
    window.location.href = redirectUrl;

    const timer = setTimeout(() => {
      // If the page is still focused and elapsed time is small, redirect likely failed
      if (document.hasFocus() && (Date.now() - start < 2500)) {
        setFailed(true);
      }
    }, 2000);

    // Also watch for visibility change (if app opens, page loses visibility/focus)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearTimeout(timer);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [path]);

  const handleManualRetry = () => {
    if (!path) return;
    const cleanPath = decodeURIComponent(path).replace(/^\/+/, "");
    window.location.href = `paltuu://${cleanPath}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#5c1c29] via-[#a03048] to-[#c74c65] flex flex-col items-center justify-center text-white px-6 py-12 relative overflow-hidden">
      {/* Decorative background paw shapes */}
      <div className="absolute top-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-10 -right-10 w-60 h-60 bg-white/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full text-center z-10 flex flex-col items-center">
        {/* Pulsing Brand Logo Container */}
        <div className="relative mb-8 w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md shadow-2xl border border-white/20 animate-pulse">
          <Image
            src="/favicon.png"
            alt="Paltuu Paw Logo"
            width={64}
            height={64}
            className="object-contain"
          />
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight mb-2 font-montserrat">
          Paltuu App Link
        </h1>

        {!failed ? (
          <div className="flex flex-col items-center">
            <p className="text-white/80 text-sm mb-8 max-w-xs leading-relaxed">
              Redirecting you to the app. Please make sure the Paltuu app is installed.
            </p>
            {/* Elegant Custom Spinner */}
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2.5 h-2.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2.5 h-2.5 bg-white rounded-full animate-bounce" />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center w-full animate-fade-in">
            <p className="text-white/95 text-sm mb-6 max-w-sm leading-relaxed">
              If the app didn't open automatically, it might not be installed on this device. Choose an option below:
            </p>

            <button
              onClick={handleManualRetry}
              className="w-full bg-white text-[#a03048] hover:bg-white/90 transition-all font-bold py-3.5 px-6 rounded-2xl shadow-xl mb-4 transform active:scale-95"
            >
              Open in App
            </button>

            <div className="w-full border-t border-white/20 my-6 flex items-center justify-center relative">
              <span className="bg-[#a03048] px-3 text-xs text-white/60 font-semibold tracking-wider uppercase absolute">
                or get the app
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center mt-2">
              <a
                href="https://apps.apple.com/app/paltuu/id6740698188"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center bg-black hover:bg-black/90 transition-colors px-6 py-3 rounded-xl border border-white/10 shadow-lg flex-1"
              >
                <span className="text-left font-montserrat">
                  <span className="block text-[10px] opacity-60 leading-none">Download on the</span>
                  <span className="block text-sm font-semibold leading-normal">App Store</span>
                </span>
              </a>

              <a
                href="https://play.google.com/store/apps/details?id=com.paltuu.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center bg-black hover:bg-black/90 transition-colors px-6 py-3 rounded-xl border border-white/10 shadow-lg flex-1"
              >
                <span className="text-left font-montserrat">
                  <span className="block text-[10px] opacity-60 leading-none">Get it on</span>
                  <span className="block text-sm font-semibold leading-normal">Google Play</span>
                </span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
