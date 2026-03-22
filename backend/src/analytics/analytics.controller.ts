import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('personal')
  @ApiOperation({ summary: 'Get personal spending insights' })
  personalInsights(@CurrentUser('id') userId: string) {
    return this.analyticsService.personalInsights(userId);
  }

  @Get('personal/trends')
  @ApiOperation({ summary: 'Get monthly spending trends' })
  @ApiQuery({ name: 'months', required: false, type: Number })
  monthlyTrends(@CurrentUser('id') userId: string, @Query('months') months?: number) {
    return this.analyticsService.monthlyTrends(userId, months);
  }

  @Get('household/:householdId')
  @ApiOperation({ summary: 'Get household spending insights with per-member breakdown' })
  householdInsights(@Param('householdId') householdId: string) {
    return this.analyticsService.householdInsights(householdId);
  }
}
