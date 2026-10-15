import { Stack } from "expo-router";
import { SessionProvider, useSession } from "@/lib/session";

export default function RootLayout() {
  return (
    <SessionProvider>
      <RootNavigator />
    </SessionProvider>
  );
}

// Each screen is only reachable when its guard is true. If a guard turns false
// while you're on that screen (e.g. you log in or out), Expo Router sends you
// back to index, which redirects you to the right place.
function RootNavigator() {
  const { user, isLoading } = useSession();
  // Unlocked while loading too, so a link to /sign-up or /recover-account
  // isn't bounced to Login before Firebase has answered.
  const signedOut = !user;
  const unverified = !isLoading && !!user && !user.emailVerified;
  const verified = !isLoading && !!user?.emailVerified;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={signedOut}>
        <Stack.Screen name="login" />
        <Stack.Screen name="sign-up" />
        <Stack.Screen name="recover-account" />
      </Stack.Protected>
      <Stack.Protected guard={unverified}>
        <Stack.Screen name="verify-email" />
      </Stack.Protected>
      <Stack.Protected guard={verified}>
        <Stack.Screen name="home" />
      </Stack.Protected>
    </Stack>
  );
}
