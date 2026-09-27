import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { LeaseStatus, InvoiceStatus, PaymentStatus, NotificationType } from '@prisma/client';
import { ReportPaymentDto } from './dto/report-payment.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TenantPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}


  async getDashboard(userId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { userId },
      include: {
        leases: {
          where: { status: LeaseStatus.ACTIVE },
          include: {
            unit: {
              include: {
                property: {
                  include: {
                    owner: {
                      select: {
                        name: true,
                        email: true,
                        phone: true,
                        upiId: true,
                        panNumber: true,
                        bankName: true,
                        bankAccountNumber: true,
                        bankIfsc: true,
                        qrImageUrl: true,
                      },
                    },
                  },
                },
              },
            },
            invoices: {
              include: {
                items: true,
                payments: {
                  orderBy: { paymentDate: 'desc' },
                },
              },
              orderBy: { billingMonth: 'desc' },
            },
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant profile not found for this account.');
    }

    const activeLease = tenant.leases[0];
    if (!activeLease) {
      return {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          email: tenant.email,
          phone: tenant.phone,
        },
        hasActiveLease: false,
        message: 'No active lease agreement found under your profile.',
      };
    }

    const landlord = activeLease.unit.property.owner;
    const sanitizedOwnerHandle = landlord.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const upiId = landlord.upiId || `${sanitizedOwnerHandle}@okaxis`;

    const now = new Date();

    // Map and derive statuses for all invoices
    const invoices = activeLease.invoices.map((inv) => {
      const totalAmount = Number(inv.totalAmount);
      const paidAmount = inv.payments
        .filter((p) => p.status === PaymentStatus.CONFIRMED)
        .reduce((acc, p) => acc + Number(p.amount), 0);
      const remainingBalance = Math.max(0, totalAmount - paidAmount);

      let derivedStatus = inv.status;
      if (paidAmount >= totalAmount) {
        derivedStatus = InvoiceStatus.PAID;
      } else if (now > inv.dueDate) {
        derivedStatus = InvoiceStatus.OVERDUE;
      } else if (paidAmount > 0) {
        derivedStatus = InvoiceStatus.PARTIALLY_PAID;
      } else {
        derivedStatus = InvoiceStatus.PENDING;
      }

      return {
        id: inv.id,
        billingMonth: inv.billingMonth,
        dueDate: inv.dueDate,
        status: derivedStatus,
        totalAmount,
        paidAmount,
        remainingBalance,
        isFullyPaid: paidAmount >= totalAmount,
        items: inv.items.map((i) => ({
          id: i.id,
          type: i.type,
          description: i.description,
          amount: Number(i.amount),
        })),
        payments: inv.payments.map((p) => ({
          id: p.id,
          amount: Number(p.amount),
          paymentDate: p.paymentDate,
          paymentMethod: p.paymentMethod,
          status: p.status,
          transactionReference: p.transactionReference,
          notes: p.notes,
        })),
      };
    });

    // Find current active/unpaid bill
    const currentBill = invoices.find((inv) => !inv.isFullyPaid) || null;

    // Build UPI URL for current bill if exists
    let upiUrl = null;
    if (currentBill) {
      upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(
        landlord.name
      )}&am=${currentBill.remainingBalance}&cu=INR&tn=${encodeURIComponent(
        `Rent Unit ${activeLease.unit.unitNumber}`
      )}`;
    }

    return {
      hasActiveLease: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
      },
      unit: {
        unitNumber: activeLease.unit.unitNumber,
        floor: activeLease.unit.floor,
      },
      property: {
        name: activeLease.unit.property.name,
        address: activeLease.unit.property.address,
      },
      landlord: {
        name: landlord.name,
        email: landlord.email,
        phone: landlord.phone || '+91-9811223344',
        upiId,
        panNumber: landlord.panNumber,
        bankName: landlord.bankName,
        bankAccountNumber: landlord.bankAccountNumber,
        bankIfsc: landlord.bankIfsc,
        qrImageUrl: landlord.qrImageUrl,
      },
      lease: {
        id: activeLease.id,
        monthlyRent: Number(activeLease.monthlyRent),
        maintenanceAmount: Number(activeLease.maintenanceAmount),
        securityDeposit: Number(activeLease.securityDeposit),
        rentDueDay: activeLease.rentDueDay,
        startDate: activeLease.startDate,
      },
      currentBill,
      upiUrl,
      invoices,
    };
  }

  async reportPayment(userId: string, invoiceId: string, dto: ReportPaymentDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { userId },
      include: {
        leases: {
          where: { status: LeaseStatus.ACTIVE },
          include: {
            unit: {
              include: {
                property: true,
              },
            },
          },
        },
      },
    });

    if (!tenant || tenant.leases.length === 0) {
      throw new NotFoundException('Active lease agreement not found.');
    }

    const activeLease = tenant.leases[0];
    const leaseId = activeLease.id;
    const landlordId = activeLease.unit.property.ownerId;
    const unitNumber = activeLease.unit.unitNumber;

    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        leaseId,
      },
      include: {
        payments: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found under your active lease.');
    }

    const totalAmount = Number(invoice.totalAmount);
    const existingPaid = invoice.payments
      .filter((p) => p.status === PaymentStatus.CONFIRMED)
      .reduce((acc, p) => acc + Number(p.amount), 0);
    const remainingBalance = Math.max(0, totalAmount - existingPaid);

    if (dto.amount > remainingBalance) {
      throw new BadRequestException(
        `Reported payment amount (₹${dto.amount}) exceeds the remaining balance (₹${remainingBalance})`
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId,
          amount: dto.amount,
          paymentDate: new Date(),
          paymentMethod: dto.paymentMethod,
          status: PaymentStatus.CONFIRMED,
          transactionReference: dto.transactionReference,
          notes: dto.notes ? `[Tenant Reported] ${dto.notes}` : '[Tenant Self-Reported via RentFlow App]',
        },
      });

      const newTotalPaid = existingPaid + dto.amount;
      const isFullyPaid = newTotalPaid >= totalAmount;

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: isFullyPaid ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID,
        },
      });

      return {
        message: 'Payment confirmation recorded successfully! Official receipt generated.',
        payment: {
          id: payment.id,
          amount: Number(payment.amount),
          paymentMethod: payment.paymentMethod,
          transactionReference: payment.transactionReference,
          paymentDate: payment.paymentDate,
        },
        invoiceStatus: isFullyPaid ? InvoiceStatus.PAID : InvoiceStatus.PARTIALLY_PAID,
        remainingBalance: Math.max(0, totalAmount - newTotalPaid),
      };
    });

    // Notify landlord
    try {
      await this.notificationsService.create({
        userId: landlordId,
        title: `Payment Reported: ₹${dto.amount}`,
        message: `Tenant ${tenant.name} reported ₹${dto.amount} (Ref: ${dto.transactionReference || 'N/A'}) for Unit ${unitNumber}.`,
        type: NotificationType.PAYMENT_REPORTED,
        link: '/dashboard/invoices',
      });

      // Confirmation notification for tenant
      await this.notificationsService.create({
        userId,
        title: `Payment Submitted: ₹${dto.amount}`,
        message: `Your payment of ₹${dto.amount} (UTR: ${dto.transactionReference || 'N/A'}) has been submitted for Unit ${unitNumber}.`,
        type: NotificationType.PAYMENT_REPORTED,
        link: '/tenant-portal',
      });
    } catch (e) {
      // Don't fail the payment transaction if notification fails
      console.error('Failed to create notification for payment report', e);
    }

    return result;
  }
}
