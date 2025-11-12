import { IsString, IsOptional, IsEmail, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

export class UpdateProfileDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  about?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  zipcode?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  qualifications?: string;
}

export class UpdateSettingsDto {
  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  disabledNotifications?: boolean;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  vacationMode?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  enabledFeatures?: string[];
}

/**
 * Response DTO for User - Excludes sensitive fields from API responses
 * This DTO is used to sanitize user data before sending it to the client
 */
export class UserResponseDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  email: string;

  @ApiProperty()
  @Expose()
  emailVerified: boolean;

  @ApiProperty()
  @Expose()
  role: string;

  // Profile fields
  @ApiProperty({ required: false })
  @Expose()
  firstName?: string;

  @ApiProperty({ required: false })
  @Expose()
  lastName?: string;

  @ApiProperty({ required: false })
  @Expose()
  username?: string;

  @ApiProperty({ required: false })
  @Expose()
  slug?: string;

  @ApiProperty({ required: false })
  @Expose()
  about?: string;

  @ApiProperty({ required: false })
  @Expose()
  avatar?: string;

  @ApiProperty({ required: false })
  @Expose()
  website?: string;

  @ApiProperty({ required: false })
  @Expose()
  qualifications?: string;

  // Location (public)
  @ApiProperty({ required: false })
  @Expose()
  city?: string;

  @ApiProperty({ required: false })
  @Expose()
  state?: string;

  @ApiProperty({ required: false })
  @Expose()
  country?: string;

  // Metrics (public)
  @ApiProperty()
  @Expose()
  rating: number;

  @ApiProperty()
  @Expose()
  responseRate: number;

  @ApiProperty()
  @Expose()
  strength: number;

  @ApiProperty()
  @Expose()
  trustScore: number;

  // Status
  @ApiProperty({ required: false })
  @Expose()
  onboardingState?: string;

  @ApiProperty({ required: false })
  @Expose()
  lastSeenAt?: Date;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  // Sensitive fields - EXCLUDED from all responses
  @Exclude()
  password?: string;

  @Exclude()
  phoneNumber?: string;

  @Exclude()
  address?: string;

  @Exclude()
  zipcode?: string;

  @Exclude()
  countryCode?: string;

  @Exclude()
  latitude?: number;

  @Exclude()
  longitude?: number;

  @Exclude()
  timezone?: string;

  @Exclude()
  emailVerifiedAt?: Date;

  @Exclude()
  phoneVerified?: boolean;

  @Exclude()
  deactivatedAt?: Date;

  @Exclude()
  deletedAt?: Date;

  @Exclude()
  disabledNotifications?: boolean;

  @Exclude()
  vacationMode?: boolean;

  @Exclude()
  vacationModeUntil?: Date;

  @Exclude()
  settings?: any;

  @Exclude()
  enabledFeatures?: string[];

  @Exclude()
  referralCode?: string;

  @Exclude()
  referredBy?: string;

  @Exclude()
  updatedAt?: Date;

  // Relations - EXCLUDED (prevent eager loading leaks)
  @Exclude()
  oauthAccounts?: any[];

  @Exclude()
  refreshTokens?: any[];

  @Exclude()
  devices?: any[];

  @Exclude()
  paymentMethods?: any[];

  @Exclude()
  subscriptions?: any[];

  @Exclude()
  transactions?: any[];
}

/**
 * Private User Response - For authenticated user viewing their own profile
 * Includes some sensitive fields that the user should see about themselves
 */
export class PrivateUserResponseDto extends UserResponseDto {
  @ApiProperty({ required: false })
  @Expose()
  phoneNumber?: string;

  @ApiProperty({ required: false })
  @Expose()
  address?: string;

  @ApiProperty({ required: false })
  @Expose()
  zipcode?: string;

  @ApiProperty()
  @Expose()
  disabledNotifications: boolean;

  @ApiProperty()
  @Expose()
  vacationMode: boolean;

  @ApiProperty({ required: false })
  @Expose()
  vacationModeUntil?: Date;

  @ApiProperty({ required: false })
  @Expose()
  enabledFeatures?: string[];

  @ApiProperty({ required: false })
  @Expose()
  referralCode?: string;
}
