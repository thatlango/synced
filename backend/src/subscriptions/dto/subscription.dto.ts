import {
  IsString,
  IsNumber,
  IsPositive,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSubscriptionDto {
  @ApiPropertyOptional({ example: 'household', enum: ['user', 'household'] })
  @IsOptional()
  @IsEnum(['user', 'household'])
  ownerType?: 'user' | 'household';

  @ApiPropertyOptional({ description: 'Household ID if ownerType is household' })
  @IsOptional()
  @IsString()
  householdId?: string;

  @ApiProperty({ example: 'Netflix' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'entertainment' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ example: 45000 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ enum: ['daily', 'weekly', 'monthly', 'quarterly', 'annually'], default: 'monthly' })
  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly', 'quarterly', 'annually'])
  billingCycle?: string;

  @ApiProperty({ example: '2026-04-01' })
  @IsDateString()
  nextDueDate: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logo?: string;
}

export class UpdateSubscriptionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextDueDate?: string;

  @ApiPropertyOptional({ enum: ['active', 'paused', 'cancelled'] })
  @IsOptional()
  @IsEnum(['active', 'paused', 'cancelled'])
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;
}
