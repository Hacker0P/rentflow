import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTenantDto) {
    const normalizedPhone = dto.phone.trim();
    const normalizedEmail = dto.email ? dto.email.trim().toLowerCase() : null;

    // Check if tenant with this phone already exists to avoid duplicate profiles
    const existing = await this.prisma.tenant.findFirst({
      where: { phone: normalizedPhone },
    });

    if (existing) {
      // Update details if email or name provided
      return this.prisma.tenant.update({
        where: { id: existing.id },
        data: {
          name: dto.name.trim(),
          email: normalizedEmail || existing.email,
        },
      });
    }

    return this.prisma.tenant.create({
      data: {
        name: dto.name.trim(),
        phone: normalizedPhone,
        email: normalizedEmail,
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
}
