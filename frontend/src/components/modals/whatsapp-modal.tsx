'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Copy,
  Check,
  Send,
  Calendar,
  DollarSign,
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
    if (!data?.dueDate) return { isOverdue: false, isDueToday: false, diffDays: 0 };
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

  // Determine initial template and generate text
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
    const formattedAmount = Number(item.amount).toLocaleString('en-IN');
    const formattedDueDate = new Date(item.dueDate).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const propertyLabel = item.propertyName ? ` (${item.propertyName})` : '';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const payLink = `${origin}/pay/${item.invoiceId}`;
    const upi = item.upiId || 'rentflow@upi';

    const { isOverdue, daysOverdue } = getDueCalculations();
    const overdueCount = item.daysOverdue ?? (isOverdue ? daysOverdue : 3);

    switch (type) {
      case 'RECEIPT': {
        const settledAmount = Number(item.paidAmount || item.amount).toLocaleString('en-IN');
        const monthStr = item.billingMonth
          ? new Date(item.billingMonth).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
          : 'the month';
        const methodStr = item.paymentMethod ? ` (${item.paymentMethod})` : '';
        const utrStr = item.transactionReference
          ? `\n🔢 *Reference / UTR:* \`${item.transactionReference}\``
          : '';
        return (
          `✅ *RENT PAYMENT CONFIRMATION & RECEIPT*\n\n` +
          `Namaste *${item.tenantName}* Ji 🙏,\n\n` +
          `We have successfully received and verified your rent payment of *₹${settledAmount}* for *Unit ${item.unitNumber}${propertyLabel}* (${monthStr}).\n` +
          `💳 *Payment Mode:* Verified${methodStr}${utrStr}\n\n` +
          `📄 *View / Download Official Receipt:*\n${payLink}\n\n` +
          `Thank you for your timely payment! Have a great month ahead. ✨`
        );
      }

      case 'GENTLE':
        return (
          `Namaste *${item.tenantName}* Ji 🙏,\n\n` +
          `Hope you are having a wonderful week! 😊\n` +
          `This is a gentle reminder that the rent of *₹${formattedAmount}* for *Unit ${item.unitNumber}${propertyLabel}* is due on *${formattedDueDate}*.\n\n` +
          `💳 *UPI ID for Quick Transfer:*\n\`${upi}\`\n\n` +
          `🔗 *View Invoice & Pay Online:*\n${payLink}\n\n` +
          `Thank you for your timely payment! 🙏`
        );

      case 'DUE_TODAY':
        return (
          `Namaste *${item.tenantName}* Ji 🙏,\n\n` +
          `The rent payment of *₹${formattedAmount}* for *Unit ${item.unitNumber}${propertyLabel}* is *due today (${formattedDueDate})*.\n\n` +
          `💳 *UPI ID for Instant Transfer:*\n\`${upi}\`\n\n` +
          `🔗 *Submit Payment UTR & Get Receipt:*\n${payLink}\n\n` +
          `If you have already initiated the transfer, kindly reply with the transaction UTR reference. Have a great day! ✨`
        );

      case 'OVERDUE':
        return (
          `⚠️ *URGENT: OVERDUE RENT NOTICE*\n\n` +
          `Namaste *${item.tenantName}* Ji,\n\n` +
          `Your rent payment of *₹${formattedAmount}* for *Unit ${item.unitNumber}${propertyLabel}* is now *overdue by ${overdueCount} day(s)* (Due date was ${formattedDueDate}).\n\n` +
          `Please clear the pending balance at your earliest convenience:\n` +
          `💳 *UPI ID:* \`${upi}\`\n` +
          `🔗 *Confirm Payment & Clear Balance:*\n${payLink}\n\n` +
          `Kindly confirm once transferred with the bank UTR reference. Thank you.`
        );
    }
  };

  const handleTemplateChange = (type: TemplateType) => {
    if (!data) return;
    setSelectedTemplate(type);
    setMessage(generateTemplateText(type, data));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleOpenWhatsApp = () => {
    if (!data) return;
    openWhatsAppDirect(data.tenantPhone, message);
  };

  if (!isOpen || !data) return null;

  const { isOverdue, isDueToday, diffDays, daysOverdue } = getDueCalculations();

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-inner">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {data.isPaid ? 'Send WhatsApp Receipt' : 'WhatsApp Rent Reminder'}
              </h3>
              <p className="text-xs text-slate-400">
                1-Click formatted Indian templates for {data.tenantName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tenant Summary Banner */}
        <div className="bg-slate-800/60 px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-3 text-slate-300">
            <span className="flex items-center gap-1 font-semibold text-white">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              {data.tenantName}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              Unit {data.unitNumber}
            </span>
            <span>•</span>
            <span className="font-bold text-emerald-400">
              ₹{Number(data.isPaid ? data.paidAmount || data.amount : data.amount).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {data.isPaid ? (
              <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Payment Received
              </span>
            ) : isOverdue ? (
              <span className="bg-rose-500/15 border border-rose-500/30 text-rose-400 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Overdue by {daysOverdue}d
              </span>
            ) : isDueToday ? (
              <span className="bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Due Today
              </span>
            ) : (
              <span className="bg-blue-500/15 border border-blue-500/30 text-blue-400 text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Due in {diffDays}d
              </span>
            )}
          </div>
        </div>

        {/* Template Selectors */}
        <div className="p-4 sm:p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
              Choose Pre-Set Template
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Option 1: Payment Receipt */}
              <button
                type="button"
                onClick={() => handleTemplateChange('RECEIPT')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between gap-1 ${
                  selectedTemplate === 'RECEIPT'
                    ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-sm ring-1 ring-emerald-500'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs text-emerald-400">
                  <Receipt className="w-3.5 h-3.5 shrink-0" />
                  <span>Receipt</span>
                </div>
                <span className="text-[10px] text-slate-400 leading-tight">
                  Payment confirmed & verified receipt link.
                </span>
              </button>

              {/* Option 2: Gentle Reminder */}
              <button
                type="button"
                onClick={() => handleTemplateChange('GENTLE')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between gap-1 ${
                  selectedTemplate === 'GENTLE'
                    ? 'border-emerald-500 bg-emerald-500/10 text-white shadow-sm ring-1 ring-emerald-500'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <HeartHandshake className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>Gentle</span>
                </div>
                <span className="text-[10px] text-slate-400 leading-tight">
                  Polite reminder 3 days before due date.
                </span>
              </button>

              {/* Option 3: Due Today */}
              <button
                type="button"
                onClick={() => handleTemplateChange('DUE_TODAY')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between gap-1 ${
                  selectedTemplate === 'DUE_TODAY'
                    ? 'border-amber-500 bg-amber-500/10 text-white shadow-sm ring-1 ring-amber-500'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <CalendarCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Due Today</span>
                </div>
                <span className="text-[10px] text-slate-400 leading-tight">
                  Same-day alert with instant UPI instructions.
                </span>
              </button>

              {/* Option 4: Firm Overdue */}
              <button
                type="button"
                onClick={() => handleTemplateChange('OVERDUE')}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between gap-1 ${
                  selectedTemplate === 'OVERDUE'
                    ? 'border-rose-500 bg-rose-500/10 text-white shadow-sm ring-1 ring-rose-500'
                    : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-semibold text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Overdue</span>
                </div>
                <span className="text-[10px] text-slate-400 leading-tight">
                  Urgent notice citing overdue days.
                </span>
              </button>
            </div>
          </div>

          {/* Live Message Preview & Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Live Message Preview & Customization
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
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
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 font-mono focus:outline-hidden focus:border-emerald-500 transition leading-relaxed resize-none"
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>

            <button
              type="button"
              onClick={handleOpenWhatsApp}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-95"
            >
              <Send className="w-4 h-4" />
              Send via WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
