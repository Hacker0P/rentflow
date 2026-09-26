import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { MaintenanceCategory, MaintenancePriority } from '@prisma/client';

export class CreateMaintenanceDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(MaintenanceCategory)
  @IsOptional()
  category?: MaintenanceCategory;

  @IsEnum(MaintenancePriority)
  @IsOptional()
  priority?: MaintenancePriority;
}
