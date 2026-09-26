import { IsNotEmpty, IsNumber, IsPositive, IsEnum, IsString, IsOptional } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class ReportPaymentDto {
  @IsNumber()
  @IsPositive()
  amount: number;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsString()
  @IsNotEmpty()
  transactionReference: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
