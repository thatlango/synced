-- CreateSchema generated from canonical Prisma schema; production fresh install baseline.
-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('ios', 'android', 'web');

-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('personal', 'household');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('credit', 'debit');

-- CreateEnum
CREATE TYPE "TransactionSource" AS ENUM ('mtn', 'airtel', 'sms', 'email', 'manual', 'system');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('personal', 'household', 'both');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('food', 'transport', 'utilities', 'subscriptions', 'rent', 'school_fees', 'entertainment', 'savings', 'healthcare', 'shopping', 'fuel', 'mobile_data', 'salary', 'transfer', 'bill_payment', 'other');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'annually');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'paused', 'cancelled');

-- CreateEnum
CREATE TYPE "BudgetPeriod" AS ENUM ('daily', 'weekly', 'monthly', 'quarterly', 'annually');

-- CreateEnum
CREATE TYPE "OwnerType" AS ENUM ('user', 'household');

-- CreateEnum
CREATE TYPE "HouseholdRole" AS ENUM ('admin', 'member');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('low_balance', 'upcoming_bill', 'overspending', 'unusual_spending', 'budget_exceeded', 'subscription_due');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('unread', 'read', 'dismissed');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('signup', 'login', 'reset');

-- CreateEnum
CREATE TYPE "InviteTargetType" AS ENUM ('household', 'basket');

-- CreateEnum
CREATE TYPE "InviteRole" AS ENUM ('member', 'contributor', 'viewer');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('active', 'exhausted', 'revoked', 'expired');

-- CreateEnum
CREATE TYPE "BasketRole" AS ENUM ('owner', 'contributor', 'viewer');

-- CreateEnum
CREATE TYPE "BasketStatus" AS ENUM ('active', 'completed', 'paused', 'archived');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('draft', 'active', 'closed');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "phone" TEXT,
    "coreUserId" TEXT,
    "email" TEXT,
    "name" TEXT,
    "avatar" TEXT,
    "platform" "Platform" NOT NULL DEFAULT 'android',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLogin" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otps" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL DEFAULT 'login',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "households" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "inviteCode" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "avatar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "households_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "household_members" (
    "id" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "HouseholdRole" NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "household_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "type" "WalletType" NOT NULL,
    "balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'UGX',
    "userId" TEXT,
    "householdId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "category" "Category" NOT NULL DEFAULT 'other',
    "description" TEXT,
    "merchant" TEXT,
    "source" "TransactionSource" NOT NULL DEFAULT 'manual',
    "visibility" "Visibility" NOT NULL DEFAULT 'personal',
    "referenceId" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionId" TEXT,
    "type" "TransactionType" NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "balanceBefore" DECIMAL(18,2) NOT NULL,
    "balanceAfter" DECIMAL(18,2) NOT NULL,
    "category" "Category" NOT NULL DEFAULT 'other',
    "source" "TransactionSource" NOT NULL DEFAULT 'manual',
    "visibility" "Visibility" NOT NULL DEFAULT 'personal',
    "referenceId" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "ownerType" "OwnerType" NOT NULL,
    "userId" TEXT,
    "householdId" TEXT,
    "name" TEXT NOT NULL,
    "category" "Category" NOT NULL DEFAULT 'subscriptions',
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UGX',
    "billingCycle" "BillingCycle" NOT NULL DEFAULT 'monthly',
    "nextDueDate" TIMESTAMP(3) NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "logo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bills" (
    "id" TEXT NOT NULL,
    "ownerType" "OwnerType" NOT NULL,
    "userId" TEXT,
    "householdId" TEXT,
    "name" TEXT NOT NULL,
    "category" "Category" NOT NULL DEFAULT 'utilities',
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UGX',
    "dueDate" TIMESTAMP(3) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "paidAt" TIMESTAMP(3),
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "billingCycle" "BillingCycle",
    "provider" TEXT,
    "accountRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "walletId" TEXT,
    "billId" TEXT,
    "amount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UGX',
    "provider" TEXT NOT NULL,
    "accountRef" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "referenceId" TEXT,
    "failReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "ownerType" "OwnerType" NOT NULL,
    "userId" TEXT,
    "householdId" TEXT,
    "category" "Category" NOT NULL,
    "limitAmount" DECIMAL(18,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UGX',
    "period" "BudgetPeriod" NOT NULL DEFAULT 'monthly',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "householdId" TEXT,
    "label" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UGX',
    "expectedIncome" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_allocations" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" "Category",
    "plannedAmount" DECIMAL(18,2) NOT NULL,
    "basketId" TEXT,
    "billId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plan_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "baskets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'UGX',
    "targetAmount" DECIMAL(18,2),
    "targetDate" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "householdId" TEXT,
    "status" "BasketStatus" NOT NULL DEFAULT 'active',
    "colorKey" TEXT DEFAULT 'violet',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "baskets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "basket_members" (
    "id" TEXT NOT NULL,
    "basketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "BasketRole" NOT NULL DEFAULT 'contributor',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "basket_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "basket_contributions" (
    "id" TEXT NOT NULL,
    "basketId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "transactionId" TEXT,
    "note" TEXT,
    "contributedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "basket_contributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invites" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "targetType" "InviteTargetType" NOT NULL,
    "role" "InviteRole" NOT NULL DEFAULT 'member',
    "householdId" TEXT,
    "basketId" TEXT,
    "createdBy" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'active',
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invite_redemptions" (
    "id" TEXT NOT NULL,
    "inviteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "redeemedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_redemptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "status" "AlertStatus" NOT NULL DEFAULT 'unread',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reconciliation_logs" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openingBalance" DECIMAL(18,2) NOT NULL,
    "closingBalance" DECIMAL(18,2) NOT NULL,
    "totalCredits" DECIMAL(18,2) NOT NULL,
    "totalDebits" DECIMAL(18,2) NOT NULL,
    "discrepancy" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reconciliation_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_coreUserId_key" ON "users"("coreUserId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "households_inviteCode_key" ON "households"("inviteCode");

-- CreateIndex
CREATE UNIQUE INDEX "household_members_householdId_userId_key" ON "household_members"("householdId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_userId_key" ON "wallets"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_householdId_key" ON "wallets"("householdId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_referenceId_key" ON "transactions"("referenceId");

-- CreateIndex
CREATE INDEX "transactions_walletId_createdAt_idx" ON "transactions"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "transactions_userId_createdAt_idx" ON "transactions"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "transactions_category_idx" ON "transactions"("category");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_entries_transactionId_key" ON "ledger_entries"("transactionId");

-- CreateIndex
CREATE INDEX "ledger_entries_walletId_createdAt_idx" ON "ledger_entries"("walletId", "createdAt");

-- CreateIndex
CREATE INDEX "ledger_entries_userId_createdAt_idx" ON "ledger_entries"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "bills_dueDate_idx" ON "bills"("dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "payments_referenceId_key" ON "payments"("referenceId");

-- CreateIndex
CREATE UNIQUE INDEX "budgets_ownerType_userId_householdId_category_period_key" ON "budgets"("ownerType", "userId", "householdId", "category", "period");

-- CreateIndex
CREATE INDEX "plans_userId_startDate_endDate_idx" ON "plans"("userId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "plans_householdId_startDate_endDate_idx" ON "plans"("householdId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "plan_allocations_planId_idx" ON "plan_allocations"("planId");

-- CreateIndex
CREATE INDEX "baskets_createdBy_status_idx" ON "baskets"("createdBy", "status");

-- CreateIndex
CREATE INDEX "baskets_householdId_status_idx" ON "baskets"("householdId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "basket_members_basketId_userId_key" ON "basket_members"("basketId", "userId");

-- CreateIndex
CREATE INDEX "basket_contributions_basketId_contributedAt_idx" ON "basket_contributions"("basketId", "contributedAt");

-- CreateIndex
CREATE UNIQUE INDEX "invites_code_key" ON "invites"("code");

-- CreateIndex
CREATE INDEX "invites_code_status_idx" ON "invites"("code", "status");

-- CreateIndex
CREATE UNIQUE INDEX "invite_redemptions_inviteId_userId_key" ON "invite_redemptions"("inviteId", "userId");

-- CreateIndex
CREATE INDEX "alerts_userId_status_idx" ON "alerts"("userId", "status");

-- AddForeignKey
ALTER TABLE "otps" ADD CONSTRAINT "otps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "households" ADD CONSTRAINT "households_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "household_members" ADD CONSTRAINT "household_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bills" ADD CONSTRAINT "bills_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_billId_fkey" FOREIGN KEY ("billId") REFERENCES "bills"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_allocations" ADD CONSTRAINT "plan_allocations_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_allocations" ADD CONSTRAINT "plan_allocations_basketId_fkey" FOREIGN KEY ("basketId") REFERENCES "baskets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baskets" ADD CONSTRAINT "baskets_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "baskets" ADD CONSTRAINT "baskets_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "basket_members" ADD CONSTRAINT "basket_members_basketId_fkey" FOREIGN KEY ("basketId") REFERENCES "baskets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "basket_members" ADD CONSTRAINT "basket_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "basket_contributions" ADD CONSTRAINT "basket_contributions_basketId_fkey" FOREIGN KEY ("basketId") REFERENCES "baskets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "basket_contributions" ADD CONSTRAINT "basket_contributions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "households"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invites" ADD CONSTRAINT "invites_basketId_fkey" FOREIGN KEY ("basketId") REFERENCES "baskets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_redemptions" ADD CONSTRAINT "invite_redemptions_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "invites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_redemptions" ADD CONSTRAINT "invite_redemptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

