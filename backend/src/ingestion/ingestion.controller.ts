import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IngestionService } from './ingestion.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IsString, IsNotEmpty, IsArray, IsNumber, IsPositive, IsIn, IsOptional, ValidateNested, MaxLength, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class IngestSmsDto {
  @ApiProperty({ example: 'wallet-id-here' })
  @IsString()
  @IsNotEmpty()
  walletId: string;

  @ApiProperty({ example: 'You have received UGX 50,000 from John Doe.' })
  @IsString()
  @IsNotEmpty()
  smsBody: string;
}

class IngestBulkSmsDto {
  @ApiProperty({ example: 'wallet-id-here' })
  @IsString()
  @IsNotEmpty()
  walletId: string;

  @ApiProperty({ type: [String], example: ['You have received UGX 50,000 from John Doe.'] })
  @IsArray()
  smsBodies: string[];
}

class StructuredSmsCandidateDto {
  @ApiProperty({ example: 50000 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ enum: ['credit', 'debit'] })
  @IsIn(['credit', 'debit'])
  type: 'credit' | 'debit';

  @ApiProperty({ example: 'Payment to merchant' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  merchant?: string;

  @ApiProperty({ required: false, description: 'Provider reference or locally generated one-way fingerprint; never raw SMS text.' })
  @IsOptional()
  @IsString()
  @MaxLength(180)
  referenceId?: string;

  @ApiProperty({ enum: ['mtn', 'airtel', 'sms'] })
  @IsIn(['mtn', 'airtel', 'sms'])
  source: 'mtn' | 'airtel' | 'sms';

  @ApiProperty({ required: false, minimum: 0, maximum: 1 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;

  @ApiProperty({ required: false, enum: ['loan', 'debt'] })
  @IsOptional()
  @IsIn(['loan', 'debt'])
  financialKind?: 'loan' | 'debt';

  @ApiProperty({ required: false, example: 'loan_repayment' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  financialSubtype?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  counterparty?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  principalAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  interestAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  feeAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  penaltyAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  outstandingBalance?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dueAmount?: number;

  @ApiProperty({ required: false, description: 'Due date extracted locally from the SMS when present.' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  dueDate?: string;
}

class IngestCandidateBulkDto {
  @ApiProperty({ example: 'wallet-id-here' })
  @IsString()
  @IsNotEmpty()
  walletId: string;

  @ApiProperty({ type: [StructuredSmsCandidateDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StructuredSmsCandidateDto)
  candidates: StructuredSmsCandidateDto[];
}

class FetchMoMoDto {
  @ApiProperty({ example: 'wallet-id-here' })
  @IsString()
  @IsNotEmpty()
  walletId: string;
}

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('sms')
  @ApiOperation({ summary: 'Ingest a single SMS transaction' })
  ingestSms(@CurrentUser('id') userId: string, @Body() dto: IngestSmsDto) {
    return this.ingestionService.ingestSms(userId, dto.walletId, dto.smsBody);
  }

  @Post('sms/bulk')
  @ApiOperation({ summary: 'Ingest multiple SMS messages at once (mobile batch sync)' })
  ingestBulkSms(@CurrentUser('id') userId: string, @Body() dto: IngestBulkSmsDto) {
    return this.ingestionService.ingestBulkSms(userId, dto.walletId, dto.smsBodies);
  }

  @Post('sms/candidates/bulk')
  @ApiOperation({ summary: 'Ingest locally parsed financial SMS candidates without receiving raw message text' })
  ingestCandidateBulk(@CurrentUser('id') userId: string, @Body() dto: IngestCandidateBulkDto) {
    return this.ingestionService.ingestCandidateBulk(userId, dto.walletId, dto.candidates);
  }

  @Post('sms/preview')
  @ApiOperation({ summary: 'Preview parse result for an SMS without saving' })
  previewSms(@Body() dto: IngestSmsDto) {
    return this.ingestionService.parseSms(dto.smsBody);
  }

  @Post('mtn/sync')
  @ApiOperation({ summary: 'Sync MTN MoMo transactions (mock)' })
  syncMtn(@CurrentUser('id') userId: string, @Body() dto: FetchMoMoDto) {
    return this.ingestionService.fetchMtnTransactions(userId, dto.walletId);
  }

  @Post('airtel/sync')
  @ApiOperation({ summary: 'Sync Airtel Money transactions (mock)' })
  syncAirtel(@CurrentUser('id') userId: string, @Body() dto: FetchMoMoDto) {
    return this.ingestionService.fetchAirtelTransactions(userId, dto.walletId);
  }
}
