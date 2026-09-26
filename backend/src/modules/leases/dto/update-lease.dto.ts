import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class UpdateLeaseDto {
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'monthlyRent must be a valid amount' })
  @Min(0, { message: 'monthlyRent cannot be negative' })
  monthlyRent?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'maintenanceAmount must be a valid amount' })
  @Min(0, { message: 'maintenanceAmount cannot be negative' })
  maintenanceAmount?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'securityDeposit must be a valid amount' })
  @Min(0, { message: 'securityDeposit cannot be negative' })
  securityDeposit?: number;

  @IsOptional()
  @IsInt({ message: 'rentDueDay must be an integer day of the month' })
  @Min(1, { message: 'rentDueDay must be at least 1' })
  @Max(28, { message: 'rentDueDay cannot exceed 28' })
  rentDueDay?: number;

  @IsOptional()
  @IsDateString({}, { message: 'endDate must be a valid ISO date string' })
  endDate?: string;
}
