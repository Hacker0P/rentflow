'use client';

import { useState, useEffect, useRef } from 'react';
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
  Camera,
  Upload,
  Trash2,
  Image as ImageIcon,
  Check,
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
  qrImageUrl: string | null;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [upiId, setUpiId] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [qrImageUrl, setQrImageUrl] = useState('');

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
        setQrImageUrl(res.data.qrImageUrl || '');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load profile details');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Please select an image smaller than 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Compress using offscreen canvas to max 600x600 for instant mobile loading
        const canvas = document.createElement('canvas');
        const maxDim = 600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setQrImageUrl(compressedDataUrl);
          setErrorMessage('');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQrImage = () => {
    setQrImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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
          qrImageUrl: qrImageUrl || '',
        }),
      });

      if (res.data) {
        setProfile(res.data);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4500);
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

  const sampleQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    sampleUpiUrl
  )}`;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Banner */}
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          Payout & Account Settings
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure how tenants pay you. These details populate automatically across all digital bills, UPI QR codes, and HRA tax receipts.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 shadow-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="text-xs font-bold">
            Settings saved successfully! Future invoices, tenant UPI links, and custom QR codes are now active.
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 shadow-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <div className="text-xs font-semibold">{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* ========================================================================= */}
        {/* Section 1: UPI & Custom QR Code Photo Upload                              */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Instant UPI & QR Code Collection
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  Tenants scan via Google Pay, PhonePe, Paytm, or BHIM.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <Sparkles className="w-3 h-3 text-emerald-600" /> 0% Gateway Fee
            </span>
          </div>

          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {/* UPI ID Field */}
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
                      className="absolute right-3 top-3 text-xs text-slate-400 hover:text-emerald-600 flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200 font-semibold active:scale-95 transition"
                    >
                      {copiedUpi ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  100% of rent goes straight to your bank account without any intermediary holding funds.
                </p>
              </div>

              {/* Upload QR Photo Card */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-600" />
                    <span>Upload Your Own Payment QR Photo</span>
                  </span>
                  {qrImageUrl && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Custom QR Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Have a printed QR stand or screenshot from PhonePe, GPay, or Paytm? Upload it directly from your phone gallery or take a photo. This exact photo will be shown to your tenants!
                </p>

                {/* Upload & Remove Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="qr-upload-input"
                  />

                  <label
                    htmlFor="qr-upload-input"
                    className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-950/20 transition text-center"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{qrImageUrl ? 'Change QR Photo' : 'Upload QR from Photos / Camera'}</span>
                  </label>

                  {qrImageUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveQrImage}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 active:scale-95 text-rose-700 text-xs font-bold border border-rose-200 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>Remove Photo</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* QR Code Visual Preview Box */}
            <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 border border-slate-200 text-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                Tenant QR Display
              </span>

              <div className="w-40 h-40 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrImageUrl || sampleQrUrl}
                  alt="Tenant Payment QR Code"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>

              <div className="mt-3 space-y-1">
                <span className="text-xs font-bold text-slate-900 block truncate max-w-[190px]">
                  {name || 'Landlord Name'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block truncate max-w-[190px] border bg-emerald-50 text-emerald-800 border-emerald-200">
                  {qrImageUrl ? 'Photo QR Active' : upiId || 'upi-id@bank'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Section 2: Direct Bank Account (Wire Transfer / IMPS / NEFT)              */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Direct Bank Account (NEFT / IMPS)
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Optional payout details displayed on monthly bills for bank transfers.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
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
                onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                placeholder="e.g. HDFC0000123"
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-bold font-mono text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Section 3: Tax Compliance (PAN for HRA Receipts)                         */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Income Tax PAN & HRA Exemption
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500">
                  Required for valid Section 10(13A) rent receipts when annual rent exceeds ₹1 Lakh.
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" /> Sec 10(13A)
            </span>
          </div>

          <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-start">
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

            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-950 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-amber-900">
                <ShieldCheck className="w-4 h-4 text-amber-600" /> Why this matters:
              </span>
              <p className="text-[11px] leading-relaxed text-amber-900/90">
                Salaried tenants must submit their landlord&apos;s PAN to HR for income tax exemption. Adding this once saves your tenants from repeatedly asking for your PAN!
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Section 4: Landlord Profile & Contact                                     */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Landlord Profile & Notifications
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Used in WhatsApp rent reminders and tenant communication channels.
              </p>
            </div>
          </div>

          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
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
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition font-mono"
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-xs text-slate-500 text-center sm:text-left">
            Changes are securely stored and synced across tenant apps immediately.
          </p>
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-sm shadow-lg shadow-emerald-950/20 transition disabled:opacity-50"
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
