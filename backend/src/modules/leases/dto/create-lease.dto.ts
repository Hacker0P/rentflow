import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTenantDto } from '@/modules/tenants/dto/create-tenant.dto';

export class CreateLeaseDto {
  @IsUUID('4', { message: 'Valid unitId UUID is required' })
  @IsNotEmpty({ message: 'unitId is required' })
  unitId: string;

  @IsOptional()
  @IsUUID('4', { message: 'tenantId must be a valid UUID' })
  tenantId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateTenantDto)
  tenant?: CreateTenantDto;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'monthlyRent must be a valid amount' })
  @Min(0, { message: 'monthlyRent cannot be negative' })
  monthlyRent: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'maintenanceAmount must be a valid amount' })
  @Min(0, { message: 'maintenanceAmount cannot be negative' })
  maintenanceAmount?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'securityDeposit must be a valid amount' })
  @Min(0, { message: 'securityDeposit cannot be negative' })
  securityDeposit?: number;

  @IsInt({ message: 'rentDueDay must be an integer day of the month' })
  @Min(1, { message: 'rentDueDay must be at least 1' })
  @Max(28, { message: 'rentDueDay cannot exceed 28 (to prevent short month/leap year overflow)' })
  rentDueDay: number;

  @IsDateString({}, { message: 'startDate must be a valid ISO date string (YYYY-MM-DD)' })
  startDate: string;

  @IsOptional()
  @IsDateString({}, { message: 'endDate must be a valid ISO date string (YYYY-MM-DD)' })
  endDate?: string;
}
