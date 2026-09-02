import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { BillsModule } from '../bills/bills.module';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';
@Module({ imports: [AiModule, BillsModule], controllers: [InsightsController], providers: [InsightsService] })
export class InsightsModule {}
