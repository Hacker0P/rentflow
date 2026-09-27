import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceStatusDto } from './dto/update-maintenance-status.dto';
import { LeaseStatus, MaintenanceStatus, UserRole, NotificationType, MaintenanceCategory, MaintenancePriority } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MaintenanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(userId: string, dto: CreateMaintenanceDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === UserRole.LANDLORD) {
      if (!dto.unitId) {
        throw new BadRequestException('Unit ID is required when logging a maintenance request as landlord.');
      }

      const unit = await this.prisma.unit.findUnique({
        where: { id: dto.unitId },
        include: {
          property: true,
          leases: {
            where: { status: LeaseStatus.ACTIVE },
            include: { tenant: true },
          },
        },
      });

      if (!unit || unit.property.ownerId !== userId) {
        throw new NotFoundException('Unit not found under your properties.');
      }

      let tenantId: string | null = null;
      let tenantUserId: string | null = null;

      if (unit.leases.length > 0) {
        tenantId = unit.leases[0].tenantId;
        tenantUserId = unit.leases[0].tenant.userId;
      } else {
        const pastLease = await this.prisma.lease.findFirst({
          where: { unitId: unit.id },
          include: { tenant: true },
          orderBy: { createdAt: 'desc' },
        });
        if (pastLease) {
          tenantId = pastLease.tenantId;
          tenantUserId = pastLease.tenant.userId;
        } else {
          // If unit has no tenant on record, search if any tenant profile exists under this landlord's properties
          const anyTenant = await this.prisma.tenant.findFirst();
          if (anyTenant) {
            tenantId = anyTenant.id;
          } else {
            throw new BadRequestException('Cannot raise maintenance ticket on a unit with no tenant on record.');
          }
        }
      }

      const created = await this.prisma.maintenanceRequest.create({
        data: {
          tenantId: tenantId!,
          unitId: unit.id,
          title: dto.title.trim(),
          description: dto.description.trim(),
          category: dto.category || MaintenanceCategory.OTHER,
          priority: dto.priority || MaintenancePriority.MEDIUM,
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

      if (tenantUserId) {
        try {
          await this.notificationsService.create({
            userId: tenantUserId,
            title: `Maintenance Request Logged: ${dto.title}`,
            message: `Landlord logged a maintenance ticket for Unit ${unit.unitNumber} (${unit.property.name}): "${dto.title}".`,
            type: NotificationType.MAINTENANCE_UPDATE,
            link: '/tenant/maintenance',
          });
        } catch (e) {
          console.error('Failed to notify tenant on maintenance creation', e);
        }
      }

      return created;
    } else {
      // User is TENANT
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
          title: dto.title.trim(),
          description: dto.description.trim(),
          category: dto.category || MaintenanceCategory.OTHER,
          priority: dto.priority || MaintenancePriority.MEDIUM,
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
          message: `Tenant ${tenant.name} reported a ${created.category.toLowerCase()} issue for Unit ${activeLease.unit.unitNumber}.`,
          type: NotificationType.MAINTENANCE_UPDATE,
          link: '/dashboard/maintenance',
        });
      } catch (e) {
        console.error('Failed to notify landlord on maintenance request', e);
      }

      return created;
    }
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
              property: {
                include: {
                  owner: {
                    select: {
                      name: true,
                      phone: true,
                    },
                  },
                },
              },
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
          link: '/tenant/maintenance',
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

  async remove(userId: string, requestId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: {
        unit: {
          include: {
            property: true,
          },
        },
        tenant: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Maintenance request not found');
    }

    if (user.role === UserRole.LANDLORD) {
      if (request.unit.property.ownerId !== userId) {
        throw new BadRequestException('You do not have permission to delete this ticket.');
      }
    } else {
      if (request.tenant.userId !== userId) {
        throw new BadRequestException('You do not have permission to delete this ticket.');
      }
    }

    return this.prisma.maintenanceRequest.delete({
      where: { id: requestId },
    });
  }
}
