import { IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class GenerateInvoicesDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}(-\d{2})?$/, {
    message: 'billingMonth must be in YYYY-MM or YYYY-MM-DD format (e.g. 2026-09 or 2026-09-01)',
  })
  billingMonth?: string;

  @IsOptional()
  @IsUUID('4', { message: 'propertyId must be a valid UUID' })
  propertyId?: string;
}
