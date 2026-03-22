import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ForecastsService } from './forecasts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('forecasts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('forecasts')
export class ForecastsController {
  constructor(private readonly forecastsService: ForecastsService) {}

  @Get('personal')
  @ApiOperation({ summary: 'Get personal financial forecast (3-month projection)' })
  personalForecast(@CurrentUser('id') userId: string) {
    return this.forecastsService.personalForecast(userId);
  }

  @Get('household/:householdId')
  @ApiOperation({ summary: 'Get household financial forecast' })
  householdForecast(@Param('householdId') householdId: string) {
    return this.forecastsService.householdForecast(householdId);
  }
}
