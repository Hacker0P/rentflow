import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceItemType } from '@prisma/client';

export class CreateInvoiceItemDto {
  @IsEnum(InvoiceItemType, { message: 'Type must be RENT, MAINTENANCE, or OTHER' })
  type: InvoiceItemType;

  @IsString()
  @IsNotEmpty({ message: 'Description is required' })
  description: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Amount must be a valid number' })
  @Min(0.01, { message: 'Amount must be greater than zero' })
  amount: number;
}

export class CreateInvoiceDto {
  @IsUUID('4', { message: 'leaseId must be a valid UUID' })
  @IsNotEmpty({ message: 'leaseId is required' })
  leaseId: string;

  @IsDateString({}, { message: 'billingMonth must be a valid date string (e.g. 2026-09-01)' })
  billingMonth: string;

  @IsDateString({}, { message: 'dueDate must be a valid date string (e.g. 2026-09-05)' })
  dueDate: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateInvoiceItemDto)
  items?: CreateInvoiceItemDto[];
}
