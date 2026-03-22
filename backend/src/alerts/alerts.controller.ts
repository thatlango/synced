import { Controller, Get, Patch, Post, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'Get alerts/notifications' })
  @ApiQuery({ name: 'status', required: false, enum: ['unread', 'read', 'dismissed'] })
  getAlerts(@CurrentUser('id') userId: string, @Query('status') status?: string) {
    return this.alertsService.getAlerts(userId, status);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread alert count' })
  getUnreadCount(@CurrentUser('id') userId: string) {
    return this.alertsService.getUnreadCount(userId);
  }

  @Post('check')
  @ApiOperation({ summary: 'Trigger alert checks (low balance, upcoming bills, etc.)' })
  checkAlerts(@CurrentUser('id') userId: string) {
    return this.alertsService.checkAndGenerateAlerts(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark alert as read' })
  markRead(@Param('id') id: string) {
    return this.alertsService.markRead(id);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all alerts as read' })
  markAllRead(@CurrentUser('id') userId: string) {
    return this.alertsService.markAllRead(userId);
  }

  @Patch(':id/dismiss')
  @ApiOperation({ summary: 'Dismiss an alert' })
  dismiss(@Param('id') id: string) {
    return this.alertsService.dismiss(id);
  }
}
