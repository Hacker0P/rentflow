import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { User, UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findByEmailOrPhone(identifier: string): Promise<User | null> {
    const clean = identifier.trim().toLowerCase();
    const digitsOnly = clean.replace(/[^0-9]/g, '');

    // 1. Direct email match
    let user = await this.prisma.user.findUnique({
      where: { email: clean },
    });
    if (user) return user;

    // 2. If it has at least 10 digits, match on phone
    if (digitsOnly.length >= 10) {
      const last10 = digitsOnly.slice(-10);
      user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { phone: { contains: last10 } },
            { email: { startsWith: last10 } },
          ],
        },
      });
      if (user) return user;

      // Check tenant table for linked user
      const tenant = await this.prisma.tenant.findFirst({
        where: {
          phone: { contains: last10 },
        },
        include: { user: true },
      });
      if (tenant?.user) return tenant.user;
    }

    return null;
  }

  async findById(id: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async create(data: { name: string; email: string; passwordHash: string; phone?: string; role?: UserRole }): Promise<User> {
    return this.prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        passwordHash: data.passwordHash,
        phone: data.phone?.trim() || null,
        role: data.role || UserRole.LANDLORD,
      },
    });
  }

  async updateProfile(id: string, data: Partial<User>): Promise<Omit<User, 'passwordHash'>> {
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.phone !== undefined ? { phone: data.phone?.trim() || null } : {}),
        ...(data.upiId !== undefined ? { upiId: data.upiId?.trim() || null } : {}),
        ...(data.panNumber !== undefined ? { panNumber: data.panNumber?.trim().toUpperCase() || null } : {}),
        ...(data.bankName !== undefined ? { bankName: data.bankName?.trim() || null } : {}),
        ...(data.bankAccountNumber !== undefined ? { bankAccountNumber: data.bankAccountNumber?.trim() || null } : {}),
        ...(data.bankIfsc !== undefined ? { bankIfsc: data.bankIfsc?.trim().toUpperCase() || null } : {}),
        ...(data.qrImageUrl !== undefined || (data as any).qrimageurl !== undefined
          ? { qrImageUrl: data.qrImageUrl || (data as any).qrimageurl || null }
          : {}),
      },
    });

    const { passwordHash, ...userWithoutPassword } = updated;
    return userWithoutPassword;
  }
}
