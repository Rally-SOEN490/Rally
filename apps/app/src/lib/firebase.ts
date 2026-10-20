import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";

export const auth = getAuth(
  initializeApp({
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  }),
);

// Opt-in local testing only. Normal development keeps the team's Firebase project.
const emulatorUrl = process.env.EXPO_PUBLIC_FIREBASE_AUTH_EMULATOR_URL;
if (__DEV__ && emulatorUrl) {
  const url = new URL(emulatorUrl);
  if (
    url.protocol !== "http:" ||
    !["localhost", "127.0.0.1"].includes(url.hostname)
  ) {
    throw new Error("Use a local Firebase Auth emulator address.");
  }
  connectAuthEmulator(auth, emulatorUrl, { disableWarnings: true });
}
