# Frontend (apps/app)

The app is written once in React Native with Expo and TypeScript. The web version ships first. iOS and Android builds come later from the same code.

## Prerequisites

- Node.js (current LTS)
- To test on phone: expo go app
- To test on ios simulator: Xcode with the iOS Simulator (macOS only, for iOS)

## Setup

From the repo root:

```bash
cd apps/app
npm install
npx expo start
```

Then:

- Press `w` to open the web version in your browser.
- Press `i` to open the iOS simulator.
- Scan the QR code with Expo Go (Android) or the Camera app (iOS) to open it on your phone.

## Troubleshooting

**The UI doesn't update after stopping and restarting the server**
Expo Go keeps showing the last bundle it loaded. Press `r` in the terminal to reload all connected devices. On web, refresh the browser tab.

**The UI still looks out of date**
Restart with `npx expo start -c` to clear the Metro cache, then press `r`.

**The phone can't connect**
Make sure the phone and computer are on the same Wi-Fi network, or run `npx expo start --tunnel`.


## Note: Expo Go and development builds

We use Expo Go for now because the current stack needs no native code. We will switch to an Expo development build when we add something that does, such as Google sign-in on iOS and Android or remote push notifications. App code won't change. Setup will gain a build-and-install step, and this README will be updated then.