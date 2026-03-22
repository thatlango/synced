import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TransactionProcessor, TRANSACTION_QUEUE } from './transaction.processor';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: TRANSACTION_QUEUE }),
    AlertsModule,
  ],
  providers: [TransactionProcessor],
  exports: [BullModule],
})
export class QueuesModule {}
