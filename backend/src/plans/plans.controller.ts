import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PlansService } from './plans.service';
@ApiTags('plans')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('plans')
export class PlansController {
  constructor(private readonly plans: PlansService) {}
  @Get('current') current(@CurrentUser('id') userId: string) { return this.plans.current(userId); }
  @Post() create(@CurrentUser('id') userId: string, @Body() body: any) { return this.plans.create(userId, body); }
}
