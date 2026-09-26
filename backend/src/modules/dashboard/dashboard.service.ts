import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UnitStatus, InvoiceStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(ownerId: string) {
    const now = new Date();
    const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    // 1. Properties & Units Metrics
    const properties = await this.prisma.property.findMany({
      where: { ownerId },
      include: {
        units: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    const totalProperties = properties.length;
    let totalUnits = 0;
    let occupiedUnits = 0;

    for (const p of properties) {
      totalUnits += p.units.length;
      occupiedUnits += p.units.filter((u) => u.status === UnitStatus.OCCUPIED).length;
    }

    const vacantUnits = totalUnits - occupiedUnits;
    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    // 2. Invoices across landlord's properties
    const invoices = await this.prisma.invoice.findMany({
      where: {
        lease: {
          unit: {
            property: {
              ownerId,
            },
          },
        },
      },
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

    let expectedCollection = 0;
    let collectedAmount = 0;
    let pendingAmount = 0;
    let overdueAmount = 0;

    for (const inv of invoices) {
      const invTotal = Number(inv.totalAmount);
      const invPaid = inv.payments.reduce((acc, p) => acc + Number(p.amount), 0);
      const invBalance = Math.max(0, invTotal - invPaid);

      // Only count current month towards monthly expected collection
      const isCurrentMonth =
        inv.billingMonth.getUTCFullYear() === currentMonthStart.getUTCFullYear() &&
        inv.billingMonth.getUTCMonth() === currentMonthStart.getUTCMonth();

      if (isCurrentMonth) {
        expectedCollection += invTotal;
        collectedAmount += invPaid;
      }

      // Overdue is all unpaid invoices past due date
      if (invBalance > 0) {
        if (now > inv.dueDate) {
          overdueAmount += invBalance;
        } else if (isCurrentMonth) {
          pendingAmount += invBalance;
        }
      }
    }

    // 3. Recent 5 Payments
    const recentPayments = await this.prisma.payment.findMany({
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
      take: 5,
    });

    // 4. Upcoming Invoices due in the next 14 days
    const upcomingLimit = new Date();
    upcomingLimit.setDate(upcomingLimit.getDate() + 14);

    const upcomingInvoices = await this.prisma.invoice.findMany({
      where: {
        dueDate: {
          gte: now,
          lte: upcomingLimit,
        },
        status: {
          in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIALLY_PAID],
        },
        lease: {
          unit: {
            property: {
              ownerId,
            },
          },
        },
      },
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
      orderBy: { dueDate: 'asc' },
      take: 5,
    });

    return {
      stats: {
        totalProperties,
        totalUnits,
        occupiedUnits,
        vacantUnits,
        occupancyRate,
      },
      financials: {
        expectedCollection,
        collectedAmount,
        pendingAmount,
        overdueAmount,
      },
      recentPayments: recentPayments.map((p) => ({
        id: p.id,
        amount: Number(p.amount),
        paymentDate: p.paymentDate,
        paymentMethod: p.paymentMethod,
        transactionReference: p.transactionReference,
        tenantName: p.invoice.lease.tenant.name,
        unitNumber: p.invoice.lease.unit.unitNumber,
        propertyName: p.invoice.lease.unit.property.name,
      })),
      upcomingInvoices: upcomingInvoices.map((inv) => {
        const total = Number(inv.totalAmount);
        const paid = inv.payments.reduce((acc, p) => acc + Number(p.amount), 0);
        return {
          id: inv.id,
          totalAmount: total,
          paidAmount: paid,
          remainingBalance: Math.max(0, total - paid),
          dueDate: inv.dueDate,
          status: inv.status,
          tenantName: inv.lease.tenant.name,
          tenantPhone: inv.lease.tenant.phone,
          unitNumber: inv.lease.unit.unitNumber,
          propertyName: inv.lease.unit.property.name,
        };
      }),
    };
  }
}
