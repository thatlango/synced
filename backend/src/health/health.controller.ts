import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { PrismaService } from '../common/prisma/prisma.service';
@ApiTags('health')
@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}
  @Public() @Get('health') health() { return { status: 'ok', service: 'synced-api', time: new Date().toISOString() }; }
  @Public() @Get('ready') async ready() {
    try { await this.prisma.$queryRawUnsafe('select 1'); return { status: 'ready', database: 'ok', time: new Date().toISOString() }; }
    catch { throw new ServiceUnavailableException({ status: 'not_ready', database: 'unavailable' }); }
  }
}
