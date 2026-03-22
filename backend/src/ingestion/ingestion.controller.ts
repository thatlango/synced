import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { IngestionService } from './ingestion.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { IsString, IsNotEmpty } from 'class-validator';
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
  @ApiOperation({ summary: 'Ingest transaction from SMS body' })
  ingestSms(@CurrentUser('id') userId: string, @Body() dto: IngestSmsDto) {
    return this.ingestionService.ingestSms(userId, dto.walletId, dto.smsBody);
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
