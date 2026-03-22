import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, FilterTransactionsDto } from './dto/transaction.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a transaction (expense/income)' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List transactions with filters' })
  findAll(@CurrentUser('id') userId: string, @Query() filters: FilterTransactionsDto) {
    return this.transactionsService.findAll(userId, filters);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get spending summary for a period' })
  @ApiQuery({ name: 'period', enum: ['week', 'month', 'year'], required: false })
  getSpendingSummary(
    @CurrentUser('id') userId: string,
    @Query('period') period: 'week' | 'month' | 'year',
  ) {
    return this.transactionsService.getSpendingSummary(userId, period);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID' })
  findById(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.transactionsService.findById(id, userId);
  }
}
