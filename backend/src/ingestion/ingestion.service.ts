import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CategorizationService } from '../categorization/categorization.service';
import { TransactionsService } from '../transactions/transactions.service';

interface ParsedSmsTransaction {
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  merchant?: string;
  referenceId?: string;
  source: 'mtn' | 'airtel' | 'sms';
}

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private prisma: PrismaService,
    private categorization: CategorizationService,
    private transactions: TransactionsService,
  ) {}

  // ─── SMS Parsing ──────────────────────────────────────────────

  parseSms(smsBody: string): ParsedSmsTransaction | null {
    // MTN MoMo pattern: "You have received UGX 50,000 from ..."
    const mtnReceived = smsBody.match(
      /You have received UGX\s*([\d,]+)\s*from\s+(.+?)\./i,
    );
    if (mtnReceived) {
      return {
        amount: parseFloat(mtnReceived[1].replace(/,/g, '')),
        type: 'credit',
        description: `Received from ${mtnReceived[2]}`,
        source: 'mtn',
      };
    }

    // MTN MoMo payment: "Your payment of UGX 15,000 to ..."
    const mtnPayment = smsBody.match(
      /Your payment of UGX\s*([\d,]+)\s*to\s+(.+?)\s+has been completed/i,
    );
    if (mtnPayment) {
      return {
        amount: parseFloat(mtnPayment[1].replace(/,/g, '')),
        type: 'debit',
        description: `Payment to ${mtnPayment[2]}`,
        merchant: mtnPayment[2],
        source: 'mtn',
      };
    }

    // Airtel Money: "You have sent UGX 20,000 to ..."
    const airtelSent = smsBody.match(
      /You have sent UGX\s*([\d,]+)\s*to\s+(.+?)\./i,
    );
    if (airtelSent) {
      return {
        amount: parseFloat(airtelSent[1].replace(/,/g, '')),
        type: 'debit',
        description: `Sent to ${airtelSent[2]}`,
        merchant: airtelSent[2],
        source: 'airtel',
      };
    }

    return null;
  }

  async ingestSms(userId: string, walletId: string, smsBody: string) {
    const parsed = this.parseSms(smsBody);
    if (!parsed) {
      this.logger.warn(`Could not parse SMS: ${smsBody.substring(0, 50)}`);
      return { parsed: false, message: 'Could not parse SMS transaction' };
    }

    const category = this.categorization.categorize(parsed.description, parsed.merchant);

    const transaction = await this.transactions.create(userId, {
      walletId,
      type: parsed.type,
      amount: parsed.amount,
      category,
      description: parsed.description,
      merchant: parsed.merchant,
      source: parsed.source,
    });

    return { parsed: true, transaction };
  }

  // ─── Mock MoMo API ────────────────────────────────────────────

  async fetchMtnTransactions(userId: string, walletId: string) {
    // Simulated MTN MoMo transaction fetch
    const mockTransactions = [
      {
        amount: 50000,
        type: 'credit' as const,
        description: 'Received from Employer',
        source: 'mtn' as const,
      },
      {
        amount: 12000,
        type: 'debit' as const,
        description: 'Payment to Cafe Javas',
        merchant: 'Cafe Javas',
        source: 'mtn' as const,
      },
    ];

    const results = [];
    for (const tx of mockTransactions) {
      try {
        const t = await this.transactions.create(userId, { walletId, ...tx });
        results.push(t);
      } catch (e) {
        this.logger.warn(`Failed to ingest MTN tx: ${e.message}`);
      }
    }

    return { ingested: results.length, transactions: results };
  }

  async fetchAirtelTransactions(userId: string, walletId: string) {
    const mockTransactions = [
      {
        amount: 8000,
        type: 'debit' as const,
        description: 'Airtel bundle purchase',
        merchant: 'Airtel Uganda',
        source: 'airtel' as const,
        category: 'mobile_data',
      },
    ];

    const results = [];
    for (const tx of mockTransactions) {
      try {
        const t = await this.transactions.create(userId, { walletId, ...tx });
        results.push(t);
      } catch (e) {
        this.logger.warn(`Failed to ingest Airtel tx: ${e.message}`);
      }
    }

    return { ingested: results.length, transactions: results };
  }
}
