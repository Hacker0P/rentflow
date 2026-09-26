import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty({ message: 'Tenant full name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'Tenant phone number is required' })
  @MinLength(7, { message: 'Phone number must be at least 7 characters' })
  @MaxLength(20, { message: 'Phone number cannot exceed 20 characters' })
  phone: string;

  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  email?: string;
}
