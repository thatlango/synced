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

// ─── Amount parser ─────────────────────────────────────────────────────────
function parseAmount(raw: string): number {
  return parseFloat(raw.replace(/[,\s]/g, ''));
}

// ─── SMS patterns database ────────────────────────────────────────────────
type SmsPattern = {
  regex: RegExp;
  extract: (m: RegExpMatchArray) => ParsedSmsTransaction;
};

const MTN_PATTERNS: SmsPattern[] = [
  // "You have received UGX 50,000 from John Doe."
  {
    regex: /You have received UGX\s*([\d,]+)\s*from\s+(.+?)\.\s*(?:Your new balance is UGX\s*([\d,]+))?/i,
    extract: (m) => ({
      amount: parseAmount(m[1]),
      type: 'credit',
      description: `Received from ${m[2].trim()}`,
      merchant: m[2].trim(),
      source: 'mtn',
    }),
  },
  // "Your payment of UGX 15,000 to Cafe Javas has been completed."
  {
    regex: /Your payment of UGX\s*([\d,]+)\s*to\s+(.+?)\s+has been completed/i,
    extract: (m) => ({
      amount: parseAmount(m[1]),
      type: 'debit',
      description: `Payment to ${m[2].trim()}`,
      merchant: m[2].trim(),
      source: 'mtn',
    }),
  },
  // "You have sent UGX 30,000 to 0777123456. Your new balance is UGX 120,000."
  {
    regex: /You have sent UGX\s*([\d,]+)\s*to\s+([\d\w\s]+?)\.\s*(?:Your new balance is UGX\s*([\d,]+))?/i,
    extract: (m) => ({
      amount: parseAmount(m[1]),
      type: 'debit',
      description: `Sent to ${m[2].trim()}`,
      merchant: m[2].trim(),
      source: 'mtn',
    }),
  },
  // "You have withdrawn UGX 100,000 from agent ..."
  {
    regex: /You have withdrawn UGX\s*([\d,]+)\s*(?:from\s+(.+?))?(?:\.|$)/i,
    extract: (m) => ({
      amount: parseAmount(m[1]),
      type: 'debit',
      description: m[2] ? `Withdrawal from ${m[2].trim()}` : 'Cash withdrawal',
      source: 'mtn',
    }),
  },
  // "You have deposited UGX 200,000 ..."
  {
    regex: /You have deposited UGX\s*([\d,]+)\s*(?:to\s+(.+?))?(?:\.|$)/i,
    extract: (m) => ({
      amount: parseAmount(m[1]),
      type: 'credit',
      description: m[2] ? `Deposit from ${m[2].trim()}` : 'Cash deposit',
      source: 'mtn',
    }),
  },
  // "MTN MoMo: Payment of UGX 45,000 for NWSC-00312 received."
  {
    regex: /MTN MoMo:\s*Payment of UGX\s*([\d,]+)\s*for\s+(.+?)\s+received/i,
    extract: (m) => ({
      amount: parseAmount(m[1]),
      type: 'debit',
      description: `Bill payment: ${m[2].trim()}`,
      merchant: m[2].trim(),
      source: 'mtn',
    }),
  },
  // "TxId:1234567890 UGX 50,000 sent to 0701234567 on 12/03/2024 ..."
  {
    regex: /TxId:\s*(\w+)\s+UGX\s*([\d,]+)\s+sent to\s+(.+?)\s+on/i,
    extract: (m) => ({
      amount: parseAmount(m[2]),
      type: 'debit',
      referenceId: m[1],
      description: `Sent to ${m[3].trim()}`,
      merchant: m[3].trim(),
      source: 'mtn',
    }),
  },
  // "Balance: UGX 850,000. You paid UGX 12,000 to ..."
  {
    regex: /You paid UGX\s*([\d,]+)\s*to\s+(.+?)(?:\.|,|$)/i,
    extract: (m) => ({
      amount: parseAmount(m[1]),
      type: 'debit',
      description: `Paid to ${m[2].trim()}`,
      merchant: m[2].trim(),
      source: 'mtn',
    }),
  },
  // "Airtime purchase of UGX 5,000 for 0771234567 was successful"
  {
    regex: /Airtime purchase of UGX\s*([\d,]+)\s*for\s+([\d\w\s]+?)\s+was successful/i,
    extract: (m) => ({
      amount: parseAmount(m[1]),
      type: 'debit',
      description: `Airtime for ${m[2].trim()}`,
      merchant: 'MTN Airtime',
      source: 'mtn',
    }),
  },
];

const AIRTEL_PATTERNS: SmsPattern[] = [
  // "You have sent UGX 20,000 to John Doe."
  {
    regex: /You have sent UGX\s*([\d,]+)\s*to\s+(.+?)\.\s*(?:Your new balance is UGX\s*([\d,]+))?/i,
    extract: (m) => ({
      amount: parseAmount(m[1]),
      type: 'debit',
      description: `Sent to ${m[2].trim()}`,
      merchant: m[2].trim(),
      source: 'airtel',
    }),
  },
  // "Airtel Money: You have received UGX 80,000 from ..."
  {
    regex: /Airtel Money:\s*You have received UGX\s*([\d,]+)\s*from\s+(.+?)(?:\.|$)/i,
    extract: (m) => ({
      amount: parseAmount(m[1]),
      type: 'credit',
      description: `Received from ${m[2].trim()}`,
      merchant: m[2].trim(),
      source: 'airtel',
    }),
  },
  // "Your Airtel Money payment of UGX 15,000 to Kampala Java House was successful"
  {
    regex: /Airtel Money payment of UGX\s*([\d,]+)\s*to\s+(.+?)\s+was successful/i,
    extract: (m) => ({
      amount: parseAmount(m[1]),
      type: 'debit',
      description: `Payment to ${m[2].trim()}`,
      merchant: m[2].trim(),
      source: 'airtel',
    }),
  },
  // "Airtel: Cash withdrawn UGX 50,000 from agent ..."
  {
    regex: /Cash withdrawn UGX\s*([\d,]+)\s*(?:from\s+(.+?))?(?:\.|$)/i,
    extract: (m) => ({
      amount: parseAmount(m[1]),
      type: 'debit',
      description: m[2] ? `Withdrawal from ${m[2].trim()}` : 'Cash withdrawal',
      source: 'airtel',
    }),
  },
  // "Bundle purchase: UGX 10,000 data bundle activated successfully"
  {
    regex: /UGX\s*([\d,]+)\s*(?:data )?bundle (?:purchase |)(?:activated|purchased|bought) successfully/i,
    extract: (m) => ({
      amount: parseAmount(m[1]),
      type: 'debit',
      description: 'Data bundle purchase',
      merchant: 'Airtel Uganda',
      source: 'airtel',
    }),
  },
];

// Generic Ugandan bank / MoMo patterns
const GENERIC_PATTERNS: SmsPattern[] = [
  // "Stanbic Bank: UGX 500,000 credited to your account ending 1234"
  {
    regex: /(?:Stanbic|DFCU|Equity|Centenary|PostBank|Absa|Standard Chartered)\s+Bank:?\s+UGX\s*([\d,]+)\s+credited/i,
    extract: (m) => ({
      amount: parseAmount(m[1]),
      type: 'credit',
      description: 'Bank credit',
      source: 'sms',
    }),
  },
  // "Stanbic Bank: UGX 200,000 debited from your account"
  {
    regex: /(?:Stanbic|DFCU|Equity|Centenary|PostBank|Absa|Standard Chartered)\s+Bank:?\s+UGX\s*([\d,]+)\s+debited/i,
    extract: (m) => ({
      amount: parseAmount(m[1]),
      type: 'debit',
      description: 'Bank debit',
      source: 'sms',
    }),
  },
  // Generic: "UGX 15,000 paid to/received from ..."
  {
    regex: /UGX\s*([\d,]+)\s+paid to\s+(.+?)(?:\.|$)/i,
    extract: (m) => ({
      amount: parseAmount(m[1]),
      type: 'debit',
      description: `Paid to ${m[2].trim()}`,
      merchant: m[2].trim(),
      source: 'sms',
    }),
  },
  {
    regex: /UGX\s*([\d,]+)\s+received from\s+(.+?)(?:\.|$)/i,
    extract: (m) => ({
      amount: parseAmount(m[1]),
      type: 'credit',
      description: `Received from ${m[2].trim()}`,
      source: 'sms',
    }),
  },
  // "Ug Shs 50,000 has been credited" (some banks use "Ug Shs")
  {
    regex: /Ug(?:\.|andan)?\s+Shs\.?\s*([\d,]+)\s+has been credited/i,
    extract: (m) => ({
      amount: parseAmount(m[1]),
      type: 'credit',
      description: 'Credit received',
      source: 'sms',
    }),
  },
  {
    regex: /Ug(?:\.|andan)?\s+Shs\.?\s*([\d,]+)\s+has been debited/i,
    extract: (m) => ({
      amount: parseAmount(m[1]),
      type: 'debit',
      description: 'Debit processed',
      source: 'sms',
    }),
  },
];

const ALL_PATTERNS = [...MTN_PATTERNS, ...AIRTEL_PATTERNS, ...GENERIC_PATTERNS];

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
    for (const pattern of ALL_PATTERNS) {
      const match = smsBody.match(pattern.regex);
      if (match) {
        try {
          const result = pattern.extract(match);
          if (result.amount > 0) return result;
        } catch {
          // continue to next pattern
        }
      }
    }
    return null;
  }

  // Parse multiple SMS bodies at once; returns results for each
  parseBulkSms(smsBodies: string[]): Array<{ smsBody: string; parsed: ParsedSmsTransaction | null }> {
    return smsBodies.map((smsBody) => ({
      smsBody,
      parsed: this.parseSms(smsBody),
    }));
  }

  async ingestSms(userId: string, walletId: string, smsBody: string) {
    const parsed = this.parseSms(smsBody);
    if (!parsed) {
      this.logger.warn(`Could not parse SMS: ${smsBody.substring(0, 80)}`);
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

  // Ingest multiple SMS messages in one call (mobile batch sync)
  async ingestBulkSms(userId: string, walletId: string, smsBodies: string[]) {
    const results: Array<{ smsBody: string; success: boolean; transaction?: any; reason?: string }> = [];

    for (const smsBody of smsBodies) {
      try {
        const result = await this.ingestSms(userId, walletId, smsBody);
        results.push({
          smsBody: smsBody.substring(0, 60),
          success: result.parsed as boolean,
          transaction: (result as any).transaction,
          reason: !(result.parsed) ? result.message : undefined,
        });
      } catch (e) {
        results.push({ smsBody: smsBody.substring(0, 60), success: false, reason: e.message });
      }
    }

    const ingested = results.filter((r) => r.success).length;
    this.logger.log(`Bulk SMS ingestion: ${ingested}/${smsBodies.length} parsed for user ${userId}`);
    return { total: smsBodies.length, ingested, skipped: smsBodies.length - ingested, results };
  }

  // ─── Mock MoMo API ────────────────────────────────────────────

  async fetchMtnTransactions(userId: string, walletId: string) {
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
        const category = this.categorization.categorize(tx.description, (tx as any).merchant);
        const t = await this.transactions.create(userId, { walletId, ...tx, category });
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
