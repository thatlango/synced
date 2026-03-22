# Google Play Store — Publishing Synced

> Complete guide for submitting Synced to the Google Play Store using your existing Developer Console.

---

## Prerequisites

- Google Play Developer Console account (you have this ✅)
- Developer registration fee paid ($25 one-time ✅)
- Synced APK or AAB (Android App Bundle) file

---

## Step 1 — Build the APK / AAB

### Option A — EAS Build (Recommended, Cloud-based)

This requires no local Android SDK. EAS builds on Expo's servers.

```bash
# In the mobile/ directory
npm install -g @expo/eas-cli
eas login           # login with your Expo account
eas build:configure # creates eas.json
eas build --platform android --profile production
```

After the build completes (~10 min), download the `.aab` file from the EAS dashboard.

### Option B — Local Build (requires Android SDK)

```bash
cd mobile/
npm install
npx expo prebuild --platform android
cd android/
./gradlew bundleRelease     # produces AAB
# or
./gradlew assembleRelease   # produces APK
```

The output is at:
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- APK: `android/app/build/outputs/apk/release/app-release.apk`

---

## Step 2 — Sign the App

Google Play requires a signed AAB/APK.

### Generate a Keystore (one-time)

```bash
keytool -genkey -v \
  -keystore synced-release.keystore \
  -alias synced \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# You will be asked for:
# - Keystore password (save this securely!)
# - Your name, organization, city, country
```

> ⚠️ IMPORTANT: Back up `synced-release.keystore` and the password. If you lose it, you cannot update your app on the Play Store.

### Configure signing in Gradle

Edit `mobile/android/app/build.gradle`:

```gradle
android {
  signingConfigs {
    release {
      storeFile file("../../synced-release.keystore")
      storePassword "YOUR_STORE_PASSWORD"
      keyAlias "synced"
      keyPassword "YOUR_KEY_PASSWORD"
    }
  }
  buildTypes {
    release {
      signingConfig signingConfigs.release
      minifyEnabled true
      proguardFiles getDefaultProguardFile("proguard-android.txt"), "proguard-rules.pro"
    }
  }
}
```

Then run: `./gradlew bundleRelease`

---

## Step 3 — Create App on Play Console

1. Go to [play.google.com/console](https://play.google.com/console)
2. Click **"Create app"**
3. Fill in:
   - **App name**: Synced — Family Finance
   - **Default language**: English (United Kingdom)
   - **App or game**: App
   - **Free or paid**: Free
4. Accept declarations and click **Create app**

---

## Step 4 — Complete Store Listing

Navigate to **Store presence → Main store listing**:

### App Details
| Field | Value |
|-------|-------|
| App name | Synced — Family Finance |
| Short description (80 chars) | Track spending, manage household budgets & bills. Built for Uganda. |
| Full description | See below |

### Full Description (4000 chars max)
```
Synced is a smart personal and household finance app built specifically for Ugandan families.

🔑 KEY FEATURES

📲 SMS Auto-Sync
Grant READ_SMS once and Synced silently imports your MTN MoMo and Airtel Money transactions in the background — automatically categorized.

📊 Smart Analytics
Understand your spending with beautiful breakdowns by category, merchant, and time period. Compare this month vs last month.

📋 Bills Tracker
Track NWSC water, UEDCL electricity, DSTV, school fees, and rent. Get alerts before due dates. Mark bills as paid with one tap.

👨‍👩‍👧 Household Wallets
Create a shared household wallet with your family. See exactly who spent what with full transparency — no arguments about money.

🎯 Budget Goals
Set monthly budgets per category. Visual progress bars and alerts when you're approaching limits.

🔮 3-Month Forecasts
See projected balances based on your spending trends. Know when money might run low before it happens.

🏷️ 15 Auto-Categories
Food, transport, utilities, rent, school fees, entertainment, healthcare, shopping, fuel, mobile data, and more — all auto-tagged.

🔒 Secure Phone OTP Login
Sign in with your Ugandan phone number. No passwords. No bank account needed.

🇺🇬 Built for Uganda
Supports MTN MoMo, Airtel Money, NWSC, UEDCL, DSTV, and all major Ugandan providers. Amounts in UGX.

---
Built by TukuTuku Innovation Labs, Kampala, Uganda.
```

### Graphics Required
| Asset | Size |
|-------|------|
| App icon | 512×512 PNG |
| Feature graphic | 1024×500 PNG/JPG |
| Phone screenshots | Min 2, 1080×1920 recommended |

> **Tip**: Take screenshots from the running app in the emulator. Required screens: Dashboard, Transactions, Analytics, Household.

---

## Step 5 — Configure App Content

Navigate to **Policy → App content**:

### Privacy Policy
You need a privacy policy URL. Options:
- Host it on your landing page: `https://yoursite.com/privacy`
- Use [privacypolicygenerator.info](https://privacypolicygenerator.info) for free generation

Key points to include:
- SMS data is only used locally to extract transaction amounts/merchants
- No raw SMS content is stored on servers
- User financial data is stored securely and not sold

### Permissions Declaration
Since Synced requests `READ_SMS`:
1. Go to **Policy → Sensitive permissions**
2. Select **SMS** permission
3. Declare usage: "The app reads MTN MoMo and Airtel Money SMS messages to automatically import and categorize transactions. Only amount, merchant, and date fields are extracted and sent to the user's personal account."

> ⚠️ Google carefully reviews READ_SMS. Be precise in your declaration. The core functionality (importing transactions from SMS) qualifies as a valid use case.

### App Access
- Select **"All functionality is accessible without special access"** (demo mode works with OTP 123456)

### Content Rating
- Complete the content ratings questionnaire
- For a finance app: typically rated "Everyone"

---

## Step 6 — Distribution & Pricing

Navigate to **Monetization → Countries / regions**:
- Select: Uganda (required), Kenya, Tanzania, Rwanda, Nigeria (optional expansion)

Navigate to **Production** (or start with **Internal testing**):
- For first release, use **Internal testing** to test with yourself
- Promote to **Closed testing → Open testing → Production** as you grow confident

---

## Step 7 — Upload the AAB

1. Navigate to **Release → Production** (or Testing track)
2. Click **Create new release**
3. Upload your `.aab` file
4. Add release notes:
   ```
   Version 1.0.0 — Initial release
   • MTN MoMo & Airtel Money SMS auto-sync
   • Personal & household wallet tracking
   • Bills tracker with due date alerts
   • 15-category auto-categorization
   • 3-month spending forecasts
   ```
5. Click **Save** → **Review release** → **Start rollout**

---

## Step 8 — Google Review

Google reviews usually take **1–3 business days**. They check:
- App functionality matches description
- SMS permission is necessary and properly declared
- Privacy policy covers data usage
- Screenshots are accurate

**Common rejection reasons for SMS permission:**
- Vague permission declaration → Be specific about MoMo/banking SMS
- Missing privacy policy → Must be hosted at a live URL
- No core functionality tied to SMS → The transaction import IS the core feature

---

## Step 9 — After Approval

Once live, share your Play Store link:
```
https://play.google.com/store/apps/details?id=com.tukutuku.synced
```

Update your landing page (`landing/index.html`) with the real Play Store URL — replace the `#` placeholder in the "Get it on Google Play" button.

---

## Checklist Before Submission

- [ ] APK/AAB built and signed with release keystore
- [ ] App icon (512×512) prepared
- [ ] Feature graphic (1024×500) prepared
- [ ] At least 2 phone screenshots taken
- [ ] Privacy policy live at a public URL
- [ ] SMS permission declaration written
- [ ] Store listing description completed
- [ ] Countries selected (Uganda at minimum)
- [ ] Content rating questionnaire completed

---

## Useful Links

- [Play Console](https://play.google.com/console)
- [SMS Permission Policy](https://support.google.com/googleplay/android-developer/answer/9047303)
- [App Signing](https://developer.android.com/studio/publish/app-signing)
- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
