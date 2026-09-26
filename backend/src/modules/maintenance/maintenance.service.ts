import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto';
import { LeaseStatus, MaintenanceStatus, UserRole, NotificationType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateMaintenanceDto) {
    // Find tenant profile and active unit
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
      throw new BadRequestException('You do not have an active lease to raise maintenance requests.');
    }

    const activeLease = tenant.leases[0];

    const created = await this.prisma.maintenanceRequest.create({
      data: {
        tenantId: tenant.id,
        unitId: activeLease.unitId,
        title: dto.title,
        description: dto.description,
        category: dto.category,
        priority: dto.priority,
        status: MaintenanceStatus.OPEN,
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

    try {
      await this.notificationsService.create({
        userId: created.unit.property.ownerId,
        title: `New Maintenance Ticket: ${dto.title}`,
        message: `Tenant ${tenant.name} reported a ${dto.category.toLowerCase()} issue for Unit ${activeLease.unit.unitNumber}.`,
        type: NotificationType.MAINTENANCE_UPDATE,
        link: '/dashboard/maintenance',
      });
    } catch (e) {
      console.error('Failed to notify landlord on maintenance request', e);
    }

    return created;
  }


  async findAll(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.TENANT) {
      // Find tenant's own tickets
      return this.prisma.maintenanceRequest.findMany({
        where: {
          tenant: { userId },
        },
        include: {
          unit: {
            include: {
              property: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Landlord: find tickets across all owned properties
      return this.prisma.maintenanceRequest.findMany({
        where: {
          unit: {
            property: {
              ownerId: userId,
            },
          },
        },
        include: {
          tenant: true,
          unit: {
            include: {
              property: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }
  }

  async updateStatus(userId: string, requestId: string, dto: UpdateMaintenanceStatusDto) {
    // Verify landlord owns the property for this request
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: {
        unit: {
          include: {
            property: true,
          },
        },
      },
    });

    if (!request || request.unit.property.ownerId !== userId) {
      throw new NotFoundException('Maintenance request not found under your properties.');
    }

    const updated = await this.prisma.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        status: dto.status,
        resolvedAt: dto.status === MaintenanceStatus.RESOLVED ? new Date() : null,
      },
      include: {
        tenant: true,
        unit: {
          include: {
            property: true,
          },
        },
      },
    });

    try {
      const formattedStatus = dto.status.replace(/_/g, ' ');
      // Notify tenant if user account exists
      if (updated.tenant?.userId) {
        await this.notificationsService.create({
          userId: updated.tenant.userId,
          title: `Repair Status: ${formattedStatus}`,
          message: `Your maintenance ticket "${request.title}" is now marked as ${formattedStatus}.`,
          type: NotificationType.MAINTENANCE_UPDATE,
          link: '/tenant-portal',
        });
      }

      // Record in Landlord's feed as well
      await this.notificationsService.create({
        userId,
        title: `Repair Updated: ${formattedStatus}`,
        message: `Ticket "${request.title}" for Unit ${updated.unit.unitNumber} marked as ${formattedStatus}.`,
        type: NotificationType.MAINTENANCE_UPDATE,
        link: '/dashboard/maintenance',
      });
    } catch (e) {
      console.error('Failed to notify on maintenance status update', e);
    }

    return updated;
  }
}
