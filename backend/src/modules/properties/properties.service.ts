import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { UnitStatus } from '@prisma/client';

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
    const property = await this.findOne(ownerId, propertyId);

    if (property.units.length > 0) {
      throw new BadRequestException(
        `Cannot delete property "${property.name}" because it still contains ${property.units.length} unit(s). Delete all units first to preserve data integrity.`,
      );
    }

    return this.prisma.property.delete({
      where: { id: propertyId },
    });
  }
}
