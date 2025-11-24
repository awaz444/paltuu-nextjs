"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PWADebugPage() {
  const [status, setStatus] = useState<any>({
    serviceWorker: 'Checking...',
    manifest: 'Checking...',
    installPrompt: 'Waiting...',
    isStandalone: 'Checking...',
    isOnline: 'Checking...',
    userAgent: '',
  });

  useEffect(() => {
    // Check Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        setStatus((prev: any) => ({
          ...prev,
          serviceWorker: registration ? `Registered (Scope: ${registration.scope})` : 'Not Registered',
        }));
      });
    } else {
      setStatus((prev: any) => ({ ...prev, serviceWorker: 'Not Supported' }));
    }

    // Check Manifest
    const link = document.querySelector('link[rel="manifest"]');
    setStatus((prev: any) => ({
      ...prev,
      manifest: link ? `Found (${link.getAttribute('href')})` : 'Not Found',
    }));

    // Check Standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone
      || document.referrer.includes('android-app://');
    setStatus((prev: any) => ({
      ...prev,
      isStandalone: isStandalone ? 'Yes' : 'No',
    }));

    // Check Online Status
    setStatus((prev: any) => ({
      ...prev,
      isOnline: navigator.onLine ? 'Yes' : 'No',
    }));

    // User Agent
    setStatus((prev: any) => ({
      ...prev,
      userAgent: navigator.userAgent,
    }));

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setStatus((prev: any) => ({
        ...prev,
        installPrompt: 'Event Fired! (Ready to install)',
      }));
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold mb-6 text-primary">PWA Debugger</h1>

        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-2">Service Worker</h3>
            <p className={`font-mono text-sm ${status.serviceWorker.includes('Registered') ? 'text-green-600' : 'text-red-600'}`}>
              {status.serviceWorker}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-2">Manifest</h3>
            <p className={`font-mono text-sm ${status.manifest.includes('Found') ? 'text-green-600' : 'text-red-600'}`}>
              {status.manifest}
            </p>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-2">Install Prompt Event</h3>
            <p className={`font-mono text-sm ${status.installPrompt.includes('Fired') ? 'text-green-600' : 'text-orange-600'}`}>
              {status.installPrompt}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Note: This event only fires if the app meets PWA criteria and is not already installed.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-2">Standalone Mode</h3>
              <p className="font-mono text-sm text-gray-800">{status.isStandalone}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
              <h3 className="font-semibold text-gray-700 mb-2">Online Status</h3>
              <p className="font-mono text-sm text-gray-800">{status.isOnline}</p>
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h3 className="font-semibold text-gray-700 mb-2">User Agent</h3>
            <p className="font-mono text-xs text-gray-600 break-all">
              {status.userAgent}
            </p>
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="px-6 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
