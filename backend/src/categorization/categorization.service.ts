import { Injectable } from '@nestjs/common';

type Category =
  | 'food'
  | 'transport'
  | 'utilities'
  | 'subscriptions'
  | 'rent'
  | 'school_fees'
  | 'entertainment'
  | 'savings'
  | 'healthcare'
  | 'shopping'
  | 'fuel'
  | 'mobile_data'
  | 'salary'
  | 'transfer'
  | 'bill_payment'
  | 'other';

const CATEGORY_RULES: Array<{ patterns: RegExp[]; category: Category }> = [
  {
    patterns: [/food|restaurant|cafe|pizza|chicken|ugali|matooke|supermarket|grocery|market|eat|lunch|dinner|breakfast|snack/i],
    category: 'food',
  },
  {
    patterns: [/uber|boda|taxi|bus|matatu|fuel|petrol|transport|fare|ride|bolt|safeboda/i],
    category: 'transport',
  },
  {
    patterns: [/nwsc|water|electricity|uedcl|umeme|power|utility|yaka/i],
    category: 'utilities',
  },
  {
    patterns: [/netflix|spotify|youtube premium|dstv|showmax|subscription|canal\+/i],
    category: 'subscriptions',
  },
  {
    patterns: [/rent|rental|house|apartment|landlord/i],
    category: 'rent',
  },
  {
    patterns: [/school|fees|tuition|university|college|education|ucu|mak|mubs/i],
    category: 'school_fees',
  },
  {
    patterns: [/movie|cinema|game|concert|event|ticket|show|sport|gym|recreation/i],
    category: 'entertainment',
  },
  {
    patterns: [/savings|save|invest|fixed|deposit|stanbic|equity bank|dfcu/i],
    category: 'savings',
  },
  {
    patterns: [/hospital|clinic|pharmacy|doctor|medicine|health|medical|dental/i],
    category: 'healthcare',
  },
  {
    patterns: [/shop|mall|store|clothes|fashion|shoes|accessory|woolworths|game/i],
    category: 'shopping',
  },
  {
    patterns: [/fuel|petrol|diesel|total|shell|oilcom/i],
    category: 'fuel',
  },
  {
    patterns: [/airtel|mtn|data|bundle|airtime|internet|wifi/i],
    category: 'mobile_data',
  },
  {
    patterns: [/salary|payroll|wage|income|payment received/i],
    category: 'salary',
  },
  {
    patterns: [/transfer|send money|mobile money|momo|airtel money/i],
    category: 'transfer',
  },
  {
    patterns: [/bill|payment|pay|invoice/i],
    category: 'bill_payment',
  },
];

@Injectable()
export class CategorizationService {
  categorize(description: string, merchant?: string): Category {
    const text = `${description || ''} ${merchant || ''}`.toLowerCase();

    for (const rule of CATEGORY_RULES) {
      for (const pattern of rule.patterns) {
        if (pattern.test(text)) {
          return rule.category;
        }
      }
    }

    return 'other';
  }

  categorizeAll(items: Array<{ description?: string; merchant?: string }>) {
    return items.map((item) => ({
      ...item,
      category: this.categorize(item.description || '', item.merchant),
    }));
  }
}
