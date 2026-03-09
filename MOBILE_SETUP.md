# RentSweep — Mobile App Setup (iOS & Android)

## Prerequisites

| Tool | Purpose |
|------|---------|
| Node 20+ | Frontend build |
| Python 3.11+ | Backend |
| Xcode 15+ | iOS build (Mac only) |
| Android Studio | Android build |
| CocoaPods | iOS dependency manager |

---

## 1. Start the Backend

The mobile app talks to the FastAPI backend over your local network.

```bash
cd backend
pip install -r requirements.txt
playwright install chromium --with-deps
mkdir -p data
DATABASE_URL=sqlite:///./data/rentsweep.db uvicorn main:app --host 0.0.0.0 --port 8000
```

Find your machine's LAN IP:
```bash
# macOS
ipconfig getifaddr en0

# Linux
hostname -I | awk '{print $1}'
```

---

## 2. Configure the Frontend for Mobile

```bash
cd frontend
cp .env.capacitor .env.local
```

Edit `.env.local` and set your LAN IP:
```
VITE_API_URL=http://YOUR_LAN_IP:8000
BUILD_TARGET=capacitor
```

---

## 3. iOS Preview (Mac required)

```bash
cd frontend

# First time only — initialise Capacitor platforms
npx cap add ios
npx cap add android

# Build web assets + sync to native projects
npm run build:capacitor

# Open in Xcode
npm run cap:ios
```

In Xcode:
- Select your simulator or connected iPhone
- Press ▶ Run
- For App Store: set Bundle ID to `au.com.rentsweep.app`, add your Apple Developer team

---

## 4. Android Preview

```bash
npm run cap:android
```

In Android Studio:
- Click ▶ Run on an emulator or USB-connected device
- For Play Store: generate a signed APK/AAB via Build → Generate Signed Bundle

---

## 5. App Store Submission Checklist

### iOS (App Store Connect)
- [ ] Apple Developer account ($99/yr)
- [ ] Bundle ID registered: `au.com.rentsweep.app`
- [ ] App icons: 1024×1024 PNG (no alpha) + all required sizes
- [ ] Screenshots for iPhone 6.7", 6.5", 5.5"
- [ ] Privacy policy URL (required — app stores local data only)
- [ ] App description + keywords
- [ ] Set deployment target (iOS 16+)
- [ ] Archive → Validate → Upload in Xcode

### Android (Google Play Console)
- [ ] Google Play Developer account ($25 one-time)
- [ ] Signed AAB generated from Android Studio
- [ ] App icon 512×512 PNG
- [ ] Feature graphic 1024×500
- [ ] Screenshots for phone + 7" tablet
- [ ] Privacy policy URL

---

## App IDs

| Platform | ID |
|----------|----|
| iOS Bundle ID | `au.com.rentsweep.app` |
| Android Package | `au.com.rentsweep.app` |

---

## Architecture Note

RentSweep uses a **hybrid architecture**:
- The UI is a React web app bundled inside the native shell via Capacitor
- The backend (FastAPI + SQLite) runs as a local server on the same device/network
- All data is local — no cloud, no accounts

For a fully self-contained mobile app (no separate server), the backend would need to be embedded using a Python-to-mobile bridge, which is a future enhancement.
