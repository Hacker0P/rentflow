import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '@/modules/users/users.service';
import { PrismaService } from '@/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      role: dto.role || UserRole.LANDLORD,
      passwordHash,
    });

    // If registered as TENANT, auto-link to matching Tenant record if exists
    if (user.role === UserRole.TENANT) {
      const cleanPhone = dto.phone ? dto.phone.replace(/[^0-9]/g, '') : '';
      const last10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : '';

      const matchingTenant = await this.prisma.tenant.findFirst({
        where: {
          OR: [
            ...(last10 ? [{ phone: { contains: last10 } }] : []),
            { email: user.email },
          ],
          userId: null,
        },
      });

      if (matchingTenant) {
        await this.prisma.tenant.update({
          where: { id: matchingTenant.id },
          data: { userId: user.id },
        });
      }
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailOrPhone(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid phone/email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User profile not found');
    }
    return user;
  }
}
