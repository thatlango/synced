import {
  IsString, IsNumber, IsPositive, IsOptional, IsEnum, IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBudgetDto {
  @ApiPropertyOptional({ enum: ['user', 'household'], default: 'user' })
  @IsOptional()
  @IsEnum(['user', 'household'])
  ownerType?: 'user' | 'household';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  householdId?: string;

  @ApiProperty({ example: 'food' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 200000 })
  @IsNumber()
  @IsPositive()
  limitAmount: number;

  @ApiPropertyOptional({ enum: ['daily', 'weekly', 'monthly', 'quarterly', 'annually'], default: 'monthly' })
  @IsOptional()
  @IsEnum(['daily', 'weekly', 'monthly', 'quarterly', 'annually'])
  period?: string;
}
