import { Module } from '@nestjs/common';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { CategorizationModule } from '../categorization/categorization.module';
import { TransactionsModule } from '../transactions/transactions.module';

@Module({
  imports: [CategorizationModule, TransactionsModule],
  controllers: [IngestionController],
  providers: [IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}
