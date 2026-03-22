import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto, UpdateSubscriptionDto } from './dto/subscription.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a subscription' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateSubscriptionDto) {
    return this.subscriptionsService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subscriptions (personal + household)' })
  findAll(@CurrentUser('id') userId: string) {
    return this.subscriptionsService.findAll(userId);
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming due subscriptions' })
  getUpcoming(@CurrentUser('id') userId: string, @Query('days') days?: number) {
    return this.subscriptionsService.getUpcomingDue(userId, days);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get subscription by ID' })
  findById(@Param('id') id: string) {
    return this.subscriptionsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update subscription' })
  update(@Param('id') id: string, @Body() dto: UpdateSubscriptionDto) {
    return this.subscriptionsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel subscription' })
  cancel(@Param('id') id: string) {
    return this.subscriptionsService.cancel(id);
  }
}
