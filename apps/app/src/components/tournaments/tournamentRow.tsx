// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { dateParts, tournamentPaths, type OrganizerTournament } from "@/lib/organizer-tournaments";
import { tournamentCopy } from "@/translations/tournaments.en";
import { eventStyles } from "./eventStyles";
import { GREEN, RED } from "./styles";

const copy = tournamentCopy.events;

// "Verdun Auditorium · 6v6 Co-ed": where, and which formats.
const subtitle = (tournament: OrganizerTournament) => {
  const formats = [
    ...new Set(
      tournament.divisions.map(
        (division) => `${division.format} ${tournamentCopy.divisions.types[division.type]}`,
      ),
    ),
  ];
  return [tournament.location, formats.join(", ")].filter(Boolean).join(" · ");
};

// One tournament in the Organizer section. A draft opens its setup to keep
// going, and can be deleted; a published one opens its page (#285).
export function TournamentRow({
  tournament,
  onDelete,
}: {
  tournament: OrganizerTournament;
  onDelete: (tournament: OrganizerTournament) => void;
}) {
  const isDraft = tournament.status === "DRAFT";
  const content = <RowContent tournament={tournament} isDraft={isDraft} />;
  if (!isDraft)
    return (
      <View style={eventStyles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.openPublished(tournament.name)}
          onPress={() => router.push(tournamentPaths.page(tournament.id))}
          style={eventStyles.rowMain}
        >
          {content}
        </Pressable>
      </View>
    );
  // The delete button sits next to the row, not inside it, so a click on it
  // never also opens the draft.
  return (
    <View style={eventStyles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.openDraft(tournament.name)}
        onPress={() => router.push(tournamentPaths.setup(tournament.id))}
        style={eventStyles.rowMain}
      >
        {content}
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.deleteDraft(tournament.name)}
        onPress={() => onDelete(tournament)}
        hitSlop={8}
        style={eventStyles.deleteButton}
      >
        <Ionicons name="trash-outline" size={20} color={RED} />
      </Pressable>
    </View>
  );
}

// The date tile, the name and details, and the status badge.
function RowContent({
  tournament,
  isDraft,
}: {
  tournament: OrganizerTournament;
  isDraft: boolean;
}) {
  const date = tournament.startsAt ? dateParts(tournament.startsAt) : null;
  const maxTeams = tournament.divisions.reduce((sum, division) => sum + division.maxTeams, 0);
  return (
    <>
      <View style={[eventStyles.dateTile, !isDraft && eventStyles.dateTileOn]}>
        <Text style={[eventStyles.month, !isDraft && eventStyles.onDark]}>
          {date ? date.month.toUpperCase() : copy.noDate}
        </Text>
        {date && <Text style={[eventStyles.day, !isDraft && eventStyles.onDark]}>{date.day}</Text>}
      </View>
      <View style={eventStyles.rowText}>
        <Text style={eventStyles.rowTitle}>{tournament.name}</Text>
        {!!subtitle(tournament) && <Text style={eventStyles.muted}>{subtitle(tournament)}</Text>}
        {maxTeams > 0 && (
          <Text style={eventStyles.teams}>{copy.teams(tournament.registeredTeams, maxTeams)}</Text>
        )}
        <View style={[eventStyles.status, !isDraft && eventStyles.statusOn]}>
          <Text style={eventStyles.statusText}>{isDraft ? copy.draft : copy.published}</Text>
        </View>
      </View>
      {isDraft && <Ionicons name="chevron-forward" size={20} color={GREEN} />}
    </>
  );
}
