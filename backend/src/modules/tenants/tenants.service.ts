import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { LeaseStatus, UnitStatus } from '@prisma/client';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTenantDto) {
    const normalizedPhone = dto.phone.trim();
    const normalizedEmail = dto.email ? dto.email.trim().toLowerCase() : null;

    const last10 = normalizedPhone.replace(/[^0-9]/g, '').slice(-10);
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          ...(last10.length >= 10 ? [{ phone: { contains: last10 } }] : []),
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
        ],
      },
    });

    // Check if tenant with this phone or email already exists to avoid duplicate profiles
    const existing = await this.prisma.tenant.findFirst({
      where: {
        OR: [
          { phone: normalizedPhone },
          ...(last10.length >= 10 ? [{ phone: { contains: last10 } }] : []),
          ...(normalizedEmail ? [{ email: normalizedEmail }] : []),
        ],
      },
    });

    if (existing) {
      // Check if existingUser is already bound to another tenant
      const userAlreadyBound = existingUser
        ? await this.prisma.tenant.findUnique({ where: { userId: existingUser.id } })
        : null;

      // Update details if email or name provided
      return this.prisma.tenant.update({
        where: { id: existing.id },
        data: {
          name: dto.name.trim(),
          email: normalizedEmail || existing.email,
          ...(existingUser && !existing.userId && (!userAlreadyBound || userAlreadyBound.id === existing.id)
            ? { userId: existingUser.id }
            : {}),
        },
      });
    }

    const userAlreadyBound = existingUser
      ? await this.prisma.tenant.findUnique({ where: { userId: existingUser.id } })
      : null;

    return this.prisma.tenant.create({
      data: {
        name: dto.name.trim(),
        phone: normalizedPhone,
        email: normalizedEmail,
        ...(existingUser && !userAlreadyBound ? { userId: existingUser.id } : {}),
      },
    });
  }

  async findAll(ownerId: string) {
    return this.prisma.tenant.findMany({
      where: {
        leases: {
          some: {
            unit: {
              property: {
                ownerId,
              },
            },
          },
        },
      },
      include: {
        leases: {
          where: {
            unit: {
              property: {
                ownerId,
              },
            },
          },
          include: {
            unit: {
              include: {
                property: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(ownerId: string, id: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: {
        id,
        leases: {
          some: {
            unit: {
              property: {
                ownerId,
              },
            },
          },
        },
      },
      include: {
        leases: {
          where: {
            unit: {
              property: {
                ownerId,
              },
            },
          },
          include: {
            unit: {
              include: {
                property: true,
              },
            },
            invoices: {
              orderBy: { dueDate: 'desc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID "${id}" not found under your properties`);
    }

    return tenant;
  }

  async update(ownerId: string, id: string, dto: UpdateTenantDto) {
    // Verify tenant belongs to landlord's properties
    await this.findOne(ownerId, id);

    return this.prisma.tenant.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        phone: dto.phone?.trim(),
        email: dto.email ? dto.email.trim().toLowerCase() : undefined,
      },
    });
  }

  async remove(ownerId: string, id: string) {
    // 1. Verify tenant exists and is associated with this landlord
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        leases: {
          include: {
            unit: {
              include: {
                property: true,
              },
            },
            invoices: {
              include: {
                payments: true,
                items: true,
              },
            },
          },
        },
        maintenanceRequests: {
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

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID "${id}" not found.`);
    }

    // Leases belonging to this landlord
    const landlordLeases = tenant.leases.filter(
      (l) => l.unit.property.ownerId === ownerId,
    );

    const landlordRequests = tenant.maintenanceRequests.filter(
      (m) => m.unit.property.ownerId === ownerId,
    );

    if (landlordLeases.length === 0 && landlordRequests.length === 0) {
      throw new NotFoundException(`Tenant is not associated with any of your properties.`);
    }

    // Free up any units currently occupied under active leases for this landlord
    const activeUnitsToFree = landlordLeases
      .filter((l) => l.status === LeaseStatus.ACTIVE)
      .map((l) => l.unitId);

    // Delete in atomic transaction
    return this.prisma.$transaction(async (tx) => {
      // 1. Free any occupied units back to VACANT
      if (activeUnitsToFree.length > 0) {
        await tx.unit.updateMany({
          where: { id: { in: activeUnitsToFree } },
          data: { status: UnitStatus.VACANT },
        });
      }

      const leaseIds = landlordLeases.map((l) => l.id);
      const invoiceIds = landlordLeases.flatMap((l) => l.invoices.map((i) => i.id));
      const requestIds = landlordRequests.map((r) => r.id);

      // Delete maintenance requests
      if (requestIds.length > 0) {
        await tx.maintenanceRequest.deleteMany({
          where: { id: { in: requestIds } },
        });
      }

      // Delete payments, items, and invoices on these leases
      if (invoiceIds.length > 0) {
        await tx.payment.deleteMany({
          where: { invoiceId: { in: invoiceIds } },
        });
        await tx.invoiceItem.deleteMany({
          where: { invoiceId: { in: invoiceIds } },
        });
        await tx.invoice.deleteMany({
          where: { id: { in: invoiceIds } },
        });
      }

      // Delete leases for this landlord
      if (leaseIds.length > 0) {
        await tx.lease.deleteMany({
          where: { id: { in: leaseIds } },
        });
      }

      // Check if tenant has any remaining leases or requests across ANY property/landlord
      const remainingLeases = await tx.lease.count({
        where: { tenantId: id },
      });

      const remainingRequests = await tx.maintenanceRequest.count({
        where: { tenantId: id },
      });

      // If tenant has no other ties, delete the tenant record completely
      if (remainingLeases === 0 && remainingRequests === 0) {
        await tx.tenant.delete({
          where: { id },
        });
      }

      return {
        success: true,
        message: `Tenant "${tenant.name}" and ended lease history deleted successfully.`,
      };
    });
  }
}
