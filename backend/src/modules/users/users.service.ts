import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findById(id: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) return null;

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async create(data: { name: string; email: string; passwordHash: string }): Promise<User> {
    return this.prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        passwordHash: data.passwordHash,
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
