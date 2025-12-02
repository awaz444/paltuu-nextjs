"use client";

import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone
      || document.referrer.includes('android-app://');

    setIsStandalone(isInStandaloneMode);

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Check if prompt has already been shown in this session
    const shownInSession = sessionStorage.getItem('pwa-prompt-shown-session');
    if (shownInSession) {
      return;
    }

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    // Show prompt if not dismissed or if 7 days have passed
    if (!isInStandaloneMode && (!dismissed || daysSinceDismissed > 7)) {
      // Mark that we're showing the prompt in this session
      sessionStorage.setItem('pwa-prompt-shown-session', 'true');
      // For Android/Desktop
      const handleBeforeInstallPrompt = (e: Event) => {
        console.log('PWA: beforeinstallprompt event fired');
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        // Show prompt after 10 seconds
        setTimeout(() => setShowPrompt(true), 10000);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // Check if event already fired before component mounted
      if ((window as any).deferredPrompt) {
        console.log('PWA: Found existing deferredPrompt');
        setDeferredPrompt((window as any).deferredPrompt);
        setTimeout(() => setShowPrompt(true), 5000);
      }

      // For iOS, show custom prompt after 10 seconds
      if (iOS && !isInStandaloneMode) {
        setTimeout(() => setShowPrompt(true), 10000);
      }

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt && !isIOS) {
      setShowPrompt(false);
      return;
    }

    if (deferredPrompt) {
      // Show install prompt for Android/Desktop
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  // Don't show if already installed
  if (isStandalone || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="relative bg-gradient-to-r from-primary to-primary-dark p-4 text-white">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-3 pr-8">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
              <img src="/primary_icon.svg" alt="Paltuu" className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Install Paltuu</h3>
              <p className="text-sm text-white/90">Add to your home screen</p>
            </div>
          </div>
        </div>

        <div className="p-4">
          {isIOS ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-700">
                Install this app on your iPhone:
              </p>
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                <li>Tap the Share button <span className="inline-block">📤</span></li>
                <li>Scroll down and tap "Add to Home Screen" <span className="inline-block">➕</span></li>
                <li>Tap "Add" to install</li>
              </ol>
              <button
                onClick={handleDismiss}
                className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
              >
                Got it
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-700">
                Get quick access to Paltuu with one tap from your home screen!
              </p>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>✓ Faster access</li>
                <li>✓ Works offline</li>
                <li>✓ Just like a native app</li>
              </ul>
              <button
                onClick={handleInstallClick}
                className="w-full py-2.5 bg-primary text-white rounded-xl hover:bg-primary transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Download size={18} />
                Install App
              </button>
              <button
                onClick={handleDismiss}
                className="w-full py-2 text-gray-600 text-sm hover:text-gray-800 transition-colors"
              >
                Maybe later
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
