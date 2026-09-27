'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  ArrowRight,
  Lock,
  Mail,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  ArrowLeft,
  Sparkles,
  QrCode,
  Receipt,
} from 'lucide-react';
import { apiRequest, setAuthToken, setStoredUser } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest<{ accessToken: string; user: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      setAuthToken(res.data.accessToken);
      setStoredUser(res.data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. An account with this email may already exist.');
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
          <span>100% Free Setup</span>
        </div>
      </div>

      {/* Main Registration Card */}
      <div className="max-w-md w-full mx-auto bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800/80 shadow-2xl shadow-black/60 overflow-hidden">
        {/* Brand Banner Header */}
        <div className="p-6 sm:p-8 pb-5 text-center border-b border-slate-800/60 bg-gradient-to-b from-emerald-950/30 to-transparent">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white mb-3 shadow-lg shadow-emerald-950/60 border border-emerald-400/30">
            <Building2 className="w-7 h-7" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Landlord Account</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Create Your Free Account</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Start managing properties, collecting rent via UPI, and sending automated WhatsApp receipts in under a minute.
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 pt-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-rose-300 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/70 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition font-medium"
                />
              </div>
            </div>

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
                  placeholder="e.g. rahul@example.com"
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
                  {password.length >= 6 ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Min 6 chars
                    </span>
                  ) : (
                    <span>Min 6 characters</span>
                  )}
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
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
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 text-white font-extrabold text-sm shadow-xl shadow-emerald-950/60 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Free Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Value Perks */}
          <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>0% Gateway Fees</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Direct UPI to Bank</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>WhatsApp Reminders</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Instant HRA Receipts</span>
            </div>
          </div>

          {/* Reassurance Box for Tenants */}
          <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0 mt-0.5 font-bold">
              ?
            </div>
            <div className="leading-snug">
              <span className="font-bold text-slate-200 block">Are you a Tenant paying rent?</span>
              <span>
                You don&apos;t need to register! Your landlord creates your flat login.{' '}
                <Link href="/login" className="text-teal-400 hover:text-teal-300 font-bold underline">
                  Sign in here
                </Link>
              </span>
            </div>
          </div>

          <div className="pt-1 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-2"
            >
              Sign In
            </Link>
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
