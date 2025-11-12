import { IsNumber, IsString, IsPositive, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentIntentDto {
  @ApiProperty({ description: 'Amount in cents (e.g., 1000 = $10.00)', minimum: 50, maximum: 99999999 })
  @IsNumber()
  @IsPositive()
  @Min(50) // Minimum $0.50
  @Max(99999999) // Maximum $999,999.99
  amount: number;

  @ApiProperty({ description: 'Optional currency code', required: false, default: 'usd' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'Optional description', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateSubscriptionDto {
  @ApiProperty({ description: 'Stripe price ID' })
  @IsString()
  priceId: string;

  @ApiProperty({ description: 'Optional payment method ID', required: false })
  @IsString()
  @IsOptional()
  paymentMethodId?: string;
}

export class AddPaymentMethodDto {
  @ApiProperty({ description: 'Stripe payment method ID' })
  @IsString()
  paymentMethodId: string;
}
