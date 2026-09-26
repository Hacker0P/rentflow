'use client';

import { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone, CheckCircle2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.error('[PWA] Service Worker registration failed:', err);
        });
    }

    // 2. Check if already installed & running in standalone mode
    if (typeof window !== 'undefined') {
      const isStandaloneMode =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
        document.referrer.includes('android-app://');

      setIsStandalone(isStandaloneMode);

      // Check if iOS
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isApple = /iphone|ipad|ipod/.test(userAgent);
      setIsIOS(isApple);

      // Check if user dismissed banner recently
      const dismissedUntil = localStorage.getItem('rentflow_pwa_dismissed');
      const isRecentlyDismissed = dismissedUntil && Date.now() < parseInt(dismissedUntil, 10);

      // 3. Listen for Android / Chrome install prompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
        if (!isRecentlyDismissed && !isStandaloneMode) {
          setShowBanner(true);
        }
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // For iOS if not in standalone and not recently dismissed, show banner after short delay
      if (isApple && !isStandaloneMode && !isRecentlyDismissed) {
        const timer = setTimeout(() => setShowBanner(true), 2500);
        return () => {
          window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
          clearTimeout(timer);
        };
      }

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      alert('To install RentFlow, tap your browser menu (⋮) and select "Install app" or "Add to Home screen".');
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error('[PWA] Error prompting install:', err);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSInstructions(false);
    // Dismiss for 2 days
    localStorage.setItem('rentflow_pwa_dismissed', (Date.now() + 2 * 24 * 60 * 60 * 1000).toString());
  };

  if (isStandalone || !showBanner) {
    return null;
  }

  return (
    <>
      {/* Floating Modern Native App Prompt */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
        <div className="bg-slate-900/95 backdrop-blur-md border border-emerald-500/30 text-white rounded-2xl p-4 shadow-2xl shadow-emerald-950/40 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center p-2 shadow-inner shadow-white/20">
                <Smartphone className="w-7 h-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="font-semibold text-sm text-white">Install RentFlow App</h4>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                    PWA
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                  Add to home screen for fullscreen standalone mode without browser bars.
                </p>
              </div>
            </div>

            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-semibold text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-95"
            >
              <Download className="w-4 h-4" />
              {isIOS ? 'Install on iPhone / iPad' : 'Install RentFlow App'}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2.5 text-xs text-slate-400 hover:text-white font-medium rounded-xl hover:bg-slate-800 transition"
            >
              Not Now
            </button>
          </div>
        </div>
      </div>

      {/* iOS Safari Instruction Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-t-3xl sm:rounded-2xl p-6 max-w-sm w-full space-y-4 animate-in slide-in-from-bottom-8">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                Install on iPhone / iPad
              </h3>
              <button
                onClick={() => setShowIOSInstructions(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Apple Safari lets you install RentFlow right on your home screen:
            </p>

            <ol className="space-y-3 text-xs text-slate-200">
              <li className="flex items-center gap-3 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                  1
                </span>
                <span className="flex items-center gap-1.5 flex-wrap">
                  Tap the <Share className="w-4 h-4 text-sky-400 inline" /> <strong>Share</strong> button in Safari's toolbar.
                </span>
              </li>
              <li className="flex items-center gap-3 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                  2
                </span>
                <span className="flex items-center gap-1.5 flex-wrap">
                  Scroll down and tap <PlusSquare className="w-4 h-4 text-emerald-400 inline" /> <strong>Add to Home Screen</strong>.
                </span>
              </li>
              <li className="flex items-center gap-3 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center shrink-0">
                  3
                </span>
                <span>
                  Tap <strong>Add</strong> in the top right corner. RentFlow will appear as an app!
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs rounded-xl transition"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}
