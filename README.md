# ⚡ Synced — Collaborative Personal Finance System

> **A shared financial intelligence system by TukuTuku Innovation Labs**

Synced is a full-stack fintech application that enables households to sync their finances, track individual vs shared spending, forecast financial health, pay bills, and manage subscriptions — all from a single unified platform.

---

## ✅ Current production release

**Synced 1.1.0** is the current hardened Android release. Production identity is Tuku Core SSO with PKCE; Synced does not receive the user's Tuku password. The production API is `https://api.synced.tukutuku.org/api/v1/`. See [`docs/RELEASE_1_1_0.md`](docs/RELEASE_1_1_0.md) for the verified release contract, tests, signed artifact hashes and deployment notes.

## 🏗️ Architecture

```
synced/
├── backend/                  # NestJS API + Prisma
└── mobile/                   # Native Android app
    ├── app/src/main/java/com/tukutuku/synced/
    │   ├── data/             # Retrofit, Room, DataStore, repositories
    │   ├── di/               # Hilt modules
    │   ├── sms/              # On-device SMS parsing
    │   ├── ui/               # Jetpack Compose screens/components/theme
    │   └── worker/           # WorkManager background sync
    ├── app/src/main/res/     # Android resources
    ├── app/build.gradle.kts
    ├── gradle/libs.versions.toml
    ├── settings.gradle.kts
    └── gradlew
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | NestJS (TypeScript) |
| **Database** | PostgreSQL + Prisma ORM |
| **Cache/Queues** | Redis + BullMQ |
| **Auth** | Tuku Core identity + Synced product session |
| **Mobile** | Native Android: Kotlin, Jetpack Compose, Hilt, Retrofit, Room, WorkManager |
| **Mobile data/state** | ViewModels, StateFlow, Room, DataStore |
| **API Docs** | Swagger/OpenAPI |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ (backend only)
- PostgreSQL 16+
- Redis 7+
- Android Studio with JDK 17 and Android SDK 36+ (mobile)

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

### 4. Run the Android App

The Android project is committed and built directly with Gradle. No Expo, EAS, Metro or Node runtime is required for the app.

```bash
cd mobile

# Build a debug APK
./gradlew assembleDebug

# Install on a connected Android device/emulator
./gradlew installDebug
```

Or open the `mobile/` directory directly in Android Studio and press **Run**.

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
POST /auth/core/exchange — Exchange a Tuku Core PKCE authorization code for a Synced session
GET  /auth/me            — Get the current Synced financial profile
```

Legacy phone-OTP endpoints remain backend compatibility surfaces; the native v1.1.0 Android sign-in path uses Tuku Core product SSO.

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
- [x] Tuku Core SSO with PKCE and canonical `coreUserId` mapping
- [x] Personal + household wallets
- [x] Immutable double-entry ledger
- [x] Auto-categorization (15 categories)
- [x] On-device financial SMS parsing + structured candidate ingestion
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
- [x] Native Android app (Kotlin + Jetpack Compose)
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

Synced Android is a fully native Kotlin application using the same operating model as TraffIQ:

- **Jetpack Compose** for UI
- **Compose Navigation** for in-app navigation and deep links
- **Hilt** for dependency injection
- **Retrofit + OkHttp + Kotlin serialization** for API access
- **Room** for local transaction cache
- **DataStore** for encrypted/session state coordination
- **WorkManager** for background financial SMS sync
- **Native Android SMS APIs** for on-device financial-message parsing
- **Gradle + Android Studio** as the build/release source of truth

There is no Expo CLI, Expo Router, EAS, Metro bundler, React Native runtime, npm mobile dependency tree or generated `android/` project.

### Key Screens

| Screen | Native source |
|--------|---------------|
| Authentication | `ui/AuthScreen.kt` |
| Home | `ui/HomeScreen.kt` |
| Transactions | `ui/TransactionsScreen.kt` |
| Plan | `ui/PlanScreen.kt` |
| Baskets | `ui/BasketsScreen.kt` |
| Household | `ui/HouseholdScreen.kt` |
| Invite / Join | `ui/JoinInviteScreen.kt` |
| SMS Sync | `ui/SmsSyncScreen.kt` |
| Ask Synced | `ui/AskSyncedScreen.kt` |

---

## 🏢 About TukuTuku Innovation Labs

Synced is a product by **TukuTuku Innovation Labs** — building accessible financial tools for African households.

> *Synced is not just a finance tracker. It is a shared financial intelligence system.*

---

## 📄 License

MIT License — © 2026 TukuTuku Innovation Labs
