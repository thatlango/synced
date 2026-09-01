import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';
@Module({ imports: [AiModule], controllers: [InsightsController], providers: [InsightsService] })
export class InsightsModule {}
