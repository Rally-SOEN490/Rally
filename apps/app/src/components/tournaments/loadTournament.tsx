// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { useEffect, useState, type ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiErrorMessage } from "@/lib/api";
import { getTournament, type OrganizerTournament } from "@/lib/organizer-tournaments";
import { useSession } from "@/lib/session";
import { tournamentCopy } from "@/translations/tournaments.en";
import { GREEN, styles } from "./styles";

const copy = tournamentCopy.steps;

type Loaded =
  | { kind: "loading" }
  | { kind: "failed"; message: string }
  | { kind: "ready"; tournament: OrganizerTournament };

// Loads one of the organizer's tournaments, with loading and retry states, then
// shows `children` with it.
export function LoadTournament({
  id,
  children,
}: {
  id: string;
  children: (tournament: OrganizerTournament) => ReactNode;
}) {
  const { user } = useSession();
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!user) return;
    let isCurrent = true;
    getTournament(user, id).then(
      (tournament) => isCurrent && setLoaded({ kind: "ready", tournament }),
      (failure) => isCurrent && setLoaded({ kind: "failed", message: apiErrorMessage(failure) }),
    );
    return () => {
      isCurrent = false;
    };
  }, [user, id, attempt]);

  if (loaded.kind === "ready") return children(loaded.tournament);
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.center}>
        {loaded.kind === "loading" ? (
          <>
            <ActivityIndicator color={GREEN} />
            <Text style={styles.noteText}>{copy.loading}</Text>
          </>
        ) : (
          <>
            <Text style={styles.error}>{loaded.message}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setLoaded({ kind: "loading" });
                setAttempt((count) => count + 1);
              }}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryText}>{copy.retry}</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
