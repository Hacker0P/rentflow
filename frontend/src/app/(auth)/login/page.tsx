'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MoreVertical,
  ChevronDown,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Building2,
  Check,
  Eye,
  EyeOff,
  AlertCircle,
  Home,
  User,
  Sparkles,
} from 'lucide-react';
import { apiRequest, setAuthToken, setStoredUser, getStoredUser } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();

  // Mode: 'PHONE' | 'EMAIL'
  const [inputMode, setInputMode] = useState<'PHONE' | 'EMAIL'>('PHONE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState<'IDENTIFIER' | 'PASSWORD'>('IDENTIFIER');
  const [rememberMe, setRememberMe] = useState(true);
  const [role, setRole] = useState<'LANDLORD' | 'TENANT'>('LANDLORD');

  const [savedUser, setSavedUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for previously remembered or stored user
    try {
      const stored = getStoredUser();
      if (stored && stored.name) {
        setSavedUser(stored);
      } else {
        const localSaved = localStorage.getItem('rentflow_remembered_account');
        if (localSaved) {
          setSavedUser(JSON.parse(localSaved));
        }
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleSelectSavedAccount = () => {
    if (!savedUser) return;
    if (savedUser.phone) {
      setInputMode('PHONE');
      setPhoneNumber(savedUser.phone.replace(/[^0-9]/g, '').slice(-10));
    } else if (savedUser.email) {
      setInputMode('EMAIL');
      setEmail(savedUser.email);
    }
    setStep('PASSWORD');
    setError(null);
  };

  const handleContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const identifier = inputMode === 'PHONE' ? phoneNumber.trim() : email.trim();
    if (!identifier) {
      setError(inputMode === 'PHONE' ? 'Please enter a valid 10-digit mobile number' : 'Please enter your email address');
      return;
    }

    if (inputMode === 'PHONE' && identifier.replace(/[^0-9]/g, '').length < 10) {
      setError('Please enter a valid 10-digit Indian phone number');
      return;
    }

    // If still in IDENTIFIER step, proceed to password entry
    if (step === 'IDENTIFIER') {
      setStep('PASSWORD');
      return;
    }

    if (!password) {
      setError('Please enter your password to continue');
      return;
    }

    setLoading(true);

    try {
      const loginPayload = {
        email: inputMode === 'PHONE' ? identifier.replace(/[^0-9]/g, '').slice(-10) : identifier.toLowerCase(),
        password,
      };

      const res = await apiRequest<{ accessToken: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(loginPayload),
      });

      setAuthToken(res.data.accessToken);
      setStoredUser(res.data.user);

      if (rememberMe) {
        localStorage.setItem(
          'rentflow_remembered_account',
          JSON.stringify({
            name: res.data.user.name,
            email: res.data.user.email,
            phone: res.data.user.phone || (inputMode === 'PHONE' ? identifier : null),
            role: res.data.user.role,
          })
        );
      }

      if (res.data.user?.role === 'TENANT') {
        router.push('/tenant');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify your phone/email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-between font-sans selection:bg-[#f04f5f] selection:text-white">
      {/* ========================================================================= */}
      {/* 1. Top Visual Hero Banner (Zomato/Blinkit High-Impact Graphic Style)       */}
      {/* ========================================================================= */}
      <div className="relative w-full max-w-md mx-auto pt-10 pb-6 px-6 overflow-hidden flex flex-col items-center justify-center text-center">
        {/* Ambient Glows */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-72 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Big Bold Headline */}
        <div className="space-y-1 relative z-10">
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight">
            Manage &amp; Pay Rent
          </h1>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight">
            Instantly on UPI
          </h2>
        </div>

        {/* Angled Tent Card Badge ("DIRECT UPI MODE") */}
        <div className="mt-6 mb-2 relative z-10 flex flex-col items-center">
          <div className="bg-white text-slate-900 px-4 py-2 rounded-xl shadow-2xl shadow-emerald-500/10 border-2 border-emerald-500/30 -rotate-3 hover:rotate-0 transition-transform duration-300 flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-[10px]">
              ₹
            </div>
            <div className="text-left">
              <span className="text-[11px] font-black uppercase tracking-wider block text-emerald-800 leading-none">
                Direct UPI Mode
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mt-0.5">
                0% Gateway Fees
              </span>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
          </div>

          {/* Visual Carousel Indicator Dots */}
          <div className="flex items-center gap-1.5 mt-4">
            <span className="w-4 h-1.5 rounded-full bg-white transition-all" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. White Bottom Sheet Card (The Core Requested Interface)                 */}
      {/* ========================================================================= */}
      <div className="w-full max-w-md mx-auto bg-white rounded-t-[36px] sm:rounded-3xl shadow-2xl p-6 sm:p-8 pt-6 text-slate-900 border-t border-slate-100 flex-1 flex flex-col justify-between">
        <div className="space-y-5">
          {/* Section A: "Choose your account" (Saved Account Fast Sign-In) */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 text-center block tracking-tight">
              Choose your account
            </span>

            {savedUser ? (
              <div
                onClick={handleSelectSavedAccount}
                className="w-full p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 transition flex items-center justify-between cursor-pointer group shadow-xs active:scale-98"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-base border border-emerald-200 group-hover:scale-105 transition">
                    {savedUser.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="text-left">
                    <span className="font-bold text-sm text-slate-900 block leading-tight">
                      {savedUser.name}
                    </span>
                    <span className="text-xs text-slate-500 block mt-0.5 font-medium">
                      {savedUser.phone ? `+91 ${savedUser.phone.slice(-10)}` : savedUser.email}
                    </span>
                  </div>
                </div>

                <div className="text-slate-400 group-hover:text-slate-600 p-1">
                  <MoreVertical className="w-4 h-4" />
                </div>
              </div>
            ) : (
              <div className="w-full p-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-2 font-medium">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  Instant Access for Landlords &amp; Tenants
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  Fast Sign In
                </span>
              </div>
            )}
          </div>

          {/* Section B: "Log in or sign up" Divider */}
          <div className="relative flex items-center justify-center pt-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative px-3 bg-white text-xs font-bold text-slate-500 uppercase tracking-wider">
              Log in or sign up
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Section C: Indian Mobile Number / Email Input */}
          <form onSubmit={handleContinue} className="space-y-3.5">
            {inputMode === 'PHONE' ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {/* Indian Flag dropdown box */}
                  <div className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xs shrink-0 select-none">
                    <span className="text-lg">🇮🇳</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>

                  {/* Phone input with +91 prefix */}
                  <div className="flex-1 flex items-center px-4 py-3 rounded-2xl border border-slate-200 focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-100 bg-white transition shadow-2xs">
                    <span className="text-slate-800 font-bold text-sm mr-2 select-none">+91</span>
                    <input
                      type="tel"
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="Enter Phone Number"
                      className="w-full text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center px-4 py-3 rounded-2xl border border-slate-200 focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-100 bg-white transition shadow-2xs">
                  <Mail className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter Email Address"
                    className="w-full text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
                  />
                </div>
              </div>
            )}

            {/* Password Field (when step is PASSWORD or already entered) */}
            {step === 'PASSWORD' && (
              <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center px-4 py-3 rounded-2xl border border-slate-200 focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-100 bg-white transition shadow-2xs">
                  <Lock className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Password"
                    autoFocus
                    className="w-full text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="p-1 text-slate-400 hover:text-slate-600 transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex justify-end pt-0.5">
                  <button
                    type="button"
                    onClick={() => setStep('IDENTIFIER')}
                    className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                  >
                    Change {inputMode === 'PHONE' ? 'phone' : 'email'}
                  </button>
                </div>
              </div>
            )}

            {/* Section D: "Remember my login for faster sign-in" checkbox */}
            <div className="flex items-center gap-2 pt-1 select-none">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-[#f04f5f] accent-[#f04f5f] focus:ring-0 cursor-pointer"
              />
              <label
                htmlFor="rememberMe"
                className="text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Remember my login for faster sign-in
              </label>
            </div>

            {/* Section E: Primary Action Button ("Continue") */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 rounded-2xl bg-[#f04f5f] hover:bg-[#e03a4c] active:scale-98 text-white font-extrabold text-sm sm:text-base shadow-md shadow-[#f04f5f]/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Continue</span>
              )}
            </button>
          </form>

          {/* Section F: Social / Alternate Login Options (Google, Email Icon) */}
          <div className="flex items-center justify-center gap-4 pt-1">
            {/* Google Icon Circle */}
            <button
              type="button"
              onClick={() => {
                setError('Google Sign-In is active. You can sign in using your registered mobile number or email.');
              }}
              title="Sign in with Google"
              className="w-12 h-12 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center shadow-xs transition active:scale-95 group"
            >
              {/* Google colored G logo SVG */}
              <svg className="w-5 h-5 group-hover:scale-105 transition" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </button>

            {/* Email / Phone Toggle Circle */}
            <button
              type="button"
              onClick={() => {
                setInputMode(inputMode === 'PHONE' ? 'EMAIL' : 'PHONE');
                setError(null);
              }}
              title={inputMode === 'PHONE' ? 'Switch to Email Login' : 'Switch to Phone Login'}
              className="w-12 h-12 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center shadow-xs transition active:scale-95 group text-[#f04f5f]"
            >
              <Mail className="w-5 h-5 group-hover:scale-105 transition" />
            </button>
          </div>

          {/* Landlord Registration Link */}
          <div className="text-center pt-1 text-xs">
            <span className="text-slate-500">New landlord? </span>
            <Link
              href="/register"
              className="font-bold text-[#f04f5f] hover:underline"
            >
              Create Account Free
            </Link>
          </div>
        </div>

        {/* Section G: Legal Footer */}
        <div className="pt-6 border-t border-slate-100 text-center space-y-1">
          <p className="text-[11px] text-slate-500 leading-tight">
            By continuing, you agree to our
          </p>
          <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-slate-600">
            <span className="underline cursor-pointer hover:text-slate-900">Terms of Service</span>
            <span>•</span>
            <span className="underline cursor-pointer hover:text-slate-900">Privacy Policy</span>
            <span>•</span>
            <span className="underline cursor-pointer hover:text-slate-900">Content Policy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
