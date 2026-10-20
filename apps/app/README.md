# Frontend (apps/app)

The app is written in React Native with Expo and TypeScript.

## Prerequisites

- Node.js (LTS)
- To test on iOS simulator: Download Xcode from App Store on Mac.
- To test on Android emulator: Download Android Studio and create an emulator.
- To test on an Android phone: Install the development build APK (see Setup step 1). Phone and computer must be on the same Wi-Fi network.

Expo Go does not work with this app. Use the development build instead.

## Setup

From the repo root:

```bash
cd apps/app
npm install
```

**1. Install the development build (one time per simulator/emulator/phone).** Pick one:

**Option A: Install the existing EAS build (default).** Fast, and doesn't need a full native build setup. Requires a free Expo account and an invite to the `rally-capstone` Expo organization.

```bash
npm install -g eas-cli
eas login
eas build:run --platform ios       # open the iOS simulator first
eas build:run --platform android   # start an emulator first
```

**Option B: Build locally.** Slower the first time. No Expo account needed. Use this if you don't have an invite or the existing build is out of date.

```bash
npx expo run:ios        # iOS simulator (needs Xcode)
npx expo run:android    # Android emulator or connected phone (needs Android Studio)
```

iOS builds run on the simulator only. A real iPhone needs a paid Apple Developer account.

**2. Start the dev server:**

```bash
npx expo start --dev-client
```

Then:

- Press `w` to open the web version in your browser.
- Press `i` to open the iOS simulator.
- Press `a` to open the Android emulator.
- Open the installed Rally app on your phone to connect to the server.
- Press `Ctrl+C` in the terminal to stop the server.

## Troubleshooting

**The UI doesn't update after stopping and restarting the server**
After you stop the server (`Ctrl+C`) and start it again, the app keeps showing the last bundle it loaded. Press `r` in the terminal to reload all connected devices. On web, refresh the browser tab.

**The UI still looks out of date**
Restart with `npx expo start --dev-client -c` to clear the Metro cache, then press `r`.

**The phone can't connect**
Make sure the phone and computer are on the same Wi-Fi network, or run `npx expo start --dev-client --tunnel`.

**The terminal says it is opening Expo Go**
Press `s` in the terminal to switch to the development build.

**The app crashes on launch or shows "native module not found" after pulling new code**
Someone probably added a package with native code. Run `npm install`, then reinstall the latest build: `eas build:run` (Option A, once a maintainer has made a new build) or `npx expo run:ios` / `run:android` (Option B).

## Note: Development builds

You only need a new build when native things change, such as adding a package with native code or editing plugins or native settings in `app.json` (icons, permissions, scheme). JavaScript and TypeScript changes just hot-reload.

Builds are a snapshot of the code from when they were made. After native changes, everyone needs to reinstall: pull the code, run `npm install`, then use Option A (once a new EAS build exists) or Option B (rebuild locally).

**Build limits:** Our Expo plan has a limited number of EAS builds per month, so only create a new build when native things change, and ask the team first. Installing an existing build (`eas build:run`) and local builds (`npx expo run:ios` / `run:android`) don't use up the quota.

To make a new EAS build:

```bash
eas build --profile development --platform ios
eas build --profile development --platform android
```

### Optional local Firebase Auth emulator

Set `EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL=http://127.0.0.1:9099` only for disposable local testing. On Android, run `adb reverse tcp:9099 tcp:9099` before opening the development build so the device loopback reaches the host emulator. The app accepts only HTTP loopback addresses in development; production builds ignore this opt-in setting. Keep the local emulator project separate from the team Firebase project.
