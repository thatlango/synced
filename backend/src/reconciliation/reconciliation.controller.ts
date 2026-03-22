import { Controller, Post, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReconciliationService } from './reconciliation.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reconciliation')
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Post('run')
  @ApiOperation({ summary: 'Run reconciliation on all wallets' })
  runAll() {
    return this.reconciliationService.reconcileAllWallets();
  }

  @Post('wallet/:id')
  @ApiOperation({ summary: 'Reconcile a specific wallet' })
  reconcileWallet(@Param('id') id: string) {
    return this.reconciliationService.reconcileWallet(id);
  }

  @Get('wallet/:id/logs')
  @ApiOperation({ summary: 'Get reconciliation logs for wallet' })
  getLogs(@Param('id') id: string) {
    return this.reconciliationService.getReconciliationLogs(id);
  }
}
