import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class RecordPaymentDto {
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'amount must be a valid monetary value' })
  @Min(0.01, { message: 'amount must be greater than zero' })
  amount: number;

  @IsOptional()
  @IsDateString({}, { message: 'paymentDate must be a valid ISO date string (YYYY-MM-DD)' })
  paymentDate?: string;

  @IsEnum(PaymentMethod, {
    message: 'paymentMethod must be CASH, UPI, BANK_TRANSFER, CHEQUE, or OTHER',
  })
  paymentMethod: PaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'transactionReference cannot exceed 100 characters' })
  transactionReference?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
