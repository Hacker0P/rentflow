import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { UnitStatus, LeaseStatus } from '@prisma/client';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, dto: CreatePropertyDto) {
    return this.prisma.property.create({
      data: {
        ownerId,
        name: dto.name.trim(),
        address: dto.address.trim(),
      },
    });
  }

  async findAll(ownerId: string) {
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
      orderBy: { createdAt: 'desc' },
    });

    return properties.map((prop) => {
      const totalUnits = prop.units.length;
      const occupiedUnits = prop.units.filter((u) => u.status === UnitStatus.OCCUPIED).length;
      const vacantUnits = totalUnits - occupiedUnits;
      const { units, ...rest } = prop;

      return {
        ...rest,
        stats: {
          totalUnits,
          occupiedUnits,
          vacantUnits,
        },
      };
    });
  }

  async findOne(ownerId: string, propertyId: string) {
    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        ownerId,
      },
      include: {
        units: {
          orderBy: { unitNumber: 'asc' },
        },
      },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID "${propertyId}" not found or not owned by you`);
    }

    return property;
  }

  async update(ownerId: string, propertyId: string, dto: UpdatePropertyDto) {
    // Verify ownership
    await this.findOne(ownerId, propertyId);

    return this.prisma.property.update({
      where: { id: propertyId },
      data: {
        name: dto.name?.trim(),
        address: dto.address?.trim(),
      },
    });
  }

  async remove(ownerId: string, propertyId: string) {
    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        ownerId,
      },
      include: {
        units: {
          include: {
            leases: {
              where: { status: LeaseStatus.ACTIVE },
              include: { tenant: true },
            },
          },
        },
      },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID "${propertyId}" not found or not owned by you`);
    }

    // Safety check: Cannot delete property if any unit has an active tenant lease
    const activeLeases = property.units.flatMap((u) => u.leases);
    if (activeLeases.length > 0) {
      const tenantNames = activeLeases
        .map((l) => l.tenant.name)
        .filter(Boolean)
        .slice(0, 3)
        .join(', ');
      const more = activeLeases.length > 3 ? ` and ${activeLeases.length - 3} more` : '';
      throw new BadRequestException(
        `Cannot delete "${property.name}" because it currently has ${activeLeases.length} active lease(s) (tenants: ${tenantNames}${more}). Please terminate active leases before removing this property.`,
      );
    }

    const unitIds = property.units.map((u) => u.id);

    return this.prisma.$transaction(async (tx) => {
      if (unitIds.length > 0) {
        // Find all non-active leases for these units
        const pastLeases = await tx.lease.findMany({
          where: { unitId: { in: unitIds } },
          select: { id: true },
        });
        const leaseIds = pastLeases.map((l) => l.id);

        if (leaseIds.length > 0) {
          const invoices = await tx.invoice.findMany({
            where: { leaseId: { in: leaseIds } },
            select: { id: true },
          });
          const invoiceIds = invoices.map((i) => i.id);

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

          await tx.lease.deleteMany({
            where: { id: { in: leaseIds } },
          });
        }

        // Delete maintenance requests for units in this property
        await tx.maintenanceRequest.deleteMany({
          where: { unitId: { in: unitIds } },
        });

        // Delete units in this property
        await tx.unit.deleteMany({
          where: { id: { in: unitIds } },
        });
      }

      // Finally delete the property
      return tx.property.delete({
        where: { id: propertyId },
      });
    });
  }
}
