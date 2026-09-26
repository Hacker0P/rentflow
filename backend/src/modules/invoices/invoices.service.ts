import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { GenerateInvoicesDto } from './dto/generate-invoices.dto';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { InvoiceItemType, InvoiceStatus, LeaseStatus } from '@prisma/client';

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper to normalize any date/string into the 1st of that month (UTC)
   */
  private normalizeBillingMonth(dateStr?: string): Date {
    const d = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(d.getTime())) {
      throw new BadRequestException('Invalid date provided for billing month');
    }
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  }

  /**
   * Batch generates monthly invoices for all active leases owned by the landlord.
   * Fully idempotent: won't duplicate invoices for already-billed leases.
   */
  async generateForMonth(ownerId: string, dto: GenerateInvoicesDto) {
    const billingMonth = this.normalizeBillingMonth(dto.billingMonth);
    const year = billingMonth.getUTCFullYear();
    const month = billingMonth.getUTCMonth(); // 0-indexed
    const monthName = billingMonth.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' });

    // 1. Fetch all active leases owned by the landlord
    const activeLeases = await this.prisma.lease.findMany({
      where: {
        status: LeaseStatus.ACTIVE,
        unit: {
          property: {
            ownerId,
            ...(dto.propertyId ? { id: dto.propertyId } : {}),
          },
        },
      },
      include: {
        unit: {
          include: {
            property: true,
          },
        },
        tenant: true,
      },
    });

    let generatedCount = 0;
    let skippedCount = 0;
    const generatedInvoices = [];

    // 2. Process each lease
    for (const lease of activeLeases) {
      // Check idempotency constraint
      const existing = await this.prisma.invoice.findUnique({
        where: {
          leaseId_billingMonth: {
            leaseId: lease.id,
            billingMonth,
          },
        },
      });

      if (existing) {
        skippedCount++;
        continue;
      }

      // Calculate due date based on lease.rentDueDay
      const dueDate = new Date(Date.UTC(year, month, lease.rentDueDay));
      const now = new Date();
      const initialStatus = now > dueDate ? InvoiceStatus.OVERDUE : InvoiceStatus.PENDING;

      const rentAmount = Number(lease.monthlyRent);
      const maintenanceAmount = Number(lease.maintenanceAmount);
      const totalAmount = rentAmount + maintenanceAmount;

      const invoice = await this.prisma.invoice.create({
        data: {
          leaseId: lease.id,
          billingMonth,
          dueDate,
          status: initialStatus,
          totalAmount,
          items: {
            create: [
              {
                type: InvoiceItemType.RENT,
                description: `Monthly Rent - ${monthName} ${year} (${lease.unit.unitNumber})`,
                amount: rentAmount,
              },
              ...(maintenanceAmount > 0
                ? [
                    {
                      type: InvoiceItemType.MAINTENANCE,
                      description: `Maintenance Fee - ${monthName} ${year} (${lease.unit.unitNumber})`,
                      amount: maintenanceAmount,
                    },
                  ]
                : []),
            ],
          },
        },
        include: {
          items: true,
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

      generatedCount++;
      generatedInvoices.push(invoice);
    }

    return {
      message: `Invoice generation complete for ${monthName} ${year}`,
      billingMonth: billingMonth.toISOString().slice(0, 7),
      totalActiveLeases: activeLeases.length,
      generatedCount,
      skippedCount,
      invoices: generatedInvoices,
    };
  }

  async create(ownerId: string, dto: CreateInvoiceDto) {
    const billingMonth = this.normalizeBillingMonth(dto.billingMonth);
    const dueDate = new Date(dto.dueDate);

    // Verify lease belongs to landlord
    const lease = await this.prisma.lease.findFirst({
      where: {
        id: dto.leaseId,
        unit: {
          property: {
            ownerId,
          },
        },
      },
      include: {
        unit: true,
      },
    });

    if (!lease) {
      throw new NotFoundException(`Lease with ID "${dto.leaseId}" not found under your properties`);
    }

    // Check unique billing month
    const existing = await this.prisma.invoice.findUnique({
      where: {
        leaseId_billingMonth: {
          leaseId: dto.leaseId,
          billingMonth,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `An invoice for lease on Unit "${lease.unit.unitNumber}" for billing period ${billingMonth.toISOString().slice(0, 7)} already exists`,
      );
    }

    const items = dto.items && dto.items.length > 0
      ? dto.items
      : [
          {
            type: InvoiceItemType.RENT,
            description: `Rent - ${billingMonth.toISOString().slice(0, 7)}`,
            amount: Number(lease.monthlyRent),
          },
          ...(Number(lease.maintenanceAmount) > 0
            ? [
                {
                  type: InvoiceItemType.MAINTENANCE,
                  description: `Maintenance - ${billingMonth.toISOString().slice(0, 7)}`,
                  amount: Number(lease.maintenanceAmount),
                },
              ]
            : []),
        ];

    const totalAmount = items.reduce((acc, item) => acc + item.amount, 0);
    const now = new Date();
    const status = now > dueDate ? InvoiceStatus.OVERDUE : InvoiceStatus.PENDING;

    return this.prisma.invoice.create({
      data: {
        leaseId: dto.leaseId,
        billingMonth,
        dueDate,
        status,
        totalAmount,
        items: {
          create: items.map((i) => ({
            type: i.type,
            description: i.description,
            amount: i.amount,
          })),
        },
      },
      include: {
        items: true,
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
  }

  async findAll(ownerId: string, query: QueryInvoicesDto) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        lease: {
          unit: {
            property: {
              ownerId,
              ...(query.propertyId ? { id: query.propertyId } : {}),
            },
          },
          ...(query.leaseId ? { id: query.leaseId } : {}),
        },
        ...(query.status ? { status: query.status } : {}),
      },
      include: {
        items: true,
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
      orderBy: { dueDate: 'desc' },
    });

    const now = new Date();

    return invoices.map((inv) => {
      const totalAmount = Number(inv.totalAmount);
      const paidAmount = inv.payments.reduce((acc, p) => acc + Number(p.amount), 0);
      const remainingBalance = Math.max(0, totalAmount - paidAmount);

      // Derive accurate status
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
        ...inv,
        status: derivedStatus,
        financialSummary: {
          totalAmount,
          paidAmount,
          remainingBalance,
          isFullyPaid: paidAmount >= totalAmount,
        },
      };
    });
  }

  async findOne(ownerId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
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
    const paidAmount = invoice.payments.reduce((acc, p) => acc + Number(p.amount), 0);
    const remainingBalance = Math.max(0, totalAmount - paidAmount);
    const now = new Date();

    let derivedStatus = invoice.status;
    if (paidAmount >= totalAmount) {
      derivedStatus = InvoiceStatus.PAID;
    } else if (now > invoice.dueDate) {
      derivedStatus = InvoiceStatus.OVERDUE;
    } else if (paidAmount > 0) {
      derivedStatus = InvoiceStatus.PARTIALLY_PAID;
    } else {
      derivedStatus = InvoiceStatus.PENDING;
    }

    return {
      ...invoice,
      status: derivedStatus,
      financialSummary: {
        totalAmount,
        paidAmount,
        remainingBalance,
        isFullyPaid: paidAmount >= totalAmount,
      },
    };
  }

  async findPublicInvoice(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        payments: {
          orderBy: { paymentDate: 'desc' },
        },
        lease: {
          include: {
            tenant: true,
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
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID "${invoiceId}" not found`);
    }

    const totalAmount = Number(invoice.totalAmount);
    const paidAmount = invoice.payments.reduce((acc, p) => acc + Number(p.amount), 0);
    const remainingBalance = Math.max(0, totalAmount - paidAmount);
    const now = new Date();

    let derivedStatus = invoice.status;
    if (paidAmount >= totalAmount) {
      derivedStatus = InvoiceStatus.PAID;
    } else if (now > invoice.dueDate) {
      derivedStatus = InvoiceStatus.OVERDUE;
    } else if (paidAmount > 0) {
      derivedStatus = InvoiceStatus.PARTIALLY_PAID;
    } else {
      derivedStatus = InvoiceStatus.PENDING;
    }

    const owner = invoice.lease.unit.property.owner;
    const sanitizedOwnerHandle = owner.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const upiId = owner.upiId || `${sanitizedOwnerHandle}@okaxis`;

    return {
      id: invoice.id,
      billingMonth: invoice.billingMonth,
      dueDate: invoice.dueDate,
      status: derivedStatus,
      totalAmount,
      paidAmount,
      remainingBalance,
      isFullyPaid: paidAmount >= totalAmount,
      items: invoice.items.map((item) => ({
        id: item.id,
        type: item.type,
        description: item.description,
        amount: Number(item.amount),
      })),
      payments: invoice.payments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        paymentDate: p.paymentDate,
        paymentMethod: p.paymentMethod,
        transactionReference: p.transactionReference,
      })),
      tenant: {
        name: invoice.lease.tenant.name,
        phone: invoice.lease.tenant.phone,
        email: invoice.lease.tenant.email,
      },
      unit: {
        unitNumber: invoice.lease.unit.unitNumber,
        floor: invoice.lease.unit.floor,
      },
      property: {
        name: invoice.lease.unit.property.name,
        address: invoice.lease.unit.property.address,
      },
      landlord: {
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        upiId,
        panNumber: owner.panNumber,
        bankName: owner.bankName,
        bankAccountNumber: owner.bankAccountNumber,
        bankIfsc: owner.bankIfsc,
      },
    };
  }

  async checkAndMarkOverdue() {
    const now = new Date();
    const pendingInvoices = await this.prisma.invoice.findMany({
      where: {
        dueDate: { lt: now },
        status: { in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIALLY_PAID] },
      },
      include: {
        payments: true,
      },
    });

    let updatedCount = 0;
    for (const inv of pendingInvoices) {
      const totalAmount = Number(inv.totalAmount);
      const paidAmount = inv.payments.reduce((acc, p) => acc + Number(p.amount), 0);
      if (paidAmount < totalAmount) {
        await this.prisma.invoice.update({
          where: { id: inv.id },
          data: { status: InvoiceStatus.OVERDUE },
        });
        updatedCount++;
      }
    }

    return {
      message: `Overdue check complete. Updated ${updatedCount} invoice(s) to OVERDUE.`,
      updatedCount,
    };
  }
}
