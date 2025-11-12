import { IsString, IsOptional, IsEnum, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: UserRole, description: 'New role for the user' })
  @IsEnum(UserRole)
  role: UserRole;
}

export class BanUserDto {
  @ApiProperty({ description: 'Reason for banning the user' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Duration in days (leave empty for permanent)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration?: number;
}

export class ResolveFlagDto {
  @ApiProperty({ description: 'Resolution action taken' })
  @IsString()
  action: string;

  @ApiPropertyOptional({ description: 'Notes about the resolution' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ModerateContentDto {
  @ApiProperty({ description: 'Action to take: hide, delete, or restore' })
  @IsEnum(['hide', 'delete', 'restore'])
  action: 'hide' | 'delete' | 'restore';

  @ApiPropertyOptional({ description: 'Reason for moderation' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AdminSearchDto {
  @ApiPropertyOptional({ description: 'Search query' })
  @IsOptional()
  @IsString()
  query?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Filter by role' })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Include deleted items' })
  @IsOptional()
  @IsBoolean()
  includeDeleted?: boolean;
}
