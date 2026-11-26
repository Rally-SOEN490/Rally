// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Ionicons } from "@expo/vector-icons";
import { router, type Href } from "expo-router";
import type { User } from "firebase/auth";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError, apiErrorMessage } from "@/lib/api";
import { useSession } from "@/lib/session";
import { tournamentCopy } from "@/translations/tournaments.en";
import { GREEN } from "../styles";
import { pageStyles } from "./pageStyles";

// Loading a tournament's page, or its Game set up, and the screen shown until
// it is ready.

const copy = tournamentCopy.page;

export type Loaded<T> =
  | { kind: "loading" }
  | { kind: "failed"; message: string; canRetry: boolean }
  | { kind: "ready"; page: T };

// Back to where the screen was opened from, or `fallback` when it was opened
// directly, as from a link on the web.
export const goBack = (fallback: Href) =>
  router.canGoBack() ? router.back() : router.replace(fallback);

export function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={copy.back}
      onPress={onPress}
      style={pageStyles.backButton}
    >
      <Ionicons name="chevron-back" size={22} color={GREEN} />
    </Pressable>
  );
}

// Loads with `load`, with retry. A missing tournament can't be retried.
export function useLoadPage<T>(id: string, load: (user: User, id: string) => Promise<T>) {
  const { user } = useSession();
  const [loaded, setLoaded] = useState<Loaded<T>>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!user) return;
    let isCurrent = true;
    load(user, id).then(
      (page) => isCurrent && setLoaded({ kind: "ready", page }),
      (failure) =>
        isCurrent &&
        setLoaded({
          kind: "failed",
          message: apiErrorMessage(failure),
          canRetry: !(failure instanceof ApiError && failure.status === 404),
        }),
    );
    return () => {
      isCurrent = false;
    };
  }, [user, id, load, attempt]);

  const retry = () => {
    setLoaded({ kind: "loading" });
    setAttempt((count) => count + 1);
  };
  return { loaded, setLoaded, retry };
}

// Loading, or why it failed, with Try again when trying again could help.
export function PageStatus({
  loaded,
  retry,
  onBack,
}: {
  loaded: Exclude<Loaded<unknown>, { kind: "ready" }>;
  retry: () => void;
  onBack: () => void;
}) {
  return (
    <SafeAreaView style={pageStyles.screen}>
      <View style={{ padding: 16 }}>
        <BackButton onPress={onBack} />
      </View>
      <View style={pageStyles.center} accessibilityLiveRegion="polite">
        {loaded.kind === "loading" ? (
          <>
            <ActivityIndicator color={GREEN} />
            <Text style={pageStyles.status}>{copy.loading}</Text>
          </>
        ) : (
          <>
            <Text style={pageStyles.error}>{loaded.message}</Text>
            {loaded.canRetry && (
              <Pressable
                accessibilityRole="button"
                onPress={retry}
                style={pageStyles.secondaryButton}
              >
                <Text style={pageStyles.secondaryText}>{copy.retry}</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
