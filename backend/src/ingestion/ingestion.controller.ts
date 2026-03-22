import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IngestionService } from './ingestion.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IsString, IsNotEmpty, IsArray } from 'class-validator';
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
