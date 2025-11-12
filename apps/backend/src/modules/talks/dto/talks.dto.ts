import { IsString, IsOptional, IsNumber, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTalkDto {
  @ApiProperty()
  @IsString()
  receiverId: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  serviceId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  initialMessage?: string;
}

export class SendMessageDto {
  @ApiProperty()
  @IsString()
  content: string;

  @ApiProperty({ required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  attachments?: string[];
}

export class CreateOfferDto {
  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  simbiAmount?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  serviceOffered?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  hours?: number;
}
