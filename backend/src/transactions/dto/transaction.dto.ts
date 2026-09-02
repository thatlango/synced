import {
  IsString,
  IsNumber,
  IsPositive,
  IsEnum,
  IsOptional,
  IsNotEmpty,
  IsObject,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TransactionTypeEnum {
  CREDIT = 'credit',
  DEBIT = 'debit',
}

export enum VisibilityEnum {
  PERSONAL = 'personal',
  HOUSEHOLD = 'household',
  BOTH = 'both',
}

export class CreateTransactionDto {
  @ApiProperty({ description: 'Wallet ID to debit/credit' })
  @IsString()
  @IsNotEmpty()
  walletId: string;

  @ApiProperty({ enum: ['credit', 'debit'] })
  @IsEnum(TransactionTypeEnum)
  type: 'credit' | 'debit';

  @ApiProperty({ example: 15000 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ example: 'food' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'Lunch at Cafe Javas' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Cafe Javas' })
  @IsOptional()
  @IsString()
  merchant?: string;

  @ApiPropertyOptional({ enum: ['mtn', 'airtel', 'sms', 'email', 'manual'], default: 'manual' })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ description: 'External/provider idempotency reference' })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Structured, non-sensitive classification metadata such as loan/debt semantics.' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: ['personal', 'household', 'both'], default: 'personal' })
  @IsOptional()
  @IsEnum(VisibilityEnum)
  visibility?: 'personal' | 'household' | 'both';
}

export class FilterTransactionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  walletId?: string;

  @ApiPropertyOptional({ enum: ['personal', 'household', 'all'] })
  @IsOptional()
  @IsString()
  scope?: 'personal' | 'household' | 'all';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ enum: ['credit', 'debit'] })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number;
}
