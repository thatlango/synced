# Google Play release guide — Synced

This guide reflects the native Kotlin/Jetpack Compose application and the v1.1.0 Tuku Core SSO architecture.

## Release bundle

Build from `mobile/` with JDK 17 and the Android SDK:

```bash
./gradlew lintDebug testDebugUnitTest
./gradlew assembleRelease bundleRelease
```

Production outputs:

- `app/build/outputs/apk/release/app-release.apk`
- `app/build/outputs/bundle/release/app-release.aab`

The build fails if the following release-signing values are not supplied outside Git:

```text
SYNCED_ANDROID_KEYSTORE_FILE
SYNCED_ANDROID_KEYSTORE_PASSWORD
SYNCED_ANDROID_KEY_ALIAS
SYNCED_ANDROID_KEY_PASSWORD
```

For v1.1.0, verified trusted-host copies are stored under `/opt/tuku/artifacts/synced/1.1.0/`.

## App identity

- App name: Synced
- Application ID: `com.tukutuku.synced`
- Version: `1.1.0` (`versionCode 2`)
- Category: Finance
- Authentication: Tuku Core product sign-in (PKCE); do not describe Synced as phone-OTP-only.

## Store description — core product facts

Synced helps individuals and households understand everyday money, create monthly plans, track transactions, contribute to shared baskets, coordinate household finances and turn supported financial SMS notifications into structured transaction records.

The app supports personal and shared financial spaces. Invitations can be shared as codes/links/QR payloads. Financial SMS parsing happens on the device; raw SMS message bodies are not uploaded by the native structured-import flow.

## SMS permission declaration

Synced declares `READ_SMS` for **SMS-based money management**. Google Play lists SMS-based money management (for example, budget tracking/management) as an exception use case for SMS permissions, subject to review and approval.

The declaration and reviewer video should demonstrate:

1. The permission is requested in the context of importing financial notifications.
2. The user can use the rest of Synced without granting unrelated permissions.
3. The parser extracts financial fields locally.
4. The network request contains structured transaction candidates rather than raw message text.
5. The resulting transaction is visible in the user's own Synced financial record.

Do not claim that SMS access is used for Tuku account verification; authentication uses Tuku Core SSO.

## App access for Google review

Because core financial functionality is authenticated, provide Google Play reviewers with a dedicated Tuku QA account and clear sign-in instructions in **App content → App access**. Do not state that all functionality is accessible without special access unless that is actually true for the submitted build.

## Privacy and data safety

The public privacy policy and Play Data safety form must accurately disclose financial data, authentication identifiers and SMS access. State explicitly that:

- financial/SMS data is sensitive user data;
- raw SMS bodies are processed locally for the native import flow and are not uploaded as raw text;
- structured financial candidates may be stored in the user's Synced account;
- data is not sold to advertisers;
- Tuku Core is the canonical authentication system;
- transport uses HTTPS and local session material is protected with Android Keystore-backed storage.

Google Play requires account/data deletion handling for apps that allow account creation. Before production rollout, ensure the public privacy/account-deletion route and the Play Console account-deletion URL reflect the actual Tuku/Synced deletion process.

## Recommended release progression

1. Internal testing
2. Closed testing
3. Production after SMS declaration, Data safety, privacy/account deletion, content rating and reviewer access are accepted

Upload the AAB, not the APK, to Google Play. Keep the APK for direct controlled testing only.
