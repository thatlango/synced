import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { LedgerService } from './ledger.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Get('mine')
  @ApiOperation({ summary: 'Get my ledger entries' })
  getMyEntries(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ledgerService.getEntriesByUser(userId, page, limit);
  }

  @Get('wallet/:walletId')
  @ApiOperation({ summary: 'Get ledger entries by wallet' })
  getByWallet(
    @Param('walletId') walletId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.ledgerService.getEntriesByWallet(walletId, page, limit);
  }
}
