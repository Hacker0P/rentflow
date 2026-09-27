'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronDown,
  Mail,
  Lock,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { apiRequest, setAuthToken, setStoredUser } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }

    if (phoneNumber && phoneNumber.replace(/[^0-9]/g, '').length < 10) {
      setError('Please enter a valid 10-digit Indian phone number');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const res = await apiRequest<{ accessToken: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phoneNumber.trim() ? `+91${phoneNumber.replace(/[^0-9]/g, '').slice(-10)}` : undefined,
        }),
      });

      setAuthToken(res.data.accessToken);
      setStoredUser(res.data.user);

      if (rememberMe) {
        localStorage.setItem(
          'rentflow_remembered_account',
          JSON.stringify({
            name: res.data.user.name,
            email: res.data.user.email,
            phone: res.data.user.phone || (phoneNumber ? `+91 ${phoneNumber.slice(-10)}` : null),
            role: res.data.user.role,
          })
        );
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. An account with this email or phone may already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col justify-between font-sans selection:bg-[#f04f5f] selection:text-white">
      {/* ========================================================================= */}
      {/* 1. Top Visual Hero Banner (Zomato/Blinkit High-Impact Graphic Style)       */}
      {/* ========================================================================= */}
      <div className="relative w-full max-w-md mx-auto pt-8 pb-5 px-6 overflow-hidden flex flex-col items-center justify-center text-center">
        {/* Ambient Glows */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-72 h-72 bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Big Bold Headline */}
        <div className="space-y-1 relative z-10">
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight">
            Start Managing Rent
          </h1>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight">
            In 60 Seconds
          </h2>
        </div>

        {/* Angled Tent Card Badge ("DIRECT UPI MODE") */}
        <div className="mt-5 mb-1 relative z-10 flex flex-col items-center">
          <div className="bg-white text-slate-900 px-4 py-2 rounded-xl shadow-2xl shadow-emerald-500/10 border-2 border-emerald-500/30 -rotate-3 hover:rotate-0 transition-transform duration-300 flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-[10px]">
              ₹
            </div>
            <div className="text-left">
              <span className="text-[11px] font-black uppercase tracking-wider block text-emerald-800 leading-none">
                Direct UPI to Bank
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mt-0.5">
                0% Gateway Fees
              </span>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
          </div>

          {/* Visual Carousel Indicator Dots */}
          <div className="flex items-center gap-1.5 mt-3.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <span className="w-4 h-1.5 rounded-full bg-white transition-all" />
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
        <div className="space-y-4">
          {/* Section A: Header title */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Free Landlord Setup</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Create Your Account
            </h2>
            <p className="text-xs text-slate-500">
              Collect rent directly on UPI with instant WhatsApp receipts
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Section B: Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Full Name */}
            <div className="flex items-center px-4 py-3 rounded-2xl border border-slate-200 focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-100 bg-white transition shadow-2xs">
              <User className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name (e.g. Rahul Sharma)"
                className="w-full text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
              />
            </div>

            {/* Indian Phone Number */}
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xs shrink-0 select-none">
                <span className="text-lg">🇮🇳</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>

              <div className="flex-1 flex items-center px-4 py-3 rounded-2xl border border-slate-200 focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-100 bg-white transition shadow-2xs">
                <span className="text-slate-800 font-bold text-sm mr-2 select-none">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Mobile Number"
                  className="w-full text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="flex items-center px-4 py-3 rounded-2xl border border-slate-200 focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-100 bg-white transition shadow-2xs">
              <Mail className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
              />
            </div>

            {/* Password */}
            <div className="flex items-center px-4 py-3 rounded-2xl border border-slate-200 focus-within:border-slate-800 focus-within:ring-2 focus-within:ring-slate-100 bg-white transition shadow-2xs">
              <Lock className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min. 6 characters)"
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

            {/* Remember Me */}
            <div className="flex items-center gap-2 pt-0.5 select-none">
              <input
                type="checkbox"
                id="rememberMeRegister"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-[#f04f5f] accent-[#f04f5f] focus:ring-0 cursor-pointer"
              />
              <label
                htmlFor="rememberMeRegister"
                className="text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Remember my login on this device
              </label>
            </div>

            {/* Primary Action Button ("Continue") */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 rounded-2xl bg-[#f04f5f] hover:bg-[#e03a4c] active:scale-98 text-white font-extrabold text-sm sm:text-base shadow-md shadow-[#f04f5f]/30 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Continue</span>
              )}
            </button>
          </form>

          {/* Social / Alternate Login Options (Google, Email Icon) */}
          <div className="flex items-center justify-center gap-4 pt-1">
            <button
              type="button"
              onClick={() => {
                setError('Google Sign-Up is enabled. Fill in your details above for instant zero-fee account setup.');
              }}
              title="Sign up with Google"
              className="w-12 h-12 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center shadow-xs transition active:scale-95 group"
            >
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

            <Link
              href="/login"
              title="Sign In Instead"
              className="w-12 h-12 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center shadow-xs transition active:scale-95 group text-[#f04f5f]"
            >
              <Mail className="w-5 h-5 group-hover:scale-105 transition" />
            </Link>
          </div>

          {/* Reassurance note for Tenants */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span className="font-medium">Are you a tenant?</span>
            <Link
              href="/login"
              className="font-bold text-[#f04f5f] hover:underline"
            >
              Log in with Phone
            </Link>
          </div>

          {/* Already have an account link */}
          <div className="text-center pt-0 text-xs">
            <span className="text-slate-500">Already have an account? </span>
            <Link
              href="/login"
              className="font-bold text-[#f04f5f] hover:underline"
            >
              Log in
            </Link>
          </div>
        </div>

        {/* Section C: Legal Footer */}
        <div className="pt-5 border-t border-slate-100 text-center space-y-1">
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
