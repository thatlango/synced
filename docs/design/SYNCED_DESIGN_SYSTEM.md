# Synced Design System — Light-first Financial Intelligence

## Product feeling
Synced should feel optimistic, calm, financially trustworthy, and useful every day. It is not a crypto dashboard, enterprise admin panel, or dark analytics console.

## Design principles
1. Light-first, with high-contrast accessibility and optional dark mode later.
2. Readable in three seconds: balance/state, next obligation, plan position, and one useful insight.
3. Planning over reporting: show what happens next, not just what happened.
4. Money hierarchy: large numbers only for current state; supporting figures are quieter.
5. Semantic color: green=positive/healthy, amber=attention, red=risk/expense, blue=primary action, violet=shared/basket planning.
6. Calm surfaces: mostly warm whites and cool neutral cards with restrained accents.
7. Human language: “Available this month”, “On track”, “Next bill”, “Your basket”, “Needs attention”.
8. Real states: skeleton/loading, empty, error, offline, sync status, low-confidence import.
9. 8px spacing rhythm; 16–24px card padding; 16–20px card radii.
10. Android touch targets >=44px; no dense tables on mobile.

## Core palette
- Canvas: #F7F9FC
- Surface: #FFFFFF
- Surface soft: #F0F4FA
- Ink: #172033
- Ink secondary: #5B6577
- Ink muted: #8791A3
- Border: #E3E8F0
- Primary blue: #2F6FED
- Primary soft: #EAF1FF
- Fresh green: #16A66A
- Fresh green soft: #E8F7F0
- Basket violet: #7457D9
- Basket violet soft: #F0ECFF
- Warm amber: #E49B19
- Warm amber soft: #FFF5DD
- Expense coral: #D95A5A
- Expense soft: #FFF0F0

## Navigation
Primary tabs: Home · Activity · Plan · Baskets · More.
Insights and Shared Space are secondary screens reachable from Home/More/Baskets.

## Home hierarchy
1. Greeting + sync status
2. “Available this month” hero card
3. Plan progress and next bill
4. Quick actions
5. One high-value AI/deterministic insight
6. Basket progress
7. Recent activity

## AI presentation
AI never looks like a separate chatbot product. It appears as “Synced insight” cards grounded in the user’s real financial state. The full assistant screen is secondary. Every AI explanation distinguishes calculations from narrative and never directly mutates the ledger.

## SMS import UX
- Ask permission in context, after value has been explained.
- Prefer on-device filtering before upload.
- High-confidence financial events can auto-import if the user opts in.
- Lower-confidence events land in “Review imports”.
- Never display or retain unrelated personal SMS.

## Stitch prompt baseline
Use this design system as the authoritative prompt context when generating new Synced screens in Google Stitch. Generate Android-first screens at 390x844 and a coherent responsive web interpretation where requested. Preserve backend field names and routes from the repository.
