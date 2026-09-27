import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PropertiesService } from '@/modules/properties/properties.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { UnitStatus, LeaseStatus } from '@prisma/client';

@Injectable()
export class UnitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly propertiesService: PropertiesService,
  ) {}

  async create(ownerId: string, propertyId: string, dto: CreateUnitDto) {
    // 1. Verify that the property exists and belongs to the authenticated landlord
    await this.propertiesService.findOne(ownerId, propertyId);

    const normalizedUnitNumber = dto.unitNumber.trim();

    // 2. Check for duplicate unit number within the same property
    const existing = await this.prisma.unit.findUnique({
      where: {
        propertyId_unitNumber: {
          propertyId,
          unitNumber: normalizedUnitNumber,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Unit "${normalizedUnitNumber}" already exists in this property`,
      );
    }

    return this.prisma.unit.create({
      data: {
        propertyId,
        unitNumber: normalizedUnitNumber,
        floor: dto.floor,
        status: dto.status || UnitStatus.VACANT,
      },
    });
  }

  async findAllForProperty(ownerId: string, propertyId: string) {
    // Verify ownership
    await this.propertiesService.findOne(ownerId, propertyId);

    return this.prisma.unit.findMany({
      where: { propertyId },
      include: {
        leases: {
          where: { status: 'ACTIVE' },
          include: {
            tenant: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { unitNumber: 'asc' },
    });
  }

  async findOne(ownerId: string, unitId: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id: unitId },
      include: {
        property: true,
        leases: {
          include: {
            tenant: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!unit || unit.property.ownerId !== ownerId) {
      throw new NotFoundException(`Unit with ID "${unitId}" not found or not owned by you`);
    }

    return unit;
  }

  async update(ownerId: string, unitId: string, dto: UpdateUnitDto) {
    const unit = await this.findOne(ownerId, unitId);

    if (dto.unitNumber && dto.unitNumber.trim() !== unit.unitNumber) {
      const normalizedUnitNumber = dto.unitNumber.trim();
      const duplicate = await this.prisma.unit.findUnique({
        where: {
          propertyId_unitNumber: {
            propertyId: unit.propertyId,
            unitNumber: normalizedUnitNumber,
          },
        },
      });

      if (duplicate) {
        throw new ConflictException(
          `Unit "${normalizedUnitNumber}" already exists in this property`,
        );
      }
    }

    return this.prisma.unit.update({
      where: { id: unitId },
      data: {
        unitNumber: dto.unitNumber?.trim(),
        floor: dto.floor !== undefined ? dto.floor : unit.floor,
        status: dto.status !== undefined ? dto.status : unit.status,
      },
    });
  }

  async remove(ownerId: string, unitId: string) {
    const unit = await this.findOne(ownerId, unitId);

    return this.prisma.$transaction(async (tx) => {
      const leaseIds = unit.leases.map((l) => l.id);

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

      await tx.maintenanceRequest.deleteMany({
        where: { unitId },
      });

      return tx.unit.delete({
        where: { id: unitId },
      });
    });
  }
}
