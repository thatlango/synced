#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Synced APK Builder — Run this on your own machine (not on the server)
# Requirements: Node.js 20+, npm, git
# ─────────────────────────────────────────────────────────────────────────────
set -e

echo "╔══════════════════════════════════════════════╗"
echo "║   Synced APK Builder — TukuTuku Labs          ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Detect OS
OS=$(uname -s)

# ── Step 1: Install EAS CLI ────────────────────────────────────────────────
echo "📦 Installing EAS CLI..."
npm install -g @expo/eas-cli

# ── Step 2: Login to Expo ─────────────────────────────────────────────────
echo ""
echo "🔐 Login to your Expo account (free at expo.dev)..."
eas login

# ── Step 3: Configure EAS ────────────────────────────────────────────────
cd "$(dirname "$0")/mobile"
echo ""
echo "⚙️  Configuring EAS Build..."

# Create eas.json if it doesn't exist
if [ ! -f "eas.json" ]; then
cat > eas.json << 'EASEOF'
{
  "cli": {
    "version": ">= 10.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "android": {
        "buildType": "apk"
      },
      "distribution": "internal"
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
EASEOF
echo "  ✅ eas.json created"
fi

# ── Step 4: Install dependencies ─────────────────────────────────────────
echo ""
echo "📦 Installing mobile dependencies..."
npm install --legacy-peer-deps

# ── Step 5: Build ─────────────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════════════════"
echo "  Choose build type:"
echo "  1) APK (for direct install / testing)"
echo "  2) AAB (for Google Play Store)"
echo "════════════════════════════════════════════════"
read -p "Enter 1 or 2: " BUILD_TYPE

if [ "$BUILD_TYPE" = "1" ]; then
  echo ""
  echo "🏗️  Building APK (this takes ~10-15 minutes on EAS servers)..."
  eas build --platform android --profile preview --non-interactive
  echo ""
  echo "✅ APK build complete!"
  echo "   Download your APK from the URL shown above."
  echo "   Or run: eas build:list --platform android"
else
  echo ""
  echo "🏗️  Building AAB for Play Store (this takes ~10-15 minutes)..."
  eas build --platform android --profile production --non-interactive
  echo ""
  echo "✅ AAB build complete!"
  echo "   Download your AAB from the URL shown above."
  echo "   Upload the AAB to Google Play Console."
fi

echo ""
echo "════════════════════════════════════════════════"
echo "  Next Steps:"
echo "  1. Download the APK/AAB from the EAS dashboard"
echo "  2. For APK: Transfer to your Android phone and install"
echo "  3. For AAB: Upload to Google Play Console"
echo "  4. See PLAY_STORE_GUIDE.md for full submission guide"
echo "════════════════════════════════════════════════"
