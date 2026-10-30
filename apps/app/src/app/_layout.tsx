// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Stack } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
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
  const { user, isLoading, account, accountError } = useSession();
  // Wait until we know who is signed in and whether they have a Rally account.
  // Otherwise every guard starts out false, and opening or reloading a URL
  // like /profile would be sent to index before the session has loaded.
  const isSettled = !isLoading && (!user?.emailVerified || account !== undefined || !!accountError);
  const [hasSettled, setHasSettled] = useState(isSettled);
  if (isSettled && !hasSettled) setHasSettled(true);

  if (!hasSettled)
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );

  const signedOut = !user;
  const unverified = !!user && !user.emailVerified;
  const verified = !!user?.emailVerified;
  // Verified, but Rally's database has no account for them yet (for example,
  // saving it failed during sign-up).
  const needsAccount = verified && account === null;
  const hasAccount = verified && !!account;

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
      <Stack.Protected guard={needsAccount}>
        <Stack.Screen name="finish-setup" />
      </Stack.Protected>
      <Stack.Protected guard={hasAccount}>
        <Stack.Screen name="home" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="awards" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="search" />
      </Stack.Protected>
    </Stack>
  );
}
