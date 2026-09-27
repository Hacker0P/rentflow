'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Copy,
  Check,
  Send,
  Calendar,
  User,
  Building,
  Clock,
  AlertTriangle,
  HeartHandshake,
  CalendarCheck,
  CheckCircle2,
  Receipt,
  Sparkles,
} from 'lucide-react';

export interface WhatsAppReminderData {
  invoiceId: string;
  tenantName: string;
  tenantPhone: string;
  unitNumber: string;
  propertyName?: string;
  amount: number;
  dueDate: string;
  upiId?: string;
  daysOverdue?: number;
  isPaid?: boolean;
  paidAmount?: number;
  billingMonth?: string;
  paymentMethod?: string;
  transactionReference?: string;
}

interface WhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: WhatsAppReminderData | null;
}

export type TemplateType = 'GENTLE' | 'DUE_TODAY' | 'OVERDUE' | 'RECEIPT';

export function openWhatsAppDirect(phone: string, text: string) {
  let cleanPhone = (phone || '').replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`;
  }
  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank', 'noopener,noreferrer');
}

export function WhatsAppModal({ isOpen, onClose, data }: WhatsAppModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('GENTLE');
  const [message, setMessage] = useState('');
  const [copied, setCopied] = useState(false);

  // Compute days overdue or until due
  const getDueCalculations = () => {
    if (!data?.dueDate) return { isOverdue: false, isDueToday: false, diffDays: 0, daysOverdue: 0 };
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const due = new Date(data.dueDate);
    due.setHours(0, 0, 0, 0);

    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return {
      isOverdue: diffDays < 0,
      isDueToday: diffDays === 0,
      diffDays,
      daysOverdue: diffDays < 0 ? Math.abs(diffDays) : 0,
    };
  };

  useEffect(() => {
    if (!data) return;

    if (data.isPaid) {
      setSelectedTemplate('RECEIPT');
      setMessage(generateTemplateText('RECEIPT', data));
      return;
    }

    const { isOverdue, isDueToday } = getDueCalculations();
    let initialType: TemplateType = 'GENTLE';
    if (isOverdue) initialType = 'OVERDUE';
    else if (isDueToday) initialType = 'DUE_TODAY';

    setSelectedTemplate(initialType);
    setMessage(generateTemplateText(initialType, data));
  }, [data]);

  const generateTemplateText = (type: TemplateType, item: WhatsAppReminderData) => {
    const formattedAmount = `₹${Number(item.amount).toLocaleString('en-IN')}`;
    const formattedDate = new Date(item.dueDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://rentflow.in';
    const payLink = `${origin}/pay/${item.invoiceId}`;
    const upiDetails = item.upiId ? `\n\nDirect UPI ID: ${item.upiId}` : '';

    switch (type) {
      case 'RECEIPT': {
        const paidAmt = `₹${Number(item.paidAmount || item.amount).toLocaleString('en-IN')}`;
        const method = item.paymentMethod || 'UPI';
        const ref = item.transactionReference ? `\nRef: ${item.transactionReference}` : '';
        return `Namaste ${item.tenantName} Ji,\n\nWe have received your rent payment of *${paidAmt}* for Unit ${item.unitNumber} (${item.propertyName || 'Property'}).\n\nMethod: ${method}${ref}\n\nYou can view and download your verified rent receipt here:\n${payLink}\n\nThank you!\n- RentFlow`;
      }
      case 'DUE_TODAY':
        return `Namaste ${item.tenantName} Ji,\n\nThis is a friendly reminder that rent of *${formattedAmount}* for Unit ${item.unitNumber} (${item.propertyName || 'Property'}) is due today (*${formattedDate}*).${upiDetails}\n\nYou can review your invoice and pay with 1-tap via GPay/PhonePe here:\n${payLink}\n\nThank you,\n- RentFlow`;

      case 'OVERDUE': {
        const overdueDays = item.daysOverdue || Math.max(1, getDueCalculations().daysOverdue);
        return `Dear ${item.tenantName},\n\nYour rent payment of *${formattedAmount}* for Unit ${item.unitNumber} was due on *${formattedDate}* and is now *${overdueDays} days overdue*.${upiDetails}\n\nPlease clear the balance immediately via UPI here:\n${payLink}\n\nIf you have already paid, please share the transaction reference with us.\n\nRegards,\n- RentFlow Management`;
      }

      case 'GENTLE':
      default:
        return `Hello ${item.tenantName},\n\nHope you are having a wonderful week! This is a gentle reminder that the monthly rent of *${formattedAmount}* for Unit ${item.unitNumber} (${item.propertyName || 'Property'}) is due on *${formattedDate}*.${upiDetails}\n\nYou can view your breakdown and pay easily here:\n${payLink}\n\nWarm regards,\n- RentFlow`;
    }
  };

  const handleTemplateChange = (type: TemplateType) => {
    setSelectedTemplate(type);
    if (data) {
      setMessage(generateTemplateText(type, data));
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = message;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenWhatsApp = () => {
    if (!data) return;
    openWhatsAppDirect(data.tenantPhone, message);
    onClose();
  };

  if (!isOpen || !data) return null;

  const { isOverdue, isDueToday, diffDays, daysOverdue } = getDueCalculations();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-900 leading-snug">
                {data.isPaid ? 'Send WhatsApp Receipt' : 'WhatsApp Rent Reminder'}
              </h3>
              <p className="text-xs text-slate-500">
                1-Click formatted message for {data.tenantName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tenant Summary Banner */}
        <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2.5 text-slate-600">
            <span className="flex items-center gap-1 font-semibold text-slate-900">
              <User className="w-3.5 h-3.5 text-slate-500" />
              {data.tenantName}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              Unit {data.unitNumber}
            </span>
            <span>•</span>
            <span className="font-semibold text-emerald-600 font-mono tabular-nums">
              ₹{Number(data.isPaid ? data.paidAmount || data.amount : data.amount).toLocaleString('en-IN')}
            </span>
          </div>

          <div>
            {data.isPaid ? (
              <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Payment Confirmed
              </span>
            ) : isOverdue ? (
              <span className="bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-600" />
                Overdue by {daysOverdue}d
              </span>
            ) : isDueToday ? (
              <span className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-600" />
                Due Today
              </span>
            ) : (
              <span className="bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Calendar className="w-3 h-3 text-blue-600" />
                Due in {diffDays}d
              </span>
            )}
          </div>
        </div>

        {/* Template Selectors */}
        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
              Choose Pre-Set Template
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleTemplateChange('RECEIPT')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between gap-1 ${
                  selectedTemplate === 'RECEIPT'
                    ? 'border-emerald-500 bg-emerald-50/50 text-slate-900 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-emerald-700">
                  <Receipt className="w-3.5 h-3.5 shrink-0" />
                  <span>Receipt</span>
                </div>
                <span className="text-[10px] text-slate-500 leading-tight">
                  Payment confirmed receipt link.
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTemplateChange('GENTLE')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between gap-1 ${
                  selectedTemplate === 'GENTLE'
                    ? 'border-blue-500 bg-blue-50/50 text-slate-900 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-blue-700">
                  <HeartHandshake className="w-3.5 h-3.5 shrink-0" />
                  <span>Gentle</span>
                </div>
                <span className="text-[10px] text-slate-500 leading-tight">
                  Polite notice before due date.
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTemplateChange('DUE_TODAY')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between gap-1 ${
                  selectedTemplate === 'DUE_TODAY'
                    ? 'border-amber-500 bg-amber-50/50 text-slate-900 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-700">
                  <CalendarCheck className="w-3.5 h-3.5 shrink-0" />
                  <span>Due Today</span>
                </div>
                <span className="text-[10px] text-slate-500 leading-tight">
                  Same-day alert with UPI link.
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleTemplateChange('OVERDUE')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between gap-1 ${
                  selectedTemplate === 'OVERDUE'
                    ? 'border-rose-500 bg-rose-50/50 text-slate-900 shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-rose-700">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Overdue</span>
                </div>
                <span className="text-[10px] text-slate-500 leading-tight">
                  Urgent notice citing days overdue.
                </span>
              </button>
            </div>
          </div>

          {/* Live Message Preview & Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Live Message Preview & Customization
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={7}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition leading-relaxed resize-none"
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-xl border border-slate-300 flex items-center gap-1.5 transition shadow-xs active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl flex items-center gap-2 shadow-xs transition active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Open in WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
