# Tuku Production Master Plan — 1 September 2026 release track

This repository participates in the wider Tuku production programme. The production contract is:

- Tuku Core: canonical identity, organisations, permissions, AI routing, events, notifications, audit and product telemetry.
- Product backend: owns domain logic and product data.
- Product frontend/mobile: consumes product APIs; no direct database or LLM access.
- Local AI: all product AI requests route through Tuku Core AI first; external fallback is policy-controlled.
- GitHub: source of truth. Production artifacts build from canonical branches and are deployed to the VPS/container platform behind Caddy.
- Every production product must expose health/readiness, logs, backup/restore coverage and end-to-end smoke tests.

## Synced release goals
1. Backend-first financial engine on PostgreSQL + Redis.
2. Core-linked identity with product session compatibility during migration.
3. Plans, Baskets, bills, transactions, ledger, analytics, forecasts and financial-health insights.
4. Privacy-aware SMS financial signal ingestion.
5. Core/local-AI assistant and insight generation; no direct provider SDK in Android.
6. Bright Android design system with Home, Activity, Plan, Baskets and More.
7. Production container, health/readiness, database migration, backup and Caddy route.
