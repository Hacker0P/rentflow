'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, User, KeyRound, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';
import { apiRequest, setAuthToken, setStoredUser } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [role, setRole] = useState<'LANDLORD' | 'TENANT'>('LANDLORD');
  const [email, setEmail] = useState('rahul.sharma@example.com');
  const [password, setPassword] = useState('Password123!');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest<{ accessToken: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      setAuthToken(res.data.accessToken);
      setStoredUser(res.data.user);

      if (res.data.user?.role === 'TENANT') {
        router.push('/tenant');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-200/80 overflow-hidden">
        {/* Brand Header */}
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 p-8 text-white text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 mb-4 shadow-inner">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">RentFlow</h1>
          <p className="text-slate-400 text-xs mt-1">Rent & Maintenance Collection Platform</p>

          {/* Role Segmented Switcher */}
          <div className="mt-6 p-1 bg-white/10 rounded-2xl flex items-center backdrop-blur-md border border-white/10">
            <button
              type="button"
              onClick={() => handleRoleChange('LANDLORD')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                role === 'LANDLORD'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Landlord Portal
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('TENANT')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                role === 'TENANT'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Tenant App
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900">
              {role === 'LANDLORD' ? 'Sign in as Landlord' : 'Sign in as Tenant'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {role === 'LANDLORD'
                ? 'Manage rental buildings, occupancy, and batch billing.'
                : 'View current rent, pay instantly via UPI, and download tax receipts.'}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2.5 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to {role === 'LANDLORD' ? 'Command Center' : 'Tenant App'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Help */}
          <div className="mt-6 p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span>Demo: Auto-filled for testing</span>
            <span className="font-mono text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">Password123!</span>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Need a landlord account?{' '}
            <Link href="/register" className="font-bold text-emerald-600 hover:text-emerald-700">
              Create Landlord Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
