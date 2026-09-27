'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  User,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { apiRequest, setAuthToken, setStoredUser } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<'LANDLORD' | 'TENANT'>('LANDLORD');
  const [email, setEmail] = useState('rahul.sharma@example.com');
  const [password, setPassword] = useState('Password123!');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoleChange = (newRole: 'LANDLORD' | 'TENANT') => {
    setRole(newRole);
    setError(null);
    if (newRole === 'LANDLORD') {
      setEmail('rahul.sharma@example.com');
      setPassword('Password123!');
    } else {
      setEmail('amit.kumar@example.com');
      setPassword('Password123!');
    }
  };

  const handleFillDemo = (targetRole: 'LANDLORD' | 'TENANT') => {
    handleRoleChange(targetRole);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest<{ accessToken: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });

      setAuthToken(res.data.accessToken);
      setStoredUser(res.data.user);

      if (res.data.user?.role === 'TENANT') {
        router.push('/tenant');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col justify-between p-4 sm:p-6 text-white selection:bg-emerald-500 selection:text-white">
      {/* Top Bar with Back Link */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-2 pb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition px-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>

        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>256-bit Secure</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800/80 shadow-2xl shadow-black/60 overflow-hidden">
        {/* Brand Banner Header */}
        <div className="p-6 sm:p-8 pb-5 text-center border-b border-slate-800/60 bg-gradient-to-b from-emerald-950/30 to-transparent">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white mb-3 shadow-lg shadow-emerald-950/60 border border-emerald-400/30">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Welcome to RentFlow</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Sign in to manage your properties, pay rent, or download official HRA tax receipts.
          </p>

          {/* Role Switcher Tabs */}
          <div className="mt-5 p-1 bg-slate-950/80 rounded-2xl flex items-center border border-slate-800">
            <button
              type="button"
              onClick={() => handleRoleChange('LANDLORD')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                role === 'LANDLORD'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>I&apos;m a Landlord</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('TENANT')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                role === 'TENANT'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-4 h-4" />
              <span>I&apos;m a Tenant</span>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 pt-5 space-y-5">
          {/* Active Mode Notice */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              {role === 'LANDLORD' ? (
                <>
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" /> Landlord Overview & Portal
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-teal-400" /> Tenant Portal & UPI Pay
                </>
              )}
            </span>
            <span className="text-[11px] text-slate-400">
              {role === 'LANDLORD' ? 'Owner / Manager' : 'Resident / Renter'}
            </span>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-rose-300 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/70 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                <span className="text-[11px] text-slate-500">
                  Default test: <code className="text-emerald-400 font-mono">Password123!</code>
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-3 rounded-2xl bg-slate-950/70 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 p-0.5 text-slate-400 hover:text-white transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 rounded-2xl font-extrabold text-sm transition flex items-center justify-center gap-2 shadow-lg active:scale-98 disabled:opacity-50 ${
                role === 'LANDLORD'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
                  : 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-950/50'
              }`}
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In as {role === 'LANDLORD' ? 'Landlord' : 'Tenant'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 1-Tap Quick Demo Autofill Helpers */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1 font-semibold text-slate-300">
                <Sparkles className="w-3 h-3 text-emerald-400" /> Quick Demo 1-Tap Access:
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('LANDLORD')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5 ${
                  role === 'LANDLORD'
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-[11px] font-bold flex items-center gap-1">
                  🏢 Rahul (Owner)
                  {role === 'LANDLORD' && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                </span>
                <span className="text-[10px] text-slate-400 font-mono truncate">
                  rahul.sharma@example.com
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleFillDemo('TENANT')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col gap-0.5 ${
                  role === 'TENANT'
                    ? 'bg-teal-950/40 border-teal-500/40 text-teal-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span className="text-[11px] font-bold flex items-center gap-1">
                  🏠 Amit (Tenant)
                  {role === 'TENANT' && <CheckCircle2 className="w-3 h-3 text-teal-400 shrink-0" />}
                </span>
                <span className="text-[10px] text-slate-400 font-mono truncate">
                  amit.kumar@example.com
                </span>
              </button>
            </div>
          </div>

          {/* Registration & Tenant Help */}
          <div className="pt-2 text-center space-y-2 text-xs">
            <p className="text-slate-400">
              Need a landlord account?{' '}
              <Link
                href="/register"
                className="font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
              >
                Create Landlord Account Free
              </Link>
            </p>
            <p className="text-[11px] text-slate-500 leading-tight">
              Are you a tenant? Your owner creates your flat access. Simply ask your landlord for your registered email address.
            </p>
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="max-w-md w-full mx-auto text-center py-4 text-[11px] text-slate-500">
        © {new Date().getFullYear()} RentFlow Platform. All rights reserved.
      </div>
    </div>
  );
}
