import { IsString, IsOptional, IsEnum, IsNumber, IsArray, Min, Max, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ServiceKind, TradingType, ServiceMedium, ProcessingTime, ShippingType } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateServiceDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ enum: ServiceKind })
  @IsEnum(ServiceKind)
  kind: ServiceKind;

  @ApiProperty({ enum: TradingType })
  @IsEnum(TradingType)
  tradingType: TradingType;

  @ApiProperty({ enum: ServiceMedium, required: false })
  @IsEnum(ServiceMedium)
  @IsOptional()
  medium?: ServiceMedium;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  simbiPrice?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  usdPrice?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  estimatedHours?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  radius?: number;
}

export class UpdateServiceDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[];

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  simbiPrice?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  usdPrice?: number;
}

export class SearchServicesDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  query?: string;

  @ApiProperty({ enum: ServiceKind, required: false })
  @IsEnum(ServiceKind)
  @IsOptional()
  kind?: ServiceKind;

  @ApiProperty({ enum: TradingType, required: false })
  @IsEnum(TradingType)
  @IsOptional()
  tradingType?: TradingType;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ required: false })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiProperty({ required: false })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiProperty({ required: false })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  radius?: number;

  @ApiProperty({ required: false, default: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false, default: 20 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiProperty({ required: false, default: 'createdAt', enum: ['createdAt', 'updatedAt', 'title', 'simbiPrice', 'usdPrice'] })
  @IsString()
  @IsIn(['createdAt', 'updatedAt', 'title', 'simbiPrice', 'usdPrice'])
  @IsOptional()
  sortBy?: string;

  @ApiProperty({ required: false, default: 'desc', enum: ['asc', 'desc'] })
  @IsEnum(['asc', 'desc'])
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

export class FlagServiceDto {
  @ApiProperty({ description: 'Reason for flagging the service', example: 'inappropriate_content' })
  @IsString()
  reason: string;

  @ApiProperty({ required: false, description: 'Additional details about the flag' })
  @IsOptional()
  @IsString()
  description?: string;
}
