import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { InvoiceStatus, NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async recordPayment(ownerId: string, invoiceId: string, dto: RecordPaymentDto) {
    // 1. Fetch invoice with payments, validating ownership
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: true,
        lease: {
          include: {
            tenant: true,
            unit: {
              include: {
                property: true,
              },
            },
          },
        },
      },
    });


    if (!invoice || invoice.lease.unit.property.ownerId !== ownerId) {
      throw new NotFoundException(`Invoice with ID "${invoiceId}" not found under your properties`);
    }

    const totalAmount = Number(invoice.totalAmount);
    const existingPaid = invoice.payments.reduce((acc, p) => acc + Number(p.amount), 0);
    const remainingBalance = Math.max(0, totalAmount - existingPaid);

    // 2. Reject overpayment
    if (dto.amount > remainingBalance + 0.001) {
      throw new BadRequestException(
        `Payment amount (₹${dto.amount}) exceeds the remaining balance (₹${remainingBalance}) for this invoice`,
      );
    }

    const paymentDate = dto.paymentDate ? new Date(dto.paymentDate) : new Date();

    // 3. Atomic transaction: create payment & derive new invoice status
    const result = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.create({
        data: {
          invoiceId,
          amount: dto.amount,
          paymentDate,
          paymentMethod: dto.paymentMethod,
          transactionReference: dto.transactionReference?.trim(),
          notes: dto.notes?.trim(),
        },
      });

      const newTotalPaid = existingPaid + dto.amount;
      const newRemainingBalance = Math.max(0, totalAmount - newTotalPaid);
      const now = new Date();

      let newStatus: InvoiceStatus;
      if (newTotalPaid >= totalAmount) {
        newStatus = InvoiceStatus.PAID;
      } else if (now > invoice.dueDate) {
        newStatus = InvoiceStatus.OVERDUE;
      } else if (newTotalPaid > 0) {
        newStatus = InvoiceStatus.PARTIALLY_PAID;
      } else {
        newStatus = InvoiceStatus.PENDING;
      }

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: newStatus },
      });

      return {
        payment,
        invoiceSummary: {
          invoiceId: updatedInvoice.id,
          totalAmount,
          paidAmount: newTotalPaid,
          remainingBalance: newRemainingBalance,
          status: newStatus,
          isFullyPaid: newTotalPaid >= totalAmount,
        },
      };
    });

    // Notify tenant and landlord
    try {
      const unitNum = invoice.lease.unit.unitNumber;
      const tenantName = invoice.lease.tenant?.name || 'Tenant';

      // Notification for Landlord
      await this.notificationsService.create({
        userId: ownerId,
        title: `Payment Recorded: ₹${dto.amount}`,
        message: `Invoice for Unit ${unitNum} (${tenantName}) has been updated. Settled: ₹${dto.amount}.`,
        type: NotificationType.PAYMENT_CONFIRMED,
        link: '/dashboard/invoices',
      });

      // Notification for Tenant if linked user exists
      if (invoice.lease.tenant?.userId) {
        await this.notificationsService.create({
          userId: invoice.lease.tenant.userId,
          title: `Payment Settled: ₹${dto.amount}`,
          message: `Your payment of ₹${dto.amount} for Unit ${unitNum} has been confirmed and settled.`,
          type: NotificationType.PAYMENT_CONFIRMED,
          link: '/tenant-portal',
        });
      }
    } catch (e) {
      console.error('Failed to create notification for payment confirmation', e);
    }

    return result;
  }

  async findAllForInvoice(ownerId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        lease: {
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

    if (!invoice || invoice.lease.unit.property.ownerId !== ownerId) {
      throw new NotFoundException(`Invoice with ID "${invoiceId}" not found under your properties`);
    }

    return this.prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async findAll(ownerId: string) {
    return this.prisma.payment.findMany({
      where: {
        invoice: {
          lease: {
            unit: {
              property: {
                ownerId,
              },
            },
          },
        },
      },
      include: {
        invoice: {
          include: {
            lease: {
              include: {
                tenant: true,
                unit: {
                  include: {
                    property: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }
}
