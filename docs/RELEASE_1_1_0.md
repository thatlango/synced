# Synced 1.1.0 Production Release

Release date: 1 September 2026
Package: `com.tukutuku.synced`
Version code: `2`
Version name: `1.1.0`

## Production architecture

Synced Android is a native Kotlin/Jetpack Compose application. The production API is NestJS + Prisma on PostgreSQL. Tuku Core is the canonical identity provider; Synced does not collect or verify the user's Tuku password.

Android authentication uses an OAuth-style Tuku Core hand-off with PKCE:

1. Android generates a high-entropy verifier, SHA-256 challenge and state.
2. The browser opens `https://core.tukutuku.org/authorize` for `synced-android`.
3. Tuku Core returns a short-lived one-time code to `synced://auth/tuku/callback`.
4. Android validates state and sends the code + verifier to the Synced API.
5. Synced exchanges the code at Core and maps `coreUserId` to the local financial profile.
6. Only the Synced product token is retained by the app.

## Release capabilities verified end to end

- Canonical Tuku account / PKCE product sign-in
- Personal wallet
- Transactions and immutable ledger entries
- Household creation and joining
- Scope-aware invite links / QR payloads
- Baskets, memberships and contributions
- Monthly financial plans and allocations
- Deterministic insight summary / Ask Synced boundary
- On-device SMS parsing with structured financial candidates only sent to the API
- Production readiness endpoint and Prisma migration state

## Automated gates

Backend:
- Prisma Client generation
- NestJS production build
- Core SSO exchange regression test
- Structured SMS ingestion response-contract regression test
- Production API E2E smoke workflow

Android:
- `lintDebug`
- `testDebugUnitTest`
- `assembleDebug`
- `lintVitalRelease`
- `assembleRelease`
- `bundleRelease`

## Signed artifacts

Trusted build-host copies:

- `/opt/tuku/artifacts/synced/1.1.0/synced-1.1.0-release.apk`
- `/opt/tuku/artifacts/synced/1.1.0/synced-1.1.0-release.aab`

SHA-256:

- APK: `b8d52ef03331a3e7aaf2eba3cb8d74861f11ff1022ab14ab0cc37d2370f76a39`
- AAB: `996148523e113f7b54d0fc83ff0dd25bf94e48176ac956d75dcfee9cb5b1eeec`

The Android release task fails closed if the release keystore configuration is absent. The key and passwords are kept outside Git.

## SMS data boundary

Synced requests `READ_SMS` only for its money-management import feature. Parsing occurs on-device. Raw message bodies are not sent to the Synced API by the native flow; only structured transaction candidates such as amount, direction, merchant/provider reference and confidence are transmitted. Google Play classifies SMS-based money management as an exception use case subject to declaration and review, so the release must include an accurate SMS permissions declaration, privacy disclosure and reviewer demonstration.

## Deployment

Production API: `https://api.synced.tukutuku.org/api/v1/`
Tuku Auth: `https://core.tukutuku.org`
Core SSO client: `synced-android`
Redirect URI: `synced://auth/tuku/callback`

The exact tested production source was promoted to the canonical GitHub branch from release commit `beac3a4f723efe09b9fa72216edb0af03ecacb5b`. This documentation update is intentionally a follow-up commit so GitHub Actions validates the promoted tree through the normal branch event path.

Do not reintroduce direct Tuku email/password handling into Synced. New clients must continue using the Core product SSO contract.
