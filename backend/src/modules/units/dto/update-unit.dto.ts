import { IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { UnitStatus } from '@prisma/client';

export class UpdateUnitDto {
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: 'Unit number cannot exceed 50 characters' })
  unitNumber?: string;

  @IsOptional()
  @IsInt({ message: 'Floor must be an integer number' })
  floor?: number;

  @IsOptional()
  @IsEnum(UnitStatus, { message: 'Status must be either VACANT or OCCUPIED' })
  status?: UnitStatus;
}
