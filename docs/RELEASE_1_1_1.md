# Synced 1.1.1 — Native Tuku Login

Release date: 1 September 2026
Package: `com.tukutuku.synced`
Version code: `3`
Version name: `1.1.1`

## Authentication contract

Normal email/password sign-in and account creation stay inside the Synced Android application. The app sends credentials directly over HTTPS to `https://core.tukutuku.org/api/v1/auth/login` or `/auth/register`. Tuku Core returns a short-lived Core access token. Android sends only that token to `POST https://api.synced.tukutuku.org/api/v1/auth/core/session`.

The Synced API verifies the token against Tuku Core `/api/v1/auth/me`, maps the canonical `coreUserId`, issues a Synced product session, and does not return or store the Core access token. The user's Tuku password never crosses the Synced backend boundary.

The previous `synced://auth/tuku/callback` browser/PKCE route has been removed from the Android manifest and native login UI. `POST /auth/core/exchange` remains server-side only for compatibility with older clients.

## UX

- Sign in and Create account are available on the same native screen.
- Account creation asks for name, email and a minimum 8-character password.
- No external browser is launched during normal sign-in or sign-up.
- Invite deep links (`synced://join`) remain supported and are unrelated to authentication.
- Synced stores only its own encrypted product token in Android Keystore-backed storage.

## Validation completed

Backend:
- Core bearer-token verification regression test: pass
- Existing legacy PKCE compatibility regression test: pass
- Structured SMS regression test: pass
- Prisma generation and Nest production build: pass
- Production readiness after deployment: pass
- Production smoke test: direct Core registration → direct Core login → token-only Synced linking → authenticated Synced profile: pass
- QA account cleanup: pass

Android:
- `lintDebug`: pass
- `testDebugUnitTest`: pass
- `assembleDebug`: pass
- `lintVitalRelease`: pass
- signed `assembleRelease`: pass
- signed `bundleRelease`: pass
- Auth UI/source scan: no browser auth URL, browser-launch call, PKCE state store, or `synced://auth/tuku/callback` manifest route remains. `ACTION_VIEW` remains only for the independent `synced://join` invite deep link.

## Signed artifacts

Trusted build-host copies:

- `/opt/tuku/artifacts/synced/1.1.1/synced-1.1.1-release.apk`
- `/opt/tuku/artifacts/synced/1.1.1/synced-1.1.1-release.aab`

SHA-256:

- APK: `1b3db19a8e5e82c8b0f820653c418ad2d84e68d5b1f173e89438937ebc53a90a`
- AAB: `fdfe264c8241502e237e45d13fbc82ff17b241eccf51d7ac4e44e5146131ccc5`

APK and AAB signature verification both passed on the trusted release host.
