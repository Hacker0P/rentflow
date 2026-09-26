'use client';

import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import {
  QrCode,
  Building,
  CreditCard,
  FileText,
  User,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

interface ProfileData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  upiId: string | null;
  panNumber: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [upiId, setUpiId] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<ProfileData>('/users/profile');
      if (res.data) {
        setProfile(res.data);
        setName(res.data.name || '');
        setPhone(res.data.phone || '');
        setUpiId(res.data.upiId || '');
        setPanNumber(res.data.panNumber || '');
        setBankName(res.data.bankName || '');
        setBankAccountNumber(res.data.bankAccountNumber || '');
        setBankIfsc(res.data.bankIfsc || '');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setErrorMessage('');

    try {
      const res = await apiRequest<ProfileData>('/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || undefined,
          upiId: upiId.trim() || undefined,
          panNumber: panNumber.trim().toUpperCase() || undefined,
          bankName: bankName.trim() || undefined,
          bankAccountNumber: bankAccountNumber.trim() || undefined,
          bankIfsc: bankIfsc.trim().toUpperCase() || undefined,
        }),
      });

      if (res.data) {
        setProfile(res.data);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const copyUpiToClipboard = () => {
    if (!upiId) return;
    navigator.clipboard.writeText(upiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500">Loading payout settings...</p>
        </div>
      </div>
    );
  }

  const sampleUpiUrl = `upi://pay?pa=${encodeURIComponent(upiId || 'landlord@upi')}&pn=${encodeURIComponent(
    name || 'Landlord'
  )}&cu=INR`;

  const sampleQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    sampleUpiUrl
  )}`;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Top Banner */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Payout & Account Settings</h2>
        <p className="text-sm text-slate-500 mt-1">
          Configure how tenants pay you. These details populate automatically across all digital bills, UPI QR codes, and HRA tax receipts.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs font-semibold">
            Settings saved successfully! Future invoices, tenant UPI links, and tax receipts will reflect these details immediately.
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 shadow-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="text-xs font-semibold">{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Section 1: UPI Payments & Live QR Code */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Instant UPI Collection Details</h3>
                <p className="text-xs text-slate-500">
                  Tenants can scan with Google Pay, PhonePe, Paytm, or BHIM to pay rent in seconds.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Sparkles className="w-3 h-3 text-emerald-600" /> Zero Gateway Fee
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Your UPI ID (VPA) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                  />
                  {upiId && (
                    <button
                      type="button"
                      onClick={copyUpiToClipboard}
                      className="absolute right-3 top-3 text-xs text-slate-400 hover:text-emerald-600 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200"
                    >
                      <Copy className="w-3 h-3" />
                      {copiedUpi ? 'Copied' : 'Copy'}
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Money transfers directly to your linked bank account with 0% platform deductions.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">How Tenants Experience This:</span>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>Tenant clicks &quot;Pay Rent&quot; on mobile &rarr; UPI apps (GPay / PhonePe) launch automatically.</li>
                  <li>On laptop/desktop &rarr; Dynamic QR code displays with the exact rent balance prefilled.</li>
                  <li>Tenant submits the transaction UTR number for your 1-click confirmation.</li>
                </ul>
              </div>
            </div>

            {/* Live QR Code Preview Card */}
            <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-200 text-center">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">
                Live Tenant Preview
              </span>
              <div className="w-36 h-36 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sampleQrUrl}
                  alt="Live UPI QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-xs font-bold text-slate-900 mt-3 truncate max-w-[180px]">
                {name || 'Your Name'}
              </span>
              <span className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full mt-1 max-w-[180px] truncate border border-emerald-200">
                {upiId || 'upi-id@bank'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Bank Account (Wire Transfer / IMPS / NEFT) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Direct Bank Account (NEFT / IMPS)</h3>
              <p className="text-xs text-slate-500">
                Alternative payment option displayed on monthly bills for corporate tenants or large amounts.
              </p>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Bank Name
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. HDFC Bank, ICICI Bank"
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Account Number
              </label>
              <input
                type="text"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder="e.g. 50100492817291"
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                IFSC Code
              </label>
              <input
                type="text"
                value={bankIfsc}
                onChange={(e) => setBankIfsc(e.target.value)}
                placeholder="e.g. HDFC0000123"
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-medium font-mono text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Tax Compliance (PAN for HRA Receipts) */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Income Tax PAN & HRA Exemption</h3>
                <p className="text-xs text-slate-500">
                  Required for valid Indian Income Tax HRA rent receipts when annual rent exceeds ₹1,00,000.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" /> Sec 10(13A) Compliant
            </span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Landlord PAN Number
              </label>
              <input
                type="text"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                placeholder="e.g. ABCPS1234F"
                maxLength={10}
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-bold font-mono tracking-wider text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                This PAN appears automatically on all generated monthly rent receipts and annual HRA certificates.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs text-amber-950 space-y-1.5">
              <span className="font-bold flex items-center gap-1.5 text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-600" /> Why this matters to your tenants:
              </span>
              <p className="text-[11px] leading-relaxed text-amber-900/90">
                Under Section 10(13A) of the Income Tax Act, salaried employees must submit their landlord&apos;s PAN to HR if their annual rent exceeds ₹1 Lakh. Adding this once saves your tenants from repeated WhatsApp messages asking for your PAN!
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Landlord Profile & Contact */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Landlord Profile & Notifications</h3>
              <p className="text-xs text-slate-500">
                Used in WhatsApp rent reminders and tenant communication channels.
              </p>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rahul Sharma"
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Phone Number (WhatsApp)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91-9811223344"
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Account Email (Login)
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-100 text-sm font-medium text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Action Bottom Bar */}
        <div className="flex items-center justify-between pt-4">
          <p className="text-xs text-slate-500">
            Changes are securely stored and synced across tenant apps immediately.
          </p>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-lg shadow-emerald-950/20 transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Preferences...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Save All Preferences</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
