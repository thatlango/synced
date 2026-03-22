#!/bin/bash
set -e

echo "🚀 Starting Synced by TukuTuku Innovation Labs..."

# ─── Install backend dependencies ────────────────────────────
echo "📦 Installing backend dependencies..."
cd backend
npm install --legacy-peer-deps

# ─── Copy env if not exists ───────────────────────────────────
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✅ .env created from .env.example"
fi

# ─── Wait for PostgreSQL ──────────────────────────────────────
echo "⏳ Waiting for database..."
for i in {1..30}; do
  if npx prisma db push --accept-data-loss 2>/dev/null; then
    echo "✅ Database ready"
    break
  fi
  echo "   Waiting... ($i/30)"
  sleep 2
done

# ─── Generate Prisma client ───────────────────────────────────
echo "🔧 Generating Prisma client..."
npx prisma generate

# ─── Run migrations ───────────────────────────────────────────
echo "🗃️ Running database migrations..."
npx prisma migrate deploy 2>/dev/null || npx prisma db push --accept-data-loss

# ─── Seed demo data ───────────────────────────────────────────
echo "🌱 Seeding demo data..."
npx ts-node prisma/seed.ts 2>/dev/null || echo "⚠️ Seed failed or already seeded"

# ─── Start backend ────────────────────────────────────────────
echo "🏁 Starting Synced API..."
npm run start:dev &
BACKEND_PID=$!

echo ""
echo "============================================"
echo "  ⚡ SYNCED by TukuTuku Innovation Labs"
echo "============================================"
echo "  API:    http://localhost:3000/api/v1"
echo "  Docs:   http://localhost:3000/api/docs"
echo ""
echo "  Demo Credentials:"
echo "  John:  +256700000001 | OTP: 123456"
echo "  Sarah: +256700000002 | OTP: 123456"
echo "  David: +256700000003 | OTP: 123456"
echo "  Invite Code: NAKAWA2024"
echo "============================================"

wait $BACKEND_PID
