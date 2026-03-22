import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { WalletsService } from './wallets.service';
import { FundWalletDto } from './dto/wallet.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('wallets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get wallet summary (personal + household)' })
  getWalletSummary(@CurrentUser('id') userId: string) {
    return this.walletsService.getWalletSummary(userId);
  }

  @Get('personal')
  @ApiOperation({ summary: 'Get personal wallet' })
  getPersonalWallet(@CurrentUser('id') userId: string) {
    return this.walletsService.getPersonalWallet(userId);
  }

  @Get('household/:householdId')
  @ApiOperation({ summary: 'Get household wallet' })
  getHouseholdWallet(@Param('householdId') householdId: string) {
    return this.walletsService.getHouseholdWallet(householdId);
  }

  @Post(':id/fund')
  @ApiOperation({ summary: 'Fund a wallet' })
  fundWallet(
    @Param('id') walletId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: FundWalletDto,
  ) {
    return this.walletsService.fundWallet(walletId, userId, dto);
  }

  @Get(':id/ledger')
  @ApiOperation({ summary: 'Get wallet ledger history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getLedger(
    @Param('id') walletId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.walletsService.getLedgerHistory(walletId, page, limit);
  }
}
