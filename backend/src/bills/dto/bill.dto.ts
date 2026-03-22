import {
  IsString, IsNumber, IsPositive, IsOptional, IsBoolean,
  IsDateString, IsEnum, IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

  @ApiPropertyOptional({ example: 'utilities' })
  @IsOptional()
  @IsString()
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
  @IsString()
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
