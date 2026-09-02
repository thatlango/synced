import { Module } from '@nestjs/common';
import { BillsController } from './bills.controller';
import { BillsService } from './bills.service';
import { RecurringDetectionService } from './recurring-detection.service';

@Module({
  controllers: [BillsController],
  providers: [BillsService, RecurringDetectionService],
  exports: [BillsService, RecurringDetectionService],
})
export class BillsModule {}
