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

// Order matters — more specific rules first
const CATEGORY_RULES: Array<{ patterns: RegExp[]; category: Category }> = [
  // ── Salary / Income ───────────────────────────────────────────────────────
  {
    patterns: [
      /\bsalary\b|\bpayroll\b|\bwage\b|\bpay slip\b/i,
      /\bincome\b.*\breceived\b|\bemployer\b.*\bpaid\b/i,
      /\bmonthly pay\b|\bnet pay\b|\bbasic salary\b/i,
    ],
    category: 'salary',
  },

  // ── School Fees ───────────────────────────────────────────────────────────
  {
    patterns: [
      /\bschool fees?\b|\btuition\b|\bterm fees?\b/i,
      /\buniversity\b|\bcollege\b|\beducation fees?\b/i,
      /\bmak\b|\bubiquitous\b|\bmubs\b|\bucu\b|\bnkumba\b|\bkampala international\b/i,
      /\bmakerere\b|\bkiu\b|\buganda christian university\b/i,
      /\blearning.*fees?\b|\bacademic.*fees?\b|\bexam fees?\b/i,
    ],
    category: 'school_fees',
  },

  // ── Utilities ─────────────────────────────────────────────────────────────
  {
    patterns: [
      /\bnwsc\b|\bwater.*bill\b|\bwater.*payment\b/i,
      /\buedcl\b|\bumeme\b|\byaka\b|\belectricity\b|\bpower.*bill\b/i,
      /\bgas.*bill\b|\butility\b|\bwayleave\b/i,
      /\binternet.*bill\b|\bfibre\b|\bstarlink\b|\bliquid telecom\b|\butande\b/i,
    ],
    category: 'utilities',
  },

  // ── Fuel ─────────────────────────────────────────────────────────────────
  {
    patterns: [
      /\bfuel\b|\bpetrol\b|\bdiesel\b/i,
      /\btotal petrol\b|\bshell\b|\boilcom\b|\bgapco\b|\bnationaloc\b/i,
      /\bpuma energy\b|\bbp\b.*\buganda\b|\bvivo energy\b/i,
    ],
    category: 'fuel',
  },

  // ── Mobile Data / Airtime ─────────────────────────────────────────────────
  {
    patterns: [
      /\bairtime\b|\bdata bundle\b|\bbundle.*purchase\b|\binternet bundle\b/i,
      /\bmtn.*data\b|\bairtel.*data\b|\bmtn.*bundle\b|\bairtel.*bundle\b/i,
      /\bteleflex\b|\bairtel money.*bundle\b/i,
      /\bdata top.?up\b|\bmobile data\b/i,
    ],
    category: 'mobile_data',
  },

  // ── Subscriptions ─────────────────────────────────────────────────────────
  {
    patterns: [
      /\bnetflix\b|\bspotify\b|\byoutube premium\b|\bapple.*subscri/i,
      /\bdstv\b|\bshowmax\b|\bcanal\+?\b|\bstarmax\b|\baztec\b/i,
      /\bgym.*membership\b|\bfitness.*membership\b|\bclub.*membership\b/i,
      /\bsubscription\b|\bmonthly.*fee\b|\bannual.*fee\b/i,
    ],
    category: 'subscriptions',
  },

  // ── Rent ─────────────────────────────────────────────────────────────────
  {
    patterns: [
      /\brent\b|\brental\b|\blandlord\b|\bhouse.*payment\b|\bapartment\b/i,
      /\bhousing\b|\baccommodation.*fee\b|\blodging\b/i,
    ],
    category: 'rent',
  },

  // ── Healthcare ────────────────────────────────────────────────────────────
  {
    patterns: [
      /\bhospital\b|\bclinic\b|\bpharmacy\b|\bdoctor\b|\bmedical\b/i,
      /\bmulago\b|\bcase.*clinic\b|\bnorvik\b|\bmengo hospital\b|\bisc\b/i,
      /\bhealth.*insurance\b|\bnsf\b.*health|\bnhis\b/i,
      /\bdental\b|\boptical\b|\blaboratory\b|\bsurgery\b|\btherapy\b/i,
      /\bmedicine\b|\bdrugs\b|\bprescription\b/i,
    ],
    category: 'healthcare',
  },

  // ── Food & Dining ─────────────────────────────────────────────────────────
  {
    patterns: [
      /\brestaurant\b|\bcafe\b|\bcanteen\b|\bfood court\b|\bfast food\b/i,
      /\bcafe java\b|\bjava house\b|\bchicken tonight\b|\bfork\b.*\bknife\b/i,
      /\bnandos\b|\bkfc\b|\bmr biggs\b|\bsubway\b|\bsteers\b|\bdominos\b/i,
      /\bpizza\b|\bburger\b|\bwings\b|\bfries\b|\bchips\b/i,
      /\bsupermarket\b|\bmarket\b|\bgrocery\b|\bgreen.*grocery\b/i,
      /\bnakumatt\b|\bcarrefour\b|\bshoprite\b|\bgame stores\b|\bnakifuma\b/i,
      /\bmatooke\b|\bugali\b|\bposho\b|\bkatogo\b|\brollex\b/i,
      /\beat\b.*\bpaid\b|\blunch\b|\bdinner\b|\bbreakfast\b|\bsnack\b/i,
    ],
    category: 'food',
  },

  // ── Transport ─────────────────────────────────────────────────────────────
  {
    patterns: [
      /\buber\b|\bbolt\b|\blittle cab\b|\bsafeboda\b|\byango\b/i,
      /\bboda\b|\btaxi\b|\bmatatu\b|\bbus fare\b|\bstage\b/i,
      /\bflight\b|\bairline\b|\bticket\b.*\bairport\b|\bentebbe express\b/i,
      /\btransport\b.*\bfee\b|\bfare\b|\bride\b.*\bpaid\b|\btrip\b.*\bpaid\b/i,
      /\bpassenger.*transport\b|\bcoach\b|\bgaagaa\b|\bpost bus\b/i,
    ],
    category: 'transport',
  },

  // ── Entertainment ─────────────────────────────────────────────────────────
  {
    patterns: [
      /\bmovie\b|\bcinema\b|\bfilm\b|\bgarden city.*cinema\b/i,
      /\bconcert\b|\bevent ticket\b|\bticket.*show\b/i,
      /\bgame.*fee\b|\bsport.*club\b|\bgym\b|\bfitness\b|\bswimming\b/i,
      /\brecreation\b|\bamusement\b|\bpark.*entry\b|\bzoo\b/i,
      /\bbar\b|\bclub\b|\bnightlife\b|\bdrinks\b.*\bpaid\b/i,
    ],
    category: 'entertainment',
  },

  // ── Savings / Investment ──────────────────────────────────────────────────
  {
    patterns: [
      /\bsaving\b|\bsave\b|\bfixed deposit\b|\binvestment\b|\binvest\b/i,
      /\bsacco\b|\bchama\b|\bmerry.?go.?round\b/i,
      /\bnssf\b|\bpension\b|\bunit trust\b|\bmutual fund\b|\bstockbroker\b/i,
    ],
    category: 'savings',
  },

  // ── Shopping ─────────────────────────────────────────────────────────────
  {
    patterns: [
      /\bshop\b|\bstore\b|\bmall\b|\bmarket.*payment\b/i,
      /\bclothes\b|\bfashion\b|\bshoes\b|\baccessory\b|\bjewelry\b/i,
      /\bwoolworths\b|\bgame store\b|\bkikomera\b|\bequatorial mall\b/i,
      /\bonline shop\b|\bjumia\b|\bkilimall\b|\bamazon\b/i,
      /\belectronics\b|\bphone.*purchase\b|\blaptop\b|\bcomputer.*shop\b/i,
    ],
    category: 'shopping',
  },

  // ── Transfer (MoMo generic) ──────────────────────────────────────────────
  {
    patterns: [
      /\btransfer\b|\bsend money\b|\bmobile money\b|\bmomo\b/i,
      /\bairtel money\b|\bmtn momo\b|\bsent to\b|\breceived from\b/i,
    ],
    category: 'transfer',
  },

  // ── Bill Payment ─────────────────────────────────────────────────────────
  {
    patterns: [
      /\bbill payment\b|\bpay.*bill\b|\binvoice.*paid\b/i,
    ],
    category: 'bill_payment',
  },
];

@Injectable()
export class CategorizationService {
  categorize(description: string, merchant?: string): Category {
    const text = `${description || ''} ${merchant || ''}`;

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

  // Used for previewing what category an SMS description will map to
  preview(description: string, merchant?: string): { category: Category; confidence: 'high' | 'low' } {
    const cat = this.categorize(description, merchant);
    return {
      category: cat,
      confidence: cat !== 'other' ? 'high' : 'low',
    };
  }
}
