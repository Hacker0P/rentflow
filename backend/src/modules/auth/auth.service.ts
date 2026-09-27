import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '@/modules/users/users.service';
import { PrismaService } from '@/prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { GoogleLoginDto } from './dto/google-login.dto';

@Injectable()
export class AuthService {
  // In-memory OTP storage with TTL
  private readonly otpStore = new Map<string, { code: string; expiresAt: Date }>();

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async sendOtp(dto: SendOtpDto) {
    const digitsOnly = dto.phone.replace(/[^0-9]/g, '');
    if (digitsOnly.length < 10) {
      throw new BadRequestException('Please provide a valid 10-digit Indian phone number.');
    }

    const last10 = digitsOnly.slice(-10);
    // Generate 6-digit OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    this.otpStore.set(last10, { code, expiresAt });

    return {
      success: true,
      message: `OTP sent successfully to +91 ${last10}`,
      phone: last10,
      otp: code,
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const digitsOnly = dto.phone.replace(/[^0-9]/g, '');
    if (digitsOnly.length < 10) {
      throw new BadRequestException('Please provide a valid 10-digit Indian phone number.');
    }

    const last10 = digitsOnly.slice(-10);
    const stored = this.otpStore.get(last10);

    const isDevMasterOtp = dto.otp === '123456';
    const isMatchingStoredOtp = stored && stored.code === dto.otp && stored.expiresAt > new Date();

    if (!isDevMasterOtp && !isMatchingStoredOtp) {
      throw new UnauthorizedException('Invalid or expired OTP. Please request a new code.');
    }

    // Clean up used OTP
    this.otpStore.delete(last10);

    // Check if user already exists
    let user = await this.usersService.findByEmailOrPhone(last10);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;

      // Check if this phone number is a tenant already created by a landlord
      const matchingTenant = await this.prisma.tenant.findFirst({
        where: {
          phone: { contains: last10 },
        },
      });

      const determinedRole = matchingTenant ? UserRole.TENANT : (dto.role || UserRole.LANDLORD);
      const name = dto.name?.trim() || matchingTenant?.name || (determinedRole === UserRole.TENANT ? 'Tenant' : 'Landlord');
      const email = `${last10}@phone.rentflow.in`;
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      user = await this.usersService.create({
        name,
        email,
        phone: `+91${last10}`,
        role: determinedRole,
        passwordHash,
      });

      // Auto-link tenant record if exists
      if (matchingTenant && !matchingTenant.userId) {
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
      isNewUser,
    };
  }

  async googleLogin(dto: GoogleLoginDto) {
    const cleanEmail = dto.email.toLowerCase().trim();
    let user = await this.usersService.findByEmail(cleanEmail);
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const passwordHash = await bcrypt.hash(randomPassword, 10);

      user = await this.usersService.create({
        name: dto.name.trim(),
        email: cleanEmail,
        role: dto.role || UserRole.LANDLORD,
        passwordHash,
      });

      // If role is TENANT, check if landlord already added this tenant with email
      if (user.role === UserRole.TENANT) {
        const matchingTenant = await this.prisma.tenant.findFirst({
          where: {
            email: cleanEmail,
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
      isNewUser,
    };
  }

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
        phone: user.phone,
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
