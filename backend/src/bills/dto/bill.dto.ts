import {
  IsString, IsNumber, IsPositive, IsOptional, IsBoolean,
  IsDateString, IsEnum, IsNotEmpty, IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export const BILL_CATEGORIES = [
  'food',
  'transport',
  'utilities',
  'subscriptions',
  'rent',
  'school_fees',
  'entertainment',
  'healthcare',
  'shopping',
  'fuel',
  'mobile_data',
  'bill_payment',
  'other',
] as const;

export class CreateBillDto {
  @ApiPropertyOptional({ enum: ['user', 'household'], default: 'user' })
  @IsOptional()
  @IsEnum(['user', 'household'])
  ownerType?: 'user' | 'household';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  householdId?: string;

  @ApiProperty({ example: 'NWSC Water Bill - March' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'utilities', enum: BILL_CATEGORIES })
  @IsOptional()
  @IsIn(BILL_CATEGORIES)
  category?: string;

  @ApiProperty({ example: 35000 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ example: '2026-04-05' })
  @IsDateString()
  dueDate: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  recurring?: boolean;

  @ApiPropertyOptional({ enum: ['monthly', 'quarterly', 'annually'] })
  @IsOptional()
  @IsIn(['monthly', 'quarterly', 'annually'])
  billingCycle?: string;

  @ApiPropertyOptional({ example: 'NWSC' })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({ example: '0700000001' })
  @IsOptional()
  @IsString()
  accountRef?: string;
}
