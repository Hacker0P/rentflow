import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { UnitStatus } from '@prisma/client';

export class CreateUnitDto {
  @IsString()
  @IsNotEmpty({ message: 'Unit number is required (e.g. 101, A-1, Flat 3B)' })
  @MaxLength(50, { message: 'Unit number cannot exceed 50 characters' })
  unitNumber: string;

  @IsOptional()
  @IsInt({ message: 'Floor must be an integer number' })
  floor?: number;

  @IsOptional()
  @IsEnum(UnitStatus, { message: 'Status must be either VACANT or OCCUPIED' })
  status?: UnitStatus;
}
