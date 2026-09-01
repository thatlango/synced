import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InvitesService } from './invites.service';
@ApiTags('invites')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('invites')
export class InvitesController {
  constructor(private readonly invites: InvitesService) {}
  @Post() create(@CurrentUser('id') userId: string, @Body() body: any) { return this.invites.create(userId, body); }
  @Get('code/:code') preview(@CurrentUser('id') userId: string, @Param('code') code: string) { return this.invites.preview(userId, code); }
  @Post('code/:code/redeem') redeem(@CurrentUser('id') userId: string, @Param('code') code: string) { return this.invites.redeem(userId, code); }
  @Post(':id/revoke') revoke(@CurrentUser('id') userId: string, @Param('id') id: string) { return this.invites.revoke(userId, id); }
}
