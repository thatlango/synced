import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { HouseholdsService } from './households.service';
import { CreateHouseholdDto, JoinHouseholdDto, UpdateHouseholdDto } from './dto/household.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('households')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('households')
export class HouseholdsController {
  constructor(private readonly householdsService: HouseholdsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new household' })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateHouseholdDto) {
    return this.householdsService.create(userId, dto);
  }

  @Post('join')
  @ApiOperation({ summary: 'Join household via invite code' })
  join(@CurrentUser('id') userId: string, @Body() dto: JoinHouseholdDto) {
    return this.householdsService.join(userId, dto);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Get all households I belong to' })
  getMyHouseholds(@CurrentUser('id') userId: string) {
    return this.householdsService.getMyHouseholds(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get household details' })
  findById(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.householdsService.findById(id, userId);
  }

  @Get(':id/financial-summary')
  @ApiOperation({ summary: 'Get household financial summary with per-member breakdown' })
  getFinancialSummary(@Param('id') id: string) {
    return this.householdsService.getHouseholdFinancialSummary(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update household (admin only)' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateHouseholdDto,
  ) {
    return this.householdsService.update(id, userId, dto);
  }

  @Delete(':id/leave')
  @ApiOperation({ summary: 'Leave a household' })
  leave(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.householdsService.leave(id, userId);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove a member (admin only)' })
  removeMember(
    @Param('id') householdId: string,
    @CurrentUser('id') adminId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.householdsService.removeMember(householdId, adminId, memberId);
  }
}
