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

type CategoryRule = {
  patterns: RegExp[];
  category: Category;
};

// Order is intentional. Specific income and bill semantics must win before
// generic MoMo / transfer language such as "received from" or "payment to".
const CATEGORY_RULES: CategoryRule[] = [
  // ── Income semantics ──────────────────────────────────────────────────────
  {
    patterns: [
      /\bsalary\b|\bpayroll\b|\bwage\b|\bpay slip\b/i,
      /\bmonthly pay\b|\bnet pay\b|\bbasic salary\b|\bemployer payment\b/i,
      /\bsalary income received\b/i,
    ],
    category: 'salary',
  },
  {
    // Refunds/reversals are cash inflows but not earned income. Keep them out
    // of salary while still separating them from ordinary spending.
    patterns: [
      /\brefund(?:ed)?\b|\breversal\b|\breversed\b|\bcashback\b|\bchargeback\b/i,
    ],
    category: 'transfer',
  },
  {
    patterns: [
      /\binterest (?:income|credited|earned|received)\b|\bdividend\b/i,
      /\binvestment (?:return|income|proceeds)\b/i,
    ],
    category: 'savings',
  },
  {
    // These are useful income/inflow types in the SMS description even though
    // the current canonical category enum groups them under transfer.
    patterns: [
      /\bbusiness income received\b|\bclient payment\b|\bcustomer payment\b/i,
      /\bsales revenue\b|\bsales proceeds\b|\binvoice payment\b|\bmerchant settlement\b/i,
      /\bfreelance (?:or consulting )?income\b|\bconsulting income\b|\bconsultancy payment\b/i,
      /\bprofessional fee\b|\bgig payment\b/i,
      /\bgift,? grant or allowance received\b|\bgift income\b|\bgrant received\b|\ballowance received\b/i,
      /\bloan proceeds received\b|\bloan disbursement\b|\bloan credited\b/i,
      /\bcash deposit received\b|\bcash[ -]?in\b/i,
    ],
    category: 'transfer',
  },

  // ── Bill types ────────────────────────────────────────────────────────────
  {
    patterns: [
      /\bnwsc\b|\bwater bill\b|\bwater payment\b|\bwater utility\b/i,
      /\buedcl\b|\bumeme\b|\byaka\b|\belectricity\b|\bpower bill\b|\bpower token\b/i,
      /\binternet bill\b|\bfibre\b|\bfiber\b|\bstarlink\b|\bliquid telecom\b|\butande\b|\bwifi bill\b/i,
      /\bgas bill\b|\butility bill\b/i,
    ],
    category: 'utilities',
  },
  {
    patterns: [
      /\bairtime\b|\bdata bundle\b|\binternet bundle\b|\bmobile data\b/i,
      /\bbundle purchase\b|\bdata top.?up\b|\bvoice top.?up\b|\brecharge\b/i,
      /\bmtn.*(?:data|bundle)\b|\bairtel.*(?:data|bundle)\b/i,
    ],
    category: 'mobile_data',
  },
  {
    patterns: [
      /\brent\b|\brental\b|\blandlord\b|\bhousing payment\b|\bapartment payment\b/i,
      /\baccommodation fee\b|\blodging\b/i,
    ],
    category: 'rent',
  },
  {
    patterns: [
      /\bschool fees?\b|\btuition\b|\bterm fees?\b|\beducation fees?\b/i,
      /\buniversity fees?\b|\bcollege fees?\b|\bacademic fees?\b|\bexam fees?\b/i,
      /\bmakerere\b|\bmubs\b|\bucu\b|\bkiu\b|\buganda christian university\b/i,
    ],
    category: 'school_fees',
  },
  {
    patterns: [
      /\bnetflix\b|\bspotify\b|\byoutube premium\b|\bapple.*subscri/i,
      /\bdstv\b|\bshowmax\b|\bcanal\+?\b/i,
      /\bsubscription\b|\brenewal\b|\bmonthly fee\b|\bannual fee\b/i,
      /\bgym membership\b|\bfitness membership\b|\bclub membership\b/i,
    ],
    category: 'subscriptions',
  },
  {
    // The existing schema intentionally has a generic bill_payment category.
    // Preserve the specific bill type in the normalized description while
    // routing loan, insurance and statutory obligations into that category.
    patterns: [
      /\bloan repayment\b|\bloan instalment\b|\bloan installment\b/i,
      /\bcredit repayment\b|\bmicrofinance repayment\b/i,
      /\binsurance premium\b|\bpremium payment\b|\bpolicy premium\b/i,
      /\btax or statutory fee\b|\btax payment\b|\bgovernment fee\b|\blicen[cs]e fee\b/i,
      /\bura\b|\bstatutory fee\b/i,
      /\bbill payment\b|\bpay.*bill\b|\binvoice.*paid\b/i,
    ],
    category: 'bill_payment',
  },

  // ── Everyday spending ─────────────────────────────────────────────────────
  {
    patterns: [
      /\bfuel\b|\bpetrol\b|\bdiesel\b/i,
      /\bshell\b|\btotalenergies\b|\btotal petrol\b|\boilcom\b|\bgapco\b/i,
      /\bpuma energy\b|\bvivo energy\b/i,
    ],
    category: 'fuel',
  },
  {
    patterns: [
      /\bhospital\b|\bclinic\b|\bpharmacy\b|\bdoctor\b|\bmedical\b/i,
      /\bmulago\b|\bnorvik\b|\bmengo hospital\b/i,
      /\bhealth insurance\b|\bdental\b|\boptical\b|\blaboratory\b|\bsurgery\b|\btherapy\b/i,
      /\bmedicine\b|\bprescription\b/i,
    ],
    category: 'healthcare',
  },
  {
    patterns: [
      /\brestaurant\b|\bcafe\b|\bcanteen\b|\bfood court\b|\bfast food\b/i,
      /\bcafe javas?\b|\bjava house\b|\bkfc\b|\bnandos\b|\bdominos\b/i,
      /\bpizza\b|\bburger\b|\blunch\b|\bdinner\b|\bbreakfast\b|\bsnack\b/i,
      /\bsupermarket\b|\bgrocery\b|\bcarrefour\b|\bshoprite\b/i,
      /\bfood or grocery payment\b/i,
    ],
    category: 'food',
  },
  {
    patterns: [
      /\buber\b|\bbolt\b|\blittle cab\b|\bsafeboda\b|\byango\b/i,
      /\bboda\b|\btaxi\b|\bmatatu\b|\bbus fare\b|\btransport fare\b/i,
      /\bflight\b|\bairline\b|\bairport\b|\bcoach\b|\bpost bus\b/i,
      /\btransport payment\b/i,
    ],
    category: 'transport',
  },
  {
    patterns: [
      /\bmovie\b|\bcinema\b|\bconcert\b|\bevent ticket\b/i,
      /\bsport club\b|\bgym\b|\bfitness\b|\bswimming\b|\brecreation\b/i,
      /\bbar\b|\bnightlife\b/i,
    ],
    category: 'entertainment',
  },
  {
    patterns: [
      /\bsaving\b|\bfixed deposit\b|\binvestment\b|\binvest\b/i,
      /\bsacco\b|\bchama\b|\bmerry.?go.?round\b/i,
      /\bnssf\b|\bpension\b|\bunit trust\b|\bmutual fund\b/i,
    ],
    category: 'savings',
  },
  {
    patterns: [
      /\bshopping\b|\bshop\b|\bstore\b|\bmall\b/i,
      /\bclothes\b|\bfashion\b|\bshoes\b|\baccessory\b|\bjewelry\b/i,
      /\bjumia\b|\bkilimall\b|\bamazon\b/i,
      /\belectronics\b|\bphone purchase\b|\blaptop\b|\bcomputer shop\b/i,
    ],
    category: 'shopping',
  },

  // ── Generic money movement fallback ───────────────────────────────────────
  {
    patterns: [
      /\btransfer\b|\bsend money\b|\bmobile money\b|\bmomo\b/i,
      /\bairtel money\b|\bmtn momo\b|\bsent to\b|\breceived from\b/i,
      /\bmoney received by bank or mobile money\b|\bbank credit\b|\bcredit received\b/i,
    ],
    category: 'transfer',
  },
];

@Injectable()
export class CategorizationService {
  categorize(description: string, merchant?: string): Category {
    const text = `${description || ''} ${merchant || ''}`.trim();

    for (const rule of CATEGORY_RULES) {
      if (rule.patterns.some((pattern) => pattern.test(text))) {
        return rule.category;
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

  preview(description: string, merchant?: string): { category: Category; confidence: 'high' | 'low' } {
    const category = this.categorize(description, merchant);
    return {
      category,
      confidence: category !== 'other' ? 'high' : 'low',
    };
  }
}
