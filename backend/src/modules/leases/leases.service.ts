import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UnitsService } from '@/modules/units/units.service';
import { TenantsService } from '@/modules/tenants/tenants.service';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { UpdateLeaseDto } from './dto/update-lease.dto';
import { LeaseStatus, UnitStatus } from '@prisma/client';

@Injectable()
export class LeasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly unitsService: UnitsService,
    private readonly tenantsService: TenantsService,
  ) {}

  async create(ownerId: string, dto: CreateLeaseDto) {
    // 1. Verify unit ownership
    const unit = await this.unitsService.findOne(ownerId, dto.unitId);

    // 2. Check single active lease invariant
    const existingActiveLease = await this.prisma.lease.findFirst({
      where: {
        unitId: dto.unitId,
        status: LeaseStatus.ACTIVE,
      },
    });

    if (existingActiveLease) {
      throw new ConflictException(
        `Unit "${unit.unitNumber}" already has an active lease agreement. Terminate the active lease before creating a new one.`,
      );
    }

    // 3. Resolve Tenant ID
    let tenantId = dto.tenantId;
    if (!tenantId) {
      if (!dto.tenant) {
        throw new BadRequestException('Either an existing tenantId or inline tenant details must be provided');
      }
      const tenant = await this.tenantsService.create(dto.tenant);
      tenantId = tenant.id;
    } else {
      const tenantExists = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
      });
      if (!tenantExists) {
        throw new NotFoundException(`Tenant with ID "${tenantId}" does not exist`);
      }
    }

    // 4. Atomic transaction: create lease and mark unit as OCCUPIED
    return this.prisma.$transaction(async (tx) => {
      const lease = await tx.lease.create({
        data: {
          unitId: dto.unitId,
          tenantId,
          monthlyRent: dto.monthlyRent,
          maintenanceAmount: dto.maintenanceAmount || 0,
          securityDeposit: dto.securityDeposit || 0,
          rentDueDay: dto.rentDueDay,
          startDate: new Date(dto.startDate),
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          status: LeaseStatus.ACTIVE,
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

      // Synchronize unit occupancy state
      await tx.unit.update({
        where: { id: dto.unitId },
        data: { status: UnitStatus.OCCUPIED },
      });

      return lease;
    });
  }

  async findAll(ownerId: string, status?: LeaseStatus) {
    return this.prisma.lease.findMany({
      where: {
        unit: {
          property: {
            ownerId,
          },
        },
        ...(status ? { status } : {}),
      },
      include: {
        tenant: true,
        unit: {
          include: {
            property: true,
          },
        },
        _count: {
          select: { invoices: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(ownerId: string, leaseId: string) {
    const lease = await this.prisma.lease.findUnique({
      where: { id: leaseId },
      include: {
        tenant: true,
        unit: {
          include: {
            property: true,
          },
        },
        invoices: {
          orderBy: { dueDate: 'desc' },
          include: {
            items: true,
            payments: true,
          },
        },
      },
    });

    if (!lease || lease.unit.property.ownerId !== ownerId) {
      throw new NotFoundException(`Lease with ID "${leaseId}" not found or not owned by you`);
    }

    return lease;
  }

  async update(ownerId: string, leaseId: string, dto: UpdateLeaseDto) {
    await this.findOne(ownerId, leaseId);

    return this.prisma.lease.update({
      where: { id: leaseId },
      data: {
        monthlyRent: dto.monthlyRent,
        maintenanceAmount: dto.maintenanceAmount,
        securityDeposit: dto.securityDeposit,
        rentDueDay: dto.rentDueDay,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
      include: {
        tenant: true,
        unit: true,
      },
    });
  }

  async terminate(ownerId: string, leaseId: string) {
    const lease = await this.findOne(ownerId, leaseId);

    if (lease.status === LeaseStatus.ENDED) {
      throw new BadRequestException('This lease agreement is already terminated');
    }

    // Atomic transaction: terminate lease and free the unit
    return this.prisma.$transaction(async (tx) => {
      const updatedLease = await tx.lease.update({
        where: { id: leaseId },
        data: {
          status: LeaseStatus.ENDED,
          endDate: lease.endDate || new Date(),
        },
        include: {
          unit: true,
          tenant: true,
        },
      });

      // Synchronize unit occupancy status back to VACANT
      await tx.unit.update({
        where: { id: lease.unitId },
        data: { status: UnitStatus.VACANT },
      });

      return updatedLease;
    });
  }
}
