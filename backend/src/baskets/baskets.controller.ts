import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { BasketsService } from './baskets.service';
@ApiTags('baskets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('baskets')
export class BasketsController {
  constructor(private readonly baskets: BasketsService) {}
  @Get() list(@CurrentUser('id') userId: string) { return this.baskets.list(userId); }
  @Get(':id') detail(@CurrentUser('id') userId: string, @Param('id') id: string) { return this.baskets.detail(userId, id); }
  @Post() create(@CurrentUser('id') userId: string, @Body() body: any) { return this.baskets.create(userId, body); }
  @Post(':id/contributions') contribute(@CurrentUser('id') userId: string, @Param('id') id: string, @Body() body: any) { return this.baskets.contribute(userId, id, body); }
}
