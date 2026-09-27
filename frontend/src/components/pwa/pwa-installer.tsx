'use client';

import { useState, useEffect, useRef } from 'react';
import { Download, X, Share, PlusSquare, Smartphone, MoreVertical, Sparkles, CheckCircle2 } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [showAndroidInstructions, setShowAndroidInstructions] = useState(false);

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

      // Check device environment
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isApple = /iphone|ipad|ipod/.test(userAgent);
      const isMobile = /iphone|ipad|ipod|android|mobile/.test(userAgent);
      setIsIOS(isApple);

      // Check if user dismissed banner recently (within 48 hours)
      const dismissedUntil = localStorage.getItem('rentflow_pwa_dismissed');
      const isRecentlyDismissed = dismissedUntil && Date.now() < parseInt(dismissedUntil, 10);

      // 3. Listen for Android / Chrome install prompt
      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        const promptEvent = e as BeforeInstallPromptEvent;
        deferredPromptRef.current = promptEvent;
        setDeferredPrompt(promptEvent);
        if (!isRecentlyDismissed && !isStandaloneMode) {
          setShowBanner(true);
        }
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      // Listen for appinstalled event
      const handleAppInstalled = () => {
        console.log('[PWA] RentFlow installed successfully!');
        setIsStandalone(true);
        setShowBanner(false);
        setShowIOSInstructions(false);
        setShowAndroidInstructions(false);
      };
      window.addEventListener('appinstalled', handleAppInstalled);

      // 4. Custom trigger from button clicks (e.g. Settings or Header)
      const handleCustomTrigger = () => {
        if (isApple) {
          setShowIOSInstructions(true);
        } else if (deferredPromptRef.current) {
          deferredPromptRef.current.prompt().then(() => {
            return deferredPromptRef.current?.userChoice;
          }).then((choice) => {
            if (choice?.outcome === 'accepted') {
              setShowBanner(false);
            }
            deferredPromptRef.current = null;
            setDeferredPrompt(null);
          }).catch(() => {
            setShowAndroidInstructions(true);
          });
        } else {
          setShowAndroidInstructions(true);
        }
      };

      window.addEventListener('rentflow-trigger-pwa-install', handleCustomTrigger);

      // Auto-show banner for mobile visitors after a 2-second delay if not dismissed and not in standalone
      let timer: NodeJS.Timeout | null = null;
      if (isMobile && !isStandaloneMode && !isRecentlyDismissed) {
        timer = setTimeout(() => setShowBanner(true), 2000);
      }

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
        window.removeEventListener('rentflow-trigger-pwa-install', handleCustomTrigger);
        if (timer) clearTimeout(timer);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowBanner(false);
      setShowIOSInstructions(true);
      return;
    }

    const prompt = deferredPrompt || deferredPromptRef.current;
    if (!prompt) {
      setShowBanner(false);
      setShowAndroidInstructions(true);
      return;
    }

    try {
      await prompt.prompt();
      const choiceResult = await prompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
        setShowBanner(false);
      }
      setDeferredPrompt(null);
      deferredPromptRef.current = null;
    } catch (err) {
      console.error('[PWA] Error prompting install:', err);
      setShowBanner(false);
      setShowAndroidInstructions(true);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSInstructions(false);
    setShowAndroidInstructions(false);
    // Dismiss for 48 hours
    localStorage.setItem('rentflow_pwa_dismissed', (Date.now() + 2 * 24 * 60 * 60 * 1000).toString());
  };

  return (
    <>
      {/* Floating Modern Native App Prompt Banner */}
      {showBanner && !isStandalone && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900/95 backdrop-blur-md border border-emerald-500/30 text-white rounded-3xl p-4 sm:p-5 shadow-2xl shadow-emerald-950/50 flex flex-col gap-3.5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center p-2 shadow-lg shadow-emerald-500/30 shrink-0">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-extrabold text-sm text-white">Install RentFlow App</h4>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wider">
                      Native PWA
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 leading-snug">
                    Add to Home Screen for 1-tap launch &amp; fullscreen mode without browser URL bars.
                  </p>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition"
                aria-label="Dismiss banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 pt-0.5">
              <button
                onClick={handleInstallClick}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs py-3 px-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-98"
              >
                <Download className="w-4 h-4" />
                <span>{isIOS ? 'Install on iPhone / iPad' : 'Install RentFlow App'}</span>
              </button>
              <button
                onClick={handleDismiss}
                className="px-3.5 py-3 text-xs text-slate-400 hover:text-white font-medium rounded-2xl hover:bg-slate-800 transition"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari Instruction Modal */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-t-3xl sm:rounded-3xl p-6 max-w-sm w-full space-y-4 animate-in slide-in-from-bottom-8">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <span>Install on iPhone / iPad</span>
              </h3>
              <button
                onClick={() => setShowIOSInstructions(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Install RentFlow directly onto your iPhone home screen in 3 quick steps:
            </p>

            <ol className="space-y-2.5 text-xs text-slate-200">
              <li className="flex items-center gap-3 bg-slate-800/90 p-3 rounded-2xl border border-slate-700/80">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <span className="flex items-center gap-1.5 flex-wrap">
                  Tap the <Share className="w-4 h-4 text-sky-400 inline" /> <strong>Share</strong> button in Safari&apos;s bottom toolbar.
                </span>
              </li>
              <li className="flex items-center gap-3 bg-slate-800/90 p-3 rounded-2xl border border-slate-700/80">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <span className="flex items-center gap-1.5 flex-wrap">
                  Scroll down and tap <PlusSquare className="w-4 h-4 text-emerald-400 inline" /> <strong>Add to Home Screen</strong>.
                </span>
              </li>
              <li className="flex items-center gap-3 bg-slate-800/90 p-3 rounded-2xl border border-slate-700/80">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center shrink-0 text-xs">
                  3
                </span>
                <span>
                  Tap <strong>Add</strong> in the top right. RentFlow will appear as a standalone app!
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-2xl transition shadow-lg shadow-emerald-500/20"
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Android Chrome / Browser Instruction Modal */}
      {showAndroidInstructions && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 text-white rounded-t-3xl sm:rounded-3xl p-6 max-w-sm w-full space-y-4 animate-in slide-in-from-bottom-8">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <span>Install on Android / Browser</span>
              </h3>
              <button
                onClick={() => setShowAndroidInstructions(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Install RentFlow onto your device in 3 quick steps:
            </p>

            <ol className="space-y-2.5 text-xs text-slate-200">
              <li className="flex items-center gap-3 bg-slate-800/90 p-3 rounded-2xl border border-slate-700/80">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center shrink-0 text-xs">
                  1
                </span>
                <span className="flex items-center gap-1.5 flex-wrap">
                  Tap the <MoreVertical className="w-4 h-4 text-emerald-400 inline" /> <strong>three dots menu</strong> at the top right of your browser.
                </span>
              </li>
              <li className="flex items-center gap-3 bg-slate-800/90 p-3 rounded-2xl border border-slate-700/80">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center shrink-0 text-xs">
                  2
                </span>
                <span className="flex items-center gap-1.5 flex-wrap">
                  Tap <Download className="w-4 h-4 text-emerald-400 inline" /> <strong>Install app</strong> (or <em>Add to Home screen</em>).
                </span>
              </li>
              <li className="flex items-center gap-3 bg-slate-800/90 p-3 rounded-2xl border border-slate-700/80">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-black flex items-center justify-center shrink-0 text-xs">
                  3
                </span>
                <span>
                  Tap <strong>Install</strong>. RentFlow will launch like a native mobile app without URL bars!
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowAndroidInstructions(false)}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-2xl transition shadow-lg shadow-emerald-500/20"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}
