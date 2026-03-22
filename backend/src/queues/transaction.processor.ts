import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { AlertsService } from '../alerts/alerts.service';

export const TRANSACTION_QUEUE = 'transactions';

@Processor(TRANSACTION_QUEUE)
export class TransactionProcessor {
  private readonly logger = new Logger(TransactionProcessor.name);

  constructor(private alertsService: AlertsService) {}

  @Process('check-alerts')
  async handleCheckAlerts(job: Job<{ userId: string }>) {
    this.logger.log(`Processing alert check for user ${job.data.userId}`);
    await this.alertsService.checkAndGenerateAlerts(job.data.userId);
    this.logger.log(`Alert check completed for user ${job.data.userId}`);
  }

  @Process('process-transaction')
  async handleTransaction(job: Job<{ userId: string; transactionId: string }>) {
    this.logger.log(`Processing transaction ${job.data.transactionId}`);
    // Post-processing logic: check budgets, update forecasts, etc.
    await this.alertsService.checkAndGenerateAlerts(job.data.userId);
  }
}
