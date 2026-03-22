import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { PayBillDto, DirectPaymentDto } from './dto/payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('pay-bill')
  @ApiOperation({ summary: 'Pay a bill from a wallet' })
  payBill(@CurrentUser('id') userId: string, @Body() dto: PayBillDto) {
    return this.paymentsService.payBill(userId, dto);
  }

  @Post('direct')
  @ApiOperation({ summary: 'Make a direct payment (water, electricity, TV, rent, school)' })
  directPayment(@CurrentUser('id') userId: string, @Body() dto: DirectPaymentDto) {
    return this.paymentsService.directPayment(userId, dto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get payment history' })
  getHistory(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.paymentsService.getPaymentHistory(userId, page, limit);
  }
}
