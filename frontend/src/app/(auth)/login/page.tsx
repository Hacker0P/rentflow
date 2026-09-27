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
  ArrowLeft,
  Smartphone,
  KeyRound,
  RefreshCw,
  X,
  CheckCircle2,
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

  // Step: 'IDENTIFIER' | 'OTP' | 'PASSWORD'
  const [step, setStep] = useState<'IDENTIFIER' | 'OTP' | 'PASSWORD'>('IDENTIFIER');
  const [otp, setOtp] = useState('');
  const [simulatedSmsOtp, setSimulatedSmsOtp] = useState<string | null>(null);
  const [otpCooldown, setOtpCooldown] = useState(0);

  const [rememberMe, setRememberMe] = useState(true);
  const [savedUser, setSavedUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Google Login Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleRole, setGoogleRole] = useState<'LANDLORD' | 'TENANT'>('LANDLORD');

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

  // Countdown timer for OTP resend
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

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

  // 1. Phone OTP Request
  const handleSendOtp = async (targetPhone?: string) => {
    const raw = targetPhone || phoneNumber;
    const cleanDigits = raw.replace(/[^0-9]/g, '');
    if (cleanDigits.length < 10) {
      setError('Please enter a valid 10-digit Indian phone number');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest<{ success: boolean; message: string; otp: string; phone: string }>(
        '/auth/otp/send',
        {
          method: 'POST',
          body: JSON.stringify({ phone: cleanDigits }),
        }
      );

      setStep('OTP');
      setSimulatedSmsOtp(res.data.otp);
      setOtp('');
      setOtpCooldown(30);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Phone OTP Verification
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!otp || otp.trim().length < 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest<{ accessToken: string; user: any; isNewUser: boolean }>(
        '/auth/otp/verify',
        {
          method: 'POST',
          body: JSON.stringify({
            phone: phoneNumber.replace(/[^0-9]/g, '').slice(-10),
            otp: otp.trim(),
          }),
        }
      );

      finishLogin(res.data.accessToken, res.data.user);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code');
    } finally {
      setLoading(false);
    }
  };

  // 3. Password-based Login (for Phone or Email)
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const identifier = inputMode === 'PHONE' ? phoneNumber.trim() : email.trim();
    if (!identifier) {
      setError(inputMode === 'PHONE' ? 'Please enter your mobile number' : 'Please enter your email address');
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

      finishLogin(res.data.accessToken, res.data.user);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please verify your phone/email and password.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Google Login
  const handleGoogleSubmit = async (customEmail?: string, customName?: string) => {
    const targetEmail = customEmail || googleEmail.trim();
    const targetName = customName || googleName.trim() || 'Google User';

    if (!targetEmail || !targetEmail.includes('@')) {
      setError('Please provide a valid Google email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest<{ accessToken: string; user: any; isNewUser: boolean }>(
        '/auth/google',
        {
          method: 'POST',
          body: JSON.stringify({
            email: targetEmail.toLowerCase(),
            name: targetName,
            role: googleRole,
          }),
        }
      );

      setShowGoogleModal(false);
      finishLogin(res.data.accessToken, res.data.user);
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  // Helper to persist auth and redirect
  const finishLogin = (accessToken: string, user: any) => {
    setAuthToken(accessToken);
    setStoredUser(user);

    if (rememberMe) {
      localStorage.setItem(
        'rentflow_remembered_account',
        JSON.stringify({
          name: user.name,
          email: user.email,
          phone: user.phone || (inputMode === 'PHONE' ? `+91 ${phoneNumber.slice(-10)}` : null),
          role: user.role,
        })
      );
    }

    if (user.role === 'TENANT') {
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
      <div className="relative w-full max-w-md mx-auto pt-6 pb-5 px-6 overflow-hidden flex flex-col items-center justify-center text-center">
        {/* Ambient Glows */}
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-80 bg-gradient-to-br from-emerald-500/25 via-teal-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />

        {/* Big Bold Headline */}
        <div className="space-y-1 relative z-10">
          <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight">
            Manage &amp; Pay Rent
          </h1>
          <h2 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-emerald-400 leading-tight">
            Instantly on UPI
          </h2>
        </div>

        {/* Angled Tent Card Badge ("DIRECT UPI MODE") */}
        <div className="mt-5 mb-1 relative z-10 flex flex-col items-center">
          <div className="bg-white text-slate-900 px-4 py-2 rounded-xl shadow-2xl shadow-emerald-500/20 border-2 border-emerald-500/40 -rotate-3 hover:rotate-0 transition-transform duration-300 flex items-center gap-2">
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
          <div className="flex items-center gap-1.5 mt-3.5">
            <span className="w-4 h-1.5 rounded-full bg-emerald-400 transition-all shadow-xs shadow-emerald-400/50" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. White Bottom Sheet Card (Interactive Login Interface)                  */}
      {/* ========================================================================= */}
      <div className="w-full max-w-md mx-auto bg-white rounded-t-[36px] sm:rounded-3xl shadow-2xl p-6 sm:p-8 pt-5 text-slate-900 border-t border-slate-100 flex-1 flex flex-col justify-between">
        <div className="space-y-4">
          {/* Section A: "Choose your account" (Saved Account Fast Sign-In) */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-500 text-center block tracking-tight">
              Choose your account
            </span>

            {savedUser ? (
              <div
                onClick={handleSelectSavedAccount}
                className="w-full p-3.5 rounded-2xl border border-slate-200 bg-white hover:bg-emerald-50/40 hover:border-emerald-300 transition flex items-center justify-between cursor-pointer group shadow-2xs active:scale-98"
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

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full">
                    {savedUser.role === 'TENANT' ? 'Tenant' : 'Landlord'}
                  </span>
                  <div className="text-slate-400 group-hover:text-emerald-600 p-1">
                    <MoreVertical className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full p-3 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 flex items-center justify-between text-xs text-slate-600">
                <span className="flex items-center gap-2 font-medium">
                  <Building2 className="w-4 h-4 text-emerald-600" />
                  Instant Access for Landlords &amp; Tenants
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
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
              {inputMode === 'PHONE' ? 'Log in with Mobile Number' : 'Log in with Email'}
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Simulated SMS Notification Popup (dev/demo convenience) */}
          {step === 'OTP' && simulatedSmsOtp && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-slate-800 text-xs flex items-center justify-between animate-in slide-in-from-top-2">
              <div className="flex items-center gap-2">
                <span className="text-base">💬</span>
                <div>
                  <span className="font-bold text-emerald-900 block leading-tight">RentFlow SMS Code</span>
                  <span className="font-mono text-emerald-700 text-sm font-black">{simulatedSmsOtp}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOtp(simulatedSmsOtp)}
                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[11px] shadow-xs transition"
              >
                Auto-Fill
              </button>
            </div>
          )}

          {/* ===================================================================== */}
          {/* Section C1: STEP = 'OTP' (Phone OTP Verification Screen)              */}
          {/* ===================================================================== */}
          {step === 'OTP' ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
              <div className="text-center space-y-1">
                <p className="text-xs text-slate-600">
                  Enter the 6-digit code sent to{' '}
                  <span className="font-bold text-slate-900">+91 {phoneNumber.slice(-10)}</span>
                </p>
              </div>

              {/* 6-Digit OTP Input */}
              <div className="flex items-center px-4 py-3 rounded-2xl border border-slate-200 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 bg-white transition shadow-2xs">
                <KeyRound className="w-4 h-4 text-emerald-600 mr-2.5 shrink-0" />
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Enter 6-digit OTP (e.g. 123456)"
                  className="w-full text-center text-lg font-black tracking-widest text-slate-900 placeholder:text-slate-400 placeholder:font-normal placeholder:tracking-normal focus:outline-none bg-transparent"
                />
              </div>

              <div className="flex items-center justify-between text-xs px-1">
                <button
                  type="button"
                  onClick={() => handleSendOtp()}
                  disabled={otpCooldown > 0 || loading}
                  className="text-emerald-700 hover:text-emerald-800 font-bold disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  {otpCooldown > 0 ? `Resend OTP in ${otpCooldown}s` : 'Resend OTP'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('PASSWORD')}
                  className="text-slate-500 hover:text-slate-800 font-medium"
                >
                  Use Password Instead
                </button>
              </div>

              {/* Verify OTP Button */}
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full py-4 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-950/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="flex items-center gap-1.5">
                    <span>Verify &amp; Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setStep('IDENTIFIER');
                    setError(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                >
                  Change phone number
                </button>
              </div>
            </form>
          ) : (
            /* ===================================================================== */
            /* Section C2: STEP = 'IDENTIFIER' or 'PASSWORD'                         */
            /* ===================================================================== */
            <form onSubmit={step === 'PASSWORD' ? handlePasswordLogin : (e) => { e.preventDefault(); handleSendOtp(); }} className="space-y-3.5">
              {inputMode === 'PHONE' ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {/* Indian Flag dropdown box */}
                    <div className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xs shrink-0 select-none">
                      <span className="text-lg">🇮🇳</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>

                    {/* Phone input with +91 prefix */}
                    <div className="flex-1 flex items-center px-4 py-3 rounded-2xl border border-slate-200 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 bg-white transition shadow-2xs">
                      <span className="text-slate-800 font-bold text-sm mr-2 select-none">+91</span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="Enter 10-digit Mobile Number"
                        className="w-full text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                /* Email Input */
                <div className="space-y-1">
                  <div className="flex items-center px-4 py-3 rounded-2xl border border-slate-200 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 bg-white transition shadow-2xs">
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

              {/* Password Field (when in PASSWORD step or in EMAIL mode) */}
              {(step === 'PASSWORD' || inputMode === 'EMAIL') && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center px-4 py-3 rounded-2xl border border-slate-200 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/20 bg-white transition shadow-2xs">
                    <Lock className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter Password"
                      autoFocus={step === 'PASSWORD'}
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

                  {inputMode === 'PHONE' && (
                    <div className="flex items-center justify-between pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleSendOtp()}
                        className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800"
                      >
                        Sign in via SMS OTP instead
                      </button>

                      <button
                        type="button"
                        onClick={() => setStep('IDENTIFIER')}
                        className="text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                      >
                        Change number
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Remember Me Checkbox */}
              <div className="flex items-center gap-2 pt-1 select-none">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 focus:ring-0 cursor-pointer"
                />
                <label
                  htmlFor="rememberMe"
                  className="text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Remember my login for faster sign-in
                </label>
              </div>

              {/* Primary Action Button */}
              {step === 'PASSWORD' || inputMode === 'EMAIL' ? (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-emerald-950/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <span>Sign In with Password</span>
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </button>
              ) : (
                <div className="grid grid-cols-1 gap-2 pt-1">
                  {/* Option 1: Continue via Instant OTP (Default Mobile Flow) */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-extrabold text-sm shadow-lg shadow-emerald-950/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4" />
                        <span>Continue with Fast OTP</span>
                      </span>
                    )}
                  </button>

                  {/* Option 2: Enter Password Instead */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!phoneNumber || phoneNumber.replace(/[^0-9]/g, '').length < 10) {
                        setError('Please enter a valid 10-digit mobile number first');
                        return;
                      }
                      setStep('PASSWORD');
                      setError(null);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition"
                  >
                    Log in with Password
                  </button>
                </div>
              )}
            </form>
          )}

          {/* Section D: Social / Alternate Login Options (Google, Email Icon) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-center gap-4">
              {/* Google Button */}
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setShowGoogleModal(true);
                }}
                title="Sign in with Google"
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

              {/* Email / Phone Mode Switch Button */}
              <button
                type="button"
                onClick={() => {
                  setInputMode(inputMode === 'PHONE' ? 'EMAIL' : 'PHONE');
                  setStep('IDENTIFIER');
                  setError(null);
                }}
                title={inputMode === 'PHONE' ? 'Switch to Email Sign-In' : 'Switch to Mobile Number Sign-In'}
                className="w-12 h-12 rounded-full border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center shadow-2xs transition active:scale-95 group text-emerald-600 hover:text-emerald-700 hover:border-emerald-300"
              >
                {inputMode === 'PHONE' ? (
                  <Mail className="w-5 h-5 group-hover:scale-105 transition" />
                ) : (
                  <Smartphone className="w-5 h-5 group-hover:scale-105 transition" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 text-center">
              {inputMode === 'PHONE' ? 'Or tap Mail for Email login, or Google for 1-tap sign-in' : 'Or tap Phone for Mobile number OTP, or Google for 1-tap sign-in'}
            </p>
          </div>

          {/* Registration Link */}
          <div className="text-center pt-1 text-xs">
            <span className="text-slate-500">Don&apos;t have an account? </span>
            <Link
              href="/register"
              className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Sign Up Free (Landlord or Tenant)
            </Link>
          </div>
        </div>

        {/* Section G: Legal Footer */}
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
      {/* 3. Interactive Google Sign-In Modal                                       */}
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
              <h3 className="text-base font-bold text-slate-900">Sign in with Google</h3>
              <p className="text-xs text-slate-500">Choose an account to continue to RentFlow</p>
            </div>

            {/* Quick 1-Tap Google Accounts */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => handleGoogleSubmit('rahul.landlord@gmail.com', 'Rahul Sharma')}
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
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full group-hover:bg-emerald-100 group-hover:text-emerald-800">
                  Landlord
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleGoogleSubmit('priya.tenant@gmail.com', 'Priya Verma')}
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
                <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full group-hover:bg-emerald-100 group-hover:text-emerald-800">
                  Tenant
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

              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setGoogleRole('LANDLORD')}
                  className={`py-1.5 rounded-lg border font-bold text-[11px] transition ${
                    googleRole === 'LANDLORD' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-500'
                  }`}
                >
                  As Landlord
                </button>
                <button
                  type="button"
                  onClick={() => setGoogleRole('TENANT')}
                  className={`py-1.5 rounded-lg border font-bold text-[11px] transition ${
                    googleRole === 'TENANT' ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-slate-200 text-slate-500'
                  }`}
                >
                  As Tenant
                </button>
              </div>

              <button
                type="button"
                disabled={!googleEmail || loading}
                onClick={() => handleGoogleSubmit()}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition disabled:opacity-40"
              >
                Sign In with this Google Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
