import {
  IsString, IsNumber, IsPositive, IsOptional, IsNotEmpty, IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PayBillDto {
  @ApiProperty({ description: 'Bill ID to pay' })
  @IsString()
  @IsNotEmpty()
  billId: string;

  @ApiProperty({ description: 'Wallet ID to pay from' })
  @IsString()
  @IsNotEmpty()
  walletId: string;

  @ApiProperty({ example: 35000 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ example: 'NWSC', description: 'Payment provider' })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiPropertyOptional({ example: '0700000001' })
  @IsOptional()
  @IsString()
  accountRef?: string;
}

export class DirectPaymentDto {
  @ApiProperty({ description: 'Wallet ID to debit from' })
  @IsString()
  @IsNotEmpty()
  walletId: string;

  @ApiProperty({ example: 50000 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ example: 'UEDCL' })
  @IsString()
  @IsNotEmpty()
  provider: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountRef?: string;

  @ApiPropertyOptional({ example: 'Electricity bill payment' })
  @IsOptional()
  @IsString()
  description?: string;
}
