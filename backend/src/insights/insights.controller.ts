import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InsightsService } from './insights.service';
@ApiTags('insights')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('insights')
export class InsightsController {
  constructor(private readonly insights: InsightsService) {}
  @Get('summary') summary(@CurrentUser('id') userId: string) { return this.insights.summary(userId); }
  @Post('ask') ask(@CurrentUser('id') userId: string, @Body() body: { question?: string }) { return this.insights.ask(userId, String(body?.question || '').slice(0, 2000)); }
}
