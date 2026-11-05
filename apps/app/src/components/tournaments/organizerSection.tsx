// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { apiErrorMessage } from "@/lib/api";
import {
  getMyTournaments,
  tournamentPaths,
  type OrganizerTournament,
} from "@/lib/organizer-tournaments";
import { useSession } from "@/lib/session";
import { tournamentCopy } from "@/translations/tournaments.en";
import { eventStyles } from "./eventStyles";
import { GREEN } from "./styles";
import { TournamentRow } from "./tournamentRow";
import { useDeleteDraft } from "./useDeleteDraft";

const copy = tournamentCopy.events;

type Loaded =
  | { kind: "loading" }
  | { kind: "failed"; message: string }
  | { kind: "ready"; tournaments: OrganizerTournament[] };

// Loads the organizer's tournaments each time the Events page comes back into
// view, so a draft saved a moment ago is listed.
function useMyTournaments() {
  const { user } = useSession();
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });
  const load = useCallback(() => {
    if (!user) return;
    let isCurrent = true;
    getMyTournaments(user).then(
      (tournaments) => isCurrent && setLoaded({ kind: "ready", tournaments }),
      (failure) => isCurrent && setLoaded({ kind: "failed", message: apiErrorMessage(failure) }),
    );
    // Leaving the page ignores an answer that arrives afterwards.
    return () => {
      isCurrent = false;
    };
  }, [user]);
  useFocusEffect(load);
  const retry = () => {
    setLoaded({ kind: "loading" });
    load();
  };
  const remove = (id: string) =>
    setLoaded((current) =>
      current.kind === "ready"
        ? { kind: "ready", tournaments: current.tournaments.filter((t) => t.id !== id) }
        : current,
    );
  return { loaded, retry, remove };
}

// The Events page's Organizer section (#90): the Create button and the
// organizer's tournaments.
export function OrganizerSection() {
  const { loaded, retry, remove } = useMyTournaments();
  const deletion = useDeleteDraft(remove);
  return (
    <View style={eventStyles.section}>
      <View style={eventStyles.sectionHeader}>
        <View style={eventStyles.badge}>
          <Text style={eventStyles.badgeText}>{copy.organizerBadge}</Text>
        </View>
        <Text style={eventStyles.sectionTitle}>{copy.organizerTitle}</Text>
        {loaded.kind === "ready" && (
          <Text style={eventStyles.count}>{copy.count(loaded.tournaments.length)}</Text>
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.create}
        onPress={() => router.push(tournamentPaths.new)}
        style={eventStyles.createButton}
      >
        <Ionicons name="add-circle-outline" size={20} color="#ffffff" />
        <Text style={eventStyles.createText}>{copy.create}</Text>
      </Pressable>
      <TournamentList loaded={loaded} retry={retry} onDelete={deletion.ask} />
      {deletion.dialog}
    </View>
  );
}

function TournamentList({
  loaded,
  retry,
  onDelete,
}: {
  loaded: Loaded;
  retry: () => void;
  onDelete: (tournament: OrganizerTournament) => void;
}) {
  if (loaded.kind === "loading")
    return (
      <View style={eventStyles.center}>
        <ActivityIndicator color={GREEN} />
        <Text style={eventStyles.muted}>{copy.loading}</Text>
      </View>
    );
  if (loaded.kind === "failed")
    return (
      <View style={eventStyles.center}>
        <Text style={eventStyles.error}>{loaded.message}</Text>
        <Pressable accessibilityRole="button" onPress={retry} style={eventStyles.retryButton}>
          <Text style={eventStyles.retryText}>{copy.retry}</Text>
        </Pressable>
      </View>
    );
  if (loaded.tournaments.length === 0) return <Text style={eventStyles.muted}>{copy.empty}</Text>;
  return (
    <View style={eventStyles.list}>
      {loaded.tournaments.map((tournament) => (
        <TournamentRow key={tournament.id} tournament={tournament} onDelete={onDelete} />
      ))}
    </View>
  );
}
