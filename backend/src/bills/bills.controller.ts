import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/bill.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('bills')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a bill' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateBillDto) {
    return this.billsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bills' })
  @ApiQuery({ name: 'includePaid', required: false, type: Boolean })
  findAll(@CurrentUser('id') userId: string, @Query('includePaid') includePaid?: boolean) {
    return this.billsService.findAll(userId, includePaid);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming bills + subscriptions, including inferred recurring obligations' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  getUpcoming(@CurrentUser('id') userId: string, @Query('days') days?: number) {
    return this.billsService.getUpcomingBills(userId, days);
  }

  @Post('detect-recurring')
  @ApiOperation({ summary: 'Analyse transaction history for recurring obligations and optionally auto-create strong matches' })
  detectRecurring(
    @CurrentUser('id') userId: string,
    @Body() body?: { autoCreate?: boolean },
  ) {
    return this.billsService.detectRecurring(userId, body?.autoCreate !== false);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bill by ID' })
  findById(@Param('id') id: string) {
    return this.billsService.findById(id);
  }

  @Patch(':id/mark-paid')
  @ApiOperation({ summary: 'Mark a bill as paid and roll recurring bills into their next cycle' })
  markPaid(@Param('id') id: string) {
    return this.billsService.markPaid(id);
  }
}
