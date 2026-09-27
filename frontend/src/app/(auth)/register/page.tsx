'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Home,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
} from 'lucide-react';
import { apiRequest, setAuthToken, setStoredUser } from '@/lib/api';

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Role: 'LANDLORD' | 'TENANT'
  const initialRole = searchParams.get('role')?.toUpperCase() === 'TENANT' ? 'TENANT' : 'LANDLORD';
  const [role, setRole] = useState<'LANDLORD' | 'TENANT'>(initialRole);

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google Modal
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  useEffect(() => {
    const roleParam = searchParams.get('role')?.toUpperCase();
    if (roleParam === 'TENANT' || roleParam === 'LANDLORD') {
      setRole(roleParam);
    }
  }, [searchParams]);

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
          role,
        }),
      });

      finishRegister(res.data.accessToken, res.data.user);
    } catch (err: any) {
      setError(err.message || 'Registration failed. An account with this email or phone may already exist.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async (customEmail?: string, customName?: string) => {
    const targetEmail = customEmail || googleEmail.trim();
    const targetName = customName || googleName.trim() || (role === 'LANDLORD' ? 'Landlord' : 'Tenant');

    if (!targetEmail || !targetEmail.includes('@')) {
      setError('Please enter a valid Google email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest<{ accessToken: string; user: any }>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({
          email: targetEmail.toLowerCase(),
          name: targetName,
          role,
        }),
      });

      setShowGoogleModal(false);
      finishRegister(res.data.accessToken, res.data.user);
    } catch (err: any) {
      setError(err.message || 'Google account creation failed');
    } finally {
      setLoading(false);
    }
  };

  const finishRegister = (accessToken: string, user: any) => {
    setAuthToken(accessToken);
    setStoredUser(user);

    if (rememberMe) {
      localStorage.setItem(
        'rentflow_remembered_account',
        JSON.stringify({
          name: user.name,
          email: user.email,
          phone: user.phone || (phoneNumber ? `+91 ${phoneNumber.slice(-10)}` : null),
          role: user.role,
        })
      );
    }

    if (user?.role === 'TENANT') {
      router.push('/tenant');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between font-sans selection:bg-emerald-500 selection:text-white relative overflow-x-hidden">
      {/* Top Header Bar with Home Navigation & Brand */}
      <header className="w-full max-w-md mx-auto pt-4 px-5 flex items-center justify-between z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 backdrop-blur-md"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-emerald-400" />
          <span>Home</span>
        </Link>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-950/60 border border-emerald-400/30">
            <Building2 className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs font-black tracking-tight text-white">RentFlow</span>
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
              India
            </span>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 1. Top Visual Hero Banner                                                 */}
      {/* ========================================================================= */}
      <div className="relative w-full max-w-md mx-auto pt-5 pb-4 px-6 overflow-hidden flex flex-col items-center justify-center text-center">
        {/* Ambient Glows */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-80 bg-gradient-to-br from-emerald-500/25 via-teal-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Big Bold Headline */}
        <div className="space-y-1 relative z-10">
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight">
            {role === 'LANDLORD' ? 'Start Managing Rent' : 'Pay & Track Rent'}
          </h1>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-emerald-400 leading-tight">
            {role === 'LANDLORD' ? 'In 60 Seconds' : 'Instantly on UPI'}
          </h2>
        </div>

        {/* Angled Tent Card Badge */}
        <div className="mt-4 mb-1 relative z-10 flex flex-col items-center">
          <div className="bg-white text-slate-900 px-4 py-2 rounded-xl shadow-2xl shadow-emerald-500/20 border-2 border-emerald-500/40 -rotate-3 hover:rotate-0 transition-transform duration-300 flex items-center gap-2">
            <div className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-black text-[10px]">
              ₹
            </div>
            <div className="text-left">
              <span className="text-[11px] font-black uppercase tracking-wider block text-emerald-800 leading-none">
                {role === 'LANDLORD' ? '100% Free Setup' : 'Direct UPI Mode'}
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mt-0.5">
                {role === 'LANDLORD' ? 'Zero Platform Commission' : '0% Gateway Fees'}
              </span>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
          </div>

          {/* Visual Carousel Indicator Dots */}
          <div className="flex items-center gap-1.5 mt-3.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <span className="w-4 h-1.5 rounded-full bg-emerald-400 transition-all shadow-xs shadow-emerald-400/50" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. White Bottom Sheet Card (The Core Requested Interface)                 */}
      {/* ========================================================================= */}
      <div className="w-full max-w-md mx-auto bg-white rounded-t-[36px] sm:rounded-3xl shadow-2xl p-6 sm:p-8 pt-5 text-slate-900 border-t border-slate-100 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Section A: Role Selector Switch (Landlord vs Tenant) */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 text-center block tracking-tight">
              Select your account type
            </span>

            <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-2xl border border-slate-200 shadow-inner">
              <button
                type="button"
                onClick={() => setRole('LANDLORD')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  role === 'LANDLORD'
                    ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/80 font-extrabold scale-[1.02]'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Building2 className={`w-4 h-4 ${role === 'LANDLORD' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>Landlord / Owner</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('TENANT')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                  role === 'TENANT'
                    ? 'bg-white text-emerald-800 shadow-sm border border-slate-200/80 font-extrabold scale-[1.02]'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Home className={`w-4 h-4 ${role === 'TENANT' ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>Tenant / Renter</span>
              </button>
            </div>
          </div>

          {/* Section B: Dynamic Subheader Context */}
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>{role === 'LANDLORD' ? 'Free Landlord Setup' : 'Instant Tenant Access'}</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {role === 'LANDLORD' ? 'Create Landlord Account' : 'Create Tenant Account'}
            </h2>
            <p className="text-xs text-slate-500">
              {role === 'LANDLORD'
                ? 'Collect rent directly on UPI with instant WhatsApp receipts'
                : 'Pay rent via UPI, download official rent receipts & log repair tickets'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Section C: Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Full Name */}
            <div className="flex items-center px-4 py-3 rounded-2xl border border-slate-200 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 bg-white transition shadow-2xs">
              <User className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={role === 'LANDLORD' ? 'Landlord Name (e.g. Rahul Sharma)' : 'Tenant Name (e.g. Priya Verma)'}
                className="w-full text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
              />
            </div>

            {/* Indian Phone Number */}
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xs shrink-0 select-none">
                <span className="text-lg">🇮🇳</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>

              <div className="flex-1 flex items-center px-4 py-3 rounded-2xl border border-slate-200 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 bg-white transition shadow-2xs">
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
            <div className="flex items-center px-4 py-3 rounded-2xl border border-slate-200 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 bg-white transition shadow-2xs">
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
            <div className="flex items-center px-4 py-3 rounded-2xl border border-slate-200 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 bg-white transition shadow-2xs">
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
                className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer"
              />
              <label
                htmlFor="rememberMeRegister"
                className="text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Remember my login on this device
              </label>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-950/30 hover:shadow-emerald-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="flex items-center gap-1.5">
                  <span>{role === 'LANDLORD' ? 'Create Landlord Account' : 'Create Tenant Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          {/* Social / Alternate Login Options (Google, Email Icon) */}
          <div className="flex items-center justify-center gap-4 pt-1">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setShowGoogleModal(true);
              }}
              title="Sign up with Google"
              className="w-12 h-12 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center shadow-2xs transition active:scale-95 group hover:border-emerald-300"
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
              className="w-12 h-12 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center shadow-2xs transition active:scale-95 group text-emerald-600 hover:text-emerald-700 hover:border-emerald-300"
            >
              <Mail className="w-5 h-5 group-hover:scale-105 transition" />
            </Link>
          </div>

          {/* Quick role-switch hint */}
          <div className="p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs text-slate-600 flex items-center justify-between">
            <span className="font-medium">
              {role === 'LANDLORD' ? 'Are you a tenant paying rent?' : 'Are you a property owner/landlord?'}
            </span>
            <button
              type="button"
              onClick={() => setRole(role === 'LANDLORD' ? 'TENANT' : 'LANDLORD')}
              className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
            >
              {role === 'LANDLORD' ? 'Switch to Tenant' : 'Switch to Landlord'}
            </button>
          </div>

          {/* Already have an account link */}
          <div className="text-center pt-0 text-xs">
            <span className="text-slate-500">Already have an account? </span>
            <Link
              href="/login"
              className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Log in
            </Link>
          </div>
        </div>

        {/* Section D: Legal Footer */}
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

      {/* ========================================================================= */}
      {/* 3. Google Sign-Up Modal                                                   */}
      {/* ========================================================================= */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl space-y-4 relative text-slate-900 animate-in zoom-in-95">
            <button
              onClick={() => setShowGoogleModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Google Header */}
            <div className="text-center space-y-1 pt-1">
              <svg className="w-8 h-8 mx-auto" viewBox="0 0 24 24">
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
              <h3 className="text-base font-bold text-slate-900">Sign up with Google</h3>
              <p className="text-xs text-slate-500">
                Registering as <span className="font-bold text-emerald-700">{role === 'LANDLORD' ? 'Landlord' : 'Tenant'}</span>
              </p>
            </div>

            {/* Quick 1-Tap Google Accounts */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleGoogleRegister('rahul.landlord@gmail.com', 'Rahul Sharma')}
                className="w-full p-3 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                    R
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block leading-tight">Rahul Sharma</span>
                    <span className="text-[11px] text-slate-500 block">rahul.landlord@gmail.com</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  1-Tap
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleGoogleRegister('priya.tenant@gmail.com', 'Priya Verma')}
                className="w-full p-3 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                    P
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block leading-tight">Priya Verma</span>
                    <span className="text-[11px] text-slate-500 block">priya.tenant@gmail.com</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                  1-Tap
                </span>
              </button>
            </div>

            {/* Custom Google Account Option */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 block">Or use your Google email:</span>
              <div className="flex items-center px-3 py-2 rounded-xl border border-slate-200 focus-within:border-emerald-600 bg-white">
                <Mail className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
                <input
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="your.name@gmail.com"
                  className="w-full text-xs font-semibold text-slate-900 focus:outline-none bg-transparent"
                />
              </div>

              <button
                type="button"
                disabled={!googleEmail || loading}
                onClick={() => handleGoogleRegister()}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition disabled:opacity-40"
              >
                Create Account with this Google Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
