# ⚡ Synced — Collaborative Personal Finance System

> **A shared financial intelligence system by TukuTuku Innovation Labs**

Synced is a full-stack fintech application that enables households to sync their finances, track individual vs shared spending, forecast financial health, pay bills, and manage subscriptions — all from a single unified platform.

---

## 🏗️ Architecture

```
synced/
├── backend/          # NestJS API (REST)
│   ├── src/
│   │   ├── auth/           # Phone OTP auth + JWT
│   │   ├── users/          # User management
│   │   ├── households/     # Household + invite system
│   │   ├── wallets/        # Personal + household wallets
│   │   ├── transactions/   # Transaction engine
│   │   ├── ledger/         # Immutable ledger entries
│   │   ├── ingestion/      # SMS/MoMo transaction ingestion
│   │   ├── categorization/ # Auto-categorization engine
│   │   ├── subscriptions/  # Subscription management
│   │   ├── bills/          # Bill tracking
│   │   ├── payments/       # Bill payments (NWSC, UEDCL, DSTV, etc.)
│   │   ├── budgets/        # Budget planner
│   │   ├── forecasts/      # 3-month financial forecasting
│   │   ├── analytics/      # Spending insights + household breakdown
│   │   ├── alerts/         # Smart alerts (low balance, bills due, etc.)
│   │   ├── queues/         # BullMQ async processing
│   │   ├── reconciliation/ # Daily ledger reconciliation
│   │   └── search/         # Global search
│   └── prisma/
│       ├── schema.prisma   # Full database schema
│       └── seed.ts         # Demo data seeder
└── mobile/           # React Native (Expo) app
    ├── app/
    │   ├── auth/           # Welcome, Signup, Login screens
    │   ├── tabs/           # Home, Transactions, Analytics, Household, Settings
    │   ├── add-expense.tsx # Add expense/income modal
    │   ├── pay-bill.tsx    # Bill payment modal
    │   └── fund-wallet.tsx # Wallet funding modal
    ├── store/              # Zustand state management
    ├── services/           # API client (Axios)
    ├── types/              # TypeScript type definitions
    └── constants/          # App colors, categories, providers
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | NestJS (TypeScript) |
| **Database** | PostgreSQL + Prisma ORM |
| **Cache/Queues** | Redis + BullMQ |
| **Auth** | Phone OTP + JWT |
| **Mobile** | React Native (Expo) |
| **State** | Zustand + React Query |
| **API Docs** | Swagger/OpenAPI |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### 1. Clone & Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL
```

### 2. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed demo data
npx ts-node prisma/seed.ts
```

### 3. Start Backend

```bash
npm run start:dev
# API: http://localhost:3000/api/v1
# Docs: http://localhost:3000/api/docs
```

### 4. Start Mobile App

```bash
cd mobile
npm install
# Set API URL
echo 'EXPO_PUBLIC_API_URL=http://localhost:3000/api/v1' > .env
npx expo start
```

---

## 🐳 Docker Compose

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on port 5432
- Redis on port 6379
- Backend API on port 3000

---

## ▶️ Replit Deployment

```bash
bash start.sh
```

The script:
1. Installs backend dependencies
2. Pushes Prisma schema to DB
3. Seeds demo data
4. Starts the API in dev mode

---

## 🧪 Demo Credentials

After seeding, use these to test:

| User | Phone | OTP | Role |
|------|-------|-----|------|
| John Mukasa | `+256700000001` | `123456` | Household Admin |
| Sarah Namukasa | `+256700000002` | `123456` | Household Member |
| David Ochieng | `+256700000003` | `123456` | Household Member |

**Household:** `Nakawa Family Home` | **Invite Code:** `NAKAWA2024`

---

## 🔐 Core Financial Model

### Two Wallet Types
```
Personal Wallet  → Individual transactions only
Household Wallet → All shared household transactions
```

### Ledger System (Critical)
Every transaction creates an immutable `LedgerEntry` with:
- `wallet_id` — which wallet was affected
- `user_id` — who initiated the transaction
- `balance_before` / `balance_after` — exact balance states
- `visibility` — `personal` | `household` | `both`

### Household Attribution
The household dashboard shows:
```
Total spent: UGX 1,585,000
├── John Mukasa   → UGX 795,000 (50%)
├── Sarah Namukasa → UGX 500,000 (32%)
└── David Ochieng → UGX 290,000 (18%)
```

---

## 📡 API Reference

Base URL: `http://localhost:3000/api/v1`

### Authentication
```
POST /auth/otp/send     — Send OTP
POST /auth/signup       — Register with OTP
POST /auth/login        — Login with OTP
GET  /auth/me           — Get current user
```

### Wallets
```
GET  /wallets/summary           — Combined balance summary
POST /wallets/:id/fund          — Fund a wallet
GET  /wallets/:id/ledger        — Wallet ledger history
```

### Transactions
```
POST /transactions              — Create transaction
GET  /transactions              — List (filter by scope/category)
GET  /transactions/summary      — Spending summary by period
```

### Households
```
POST /households                — Create household
POST /households/join           — Join via invite code
GET  /households/mine           — My households
GET  /households/:id/financial-summary — Per-member breakdown
```

### Payments
```
POST /payments/pay-bill         — Pay a bill (NWSC, UEDCL, DSTV, etc.)
POST /payments/direct           — Direct payment to provider
GET  /payments/history          — Payment history
```

### Forecasts
```
GET /forecasts/personal         — 3-month personal projection
GET /forecasts/household/:id    — 3-month household projection
```

### Analytics
```
GET /analytics/personal         — Spending insights + top merchants
GET /analytics/personal/trends  — 6-month spending trend
GET /analytics/household/:id    — Household breakdown by member
```

Full interactive docs at: `http://localhost:3000/api/docs`

---

## 🧩 Key Features

### ✅ Implemented
- [x] Phone OTP authentication (mock)
- [x] Personal + household wallets
- [x] Immutable double-entry ledger
- [x] Auto-categorization (15 categories)
- [x] SMS & MoMo transaction ingestion (mock)
- [x] Household creation, join via invite code
- [x] Per-member household spending attribution
- [x] Subscription tracking + renewal detection
- [x] Bill management (NWSC, UEDCL, DSTV, School, Rent)
- [x] Direct bill payments
- [x] Budget planner with real-time usage
- [x] 3-month financial forecasting
- [x] Personal + household analytics
- [x] Smart alerts (low balance, budget exceeded, bills due)
- [x] BullMQ async queue processing
- [x] Daily ledger reconciliation
- [x] Global search
- [x] Demo seed data
- [x] Mobile app (React Native/Expo)
  - Welcome/Auth screens
  - Dashboard with balances + quick actions
  - Transaction list with filters
  - Add expense/income modal
  - Pay bills screen
  - Fund wallet screen
  - Household view with member breakdown
  - Analytics + forecast screen
  - Settings screen

---

## 🌍 Environment Variables

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/synced_db
JWT_SECRET=your-secret-key
REDIS_HOST=localhost
REDIS_PORT=6379
OTP_MOCK=true          # Set false in production for real SMS
MTN_API_KEY=...        # MTN MoMo API key
AIRTEL_API_KEY=...     # Airtel Money API key
```

---

## 📱 Mobile App

The mobile app uses:
- **Expo Router** for file-based navigation
- **Zustand** for client state (auth, wallet, household)
- **React Query** for server state + caching
- **Axios** with JWT interceptors

### Key Screens
| Screen | Path |
|--------|------|
| Welcome | `app/auth/welcome.tsx` |
| Sign Up | `app/auth/signup.tsx` |
| Login | `app/auth/login.tsx` |
| Dashboard | `app/tabs/index.tsx` |
| Transactions | `app/tabs/transactions.tsx` |
| Analytics | `app/tabs/analytics.tsx` |
| Household | `app/tabs/household.tsx` |
| Settings | `app/tabs/settings.tsx` |
| Add Expense | `app/add-expense.tsx` |
| Pay Bill | `app/pay-bill.tsx` |
| Fund Wallet | `app/fund-wallet.tsx` |

---

## 🏢 About TukuTuku Innovation Labs

Synced is a product by **TukuTuku Innovation Labs** — building accessible financial tools for African households.

> *Synced is not just a finance tracker. It is a shared financial intelligence system.*

---

## 📄 License

MIT License — © 2026 TukuTuku Innovation Labs
