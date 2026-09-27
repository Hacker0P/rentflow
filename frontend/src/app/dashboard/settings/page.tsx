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
  Smartphone,
  Download,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
  const [imageError, setImageError] = useState(false);

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

        const rawQr =
          res.data.qrImageUrl ||
          (typeof window !== 'undefined' ? localStorage.getItem('rentflow_landlord_qr') : null);

        if (
          rawQr &&
          (rawQr.startsWith('data:image/') || rawQr.startsWith('http://') || rawQr.startsWith('https://')) &&
          !rawQr.includes('TEST_QR_PHOTO')
        ) {
          setQrImageUrl(rawQr);
          setImageError(false);
        } else {
          setQrImageUrl('');
          setImageError(false);
          if (typeof window !== 'undefined') localStorage.removeItem('rentflow_landlord_qr');
        }
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
          setImageError(false);
          if (typeof window !== 'undefined') {
            localStorage.setItem('rentflow_landlord_qr', compressedDataUrl);
          }
          setErrorMessage('');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveQrImage = () => {
    setQrImageUrl('');
    setImageError(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rentflow_landlord_qr');
    }
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
      if (typeof window !== 'undefined') {
        if (qrImageUrl) {
          localStorage.setItem('rentflow_landlord_qr', qrImageUrl);
        } else {
          localStorage.removeItem('rentflow_landlord_qr');
        }
      }

      await apiRequest('/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim() || null,
          upiId: upiId.trim() || null,
          panNumber: panNumber.trim().toUpperCase() || null,
          bankName: bankName.trim() || null,
          bankAccountNumber: bankAccountNumber.trim() || null,
          bankIfsc: bankIfsc.trim().toUpperCase() || null,
          qrImageUrl: qrImageUrl || null,
        }),
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      await fetchProfile();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save settings');
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
      <div className="flex h-56 items-center justify-center">
        <div className="flex flex-col items-center gap-2.5">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-blue-600 border-t-transparent" />
          <p className="text-xs text-slate-500 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Payout & Account Settings</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Configure direct UPI payouts with 0% gateway deductions, bank details, and landlord tax receipts.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>All changes and payout details have been saved successfully!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: UPI ID Setup */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/80">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>Direct UPI Payment ID</CardTitle>
                <CardDescription>
                  Tenants pay directly to this UPI address with 0% gateway commissions.
                </CardDescription>
              </div>
            </div>
            <Badge variant="success" size="sm">
              0% Fee
            </Badge>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Your UPI VPA / Handle *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value.toLowerCase().trim())}
                  placeholder="e.g. rahul@okaxis, 9811223344@paytm"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                  required
                />
                {upiId && (
                  <button
                    type="button"
                    onClick={copyUpiToClipboard}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 text-xs font-medium flex items-center gap-1 rounded-lg hover:bg-slate-100"
                  >
                    {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedUpi ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                Supports Google Pay, PhonePe, Paytm, BHIM, CRED, Amazon Pay, or any Indian banking app.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: QR Code Upload */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-200/80">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>Physical Standee / QR Photo</CardTitle>
                <CardDescription>
                  Upload a photo of your GPay/PhonePe standee QR code to display in tenant payment flows.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Preview Area */}
              <div className="w-36 h-36 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 relative group">
                {qrImageUrl && !imageError ? (
                  <>
                    <img
                      src={qrImageUrl}
                      alt="Landlord Payment QR"
                      className="w-full h-full object-contain p-2"
                      onError={() => setImageError(true)}
                    />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 rounded-xl bg-white text-slate-800 shadow-md hover:scale-105 transition"
                        title="Replace Photo"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveQrImage}
                        className="p-2 rounded-xl bg-rose-600 text-white shadow-md hover:scale-105 transition"
                        title="Remove Photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-3 text-slate-400">
                    <ImageIcon className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                    <span className="text-[11px] block font-medium">No QR Uploaded</span>
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="space-y-2 flex-1 text-center sm:text-left">
                <Button
                  type="button"
                  variant="outline"
                  size="md"
                  onClick={() => fileInputRef.current?.click()}
                  leftIcon={<Upload className="w-4 h-4" />}
                >
                  {qrImageUrl ? 'Change QR Photo' : 'Upload QR Standee Image'}
                </Button>
                {qrImageUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={handleRemoveQrImage}
                    leftIcon={<Trash2 className="w-4 h-4 text-rose-600" />}
                    className="ml-2 text-rose-600 hover:text-rose-700"
                  >
                    Remove
                  </Button>
                )}
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Supports JPEG, PNG, or WEBP up to 10MB. Images are automatically optimized for fast mobile loading.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Bank Account Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/80">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>Bank Account Details (NEFT / IMPS)</CardTitle>
                <CardDescription>
                  Displayed as fallback for tenants paying via corporate or net banking.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Bank Name
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="e.g. HDFC Bank, ICICI Bank"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Account Number
              </label>
              <input
                type="text"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder="e.g. 50100298112233"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                IFSC Code
              </label>
              <input
                type="text"
                value={bankIfsc}
                onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                placeholder="e.g. HDFC0001234"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Income Tax PAN */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/80">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>Landlord PAN (For Tenant HRA Exemption)</CardTitle>
                <CardDescription>
                  Printed automatically on monthly rent receipts and annual HRA declaration forms.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                10-Digit PAN Number
              </label>
              <input
                type="text"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                placeholder="e.g. ABCDE1234F"
                maxLength={10}
                className="w-full sm:w-72 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono uppercase tracking-wider text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Salaried tenants require their landlord&apos;s PAN to claim HRA tax deduction from their employers.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 5: Profile Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200/80">
                <User className="w-4 h-4" />
              </div>
              <div>
                <CardTitle>Landlord Profile</CardTitle>
                <CardDescription>
                  Used in tenant notices, invoice signatures, and WhatsApp templates.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rahul Sharma"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Phone Number (WhatsApp)
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91-9811223344"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Login Email
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 6: Mobile PWA Card */}
        <div className="bg-slate-950 rounded-2xl border border-slate-800 text-white p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md shadow-blue-950/40">
                <Smartphone className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-white">RentFlow Mobile App (PWA)</h3>
                  <Badge variant="brand" size="sm">
                    PWA
                  </Badge>
                </div>
                <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                  Install RentFlow on your Android phone or iPhone home screen. Launches fullscreen with 1-tap and no browser URL bar.
                </p>
                <div className="flex items-center gap-3 pt-1 text-[11px] text-blue-400 font-medium">
                  <span>✓ 1-Tap Home Screen</span>
                  <span>✓ Standalone Fullscreen</span>
                  <span>✓ Android &amp; iOS</span>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new Event('rentflow-trigger-pwa-install'));
                }
              }}
              leftIcon={<Download className="w-4 h-4" />}
              className="w-full sm:w-auto shrink-0"
            >
              Install App on Phone
            </Button>
          </div>
        </div>

        {/* Action Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-xs text-slate-500 text-center sm:text-left">
            Preferences sync immediately across tenant rent apps and receipts.
          </p>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={saving}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            className="w-full sm:w-auto px-8"
          >
            Save All Preferences
          </Button>
        </div>
      </form>
    </div>
  );
}
