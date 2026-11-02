// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type { RallyPlayer } from "@/lib/api";
import type { SearchFonts } from "@/lib/search-fonts";
import { PlayerCard } from "@/components/playerCard";
import { searchCopy as copy } from "@/translations/search.en";
import { playerFilterCopy } from "@/translations/player-filters.en";
import { emptyPlayerFilters, filterPlayers } from "@/lib/player-filters";
import type { PlayerFilters, PlayerSort } from "@/lib/player-filters";
import { COMPETITION_TYPES, PLAYER_POSITIONS, PROFILE_FORMATS } from "@/lib/player-preferences";
import type { SavedInterests } from "@/lib/player-preferences";

type Props = {
  players: RallyPlayer[];
  query: string;
  loading: boolean;
  error?: string;
  retry: () => void;
  clearSearch: () => void;
  fonts: SearchFonts;
  filters?: PlayerFilters;
  sort?: PlayerSort;
  viewerInterests?: SavedInterests;
};

function Message({
  title,
  detail,
  action,
  onAction,
  loading,
}: {
  title: string;
  detail?: string;
  action?: string;
  onAction?: () => void;
  loading?: boolean;
}) {
  return (
    <View style={styles.message} accessibilityLiveRegion="polite">
      {loading && <ActivityIndicator color="#24402f" />}
      <Text style={styles.title}>{title}</Text>
      {detail && <Text style={styles.detail}>{detail}</Text>}
      {action && (
        <Pressable accessibilityRole="button" onPress={onAction} style={styles.button}>
          <Text style={styles.buttonText}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function PlayerDirectory({
  players,
  query,
  loading,
  error,
  retry,
  clearSearch,
  fonts,
  filters = emptyPlayerFilters(),
  sort = "recommended",
  viewerInterests,
}: Props) {
  const visible = filterPlayers(players, query, filters, sort, viewerInterests);
  if (loading) return <Message title={copy.loading} loading />;
  if (error) return <Message title={error} action={copy.retry} onAction={retry} />;
  if (players.length === 0) return <Message title={copy.empty} detail={copy.emptyDetail} />;
  if (visible.length === 0)
    return (
      <Message
        title={copy.noMatches}
        detail={playerFilterCopy.noMatchesDetail}
        action={copy.clearSearch}
        onAction={clearSearch}
      />
    );
  return (
    <View style={styles.list} accessibilityLabel={playerFilterCopy.matchingPlayers(visible.length)}>
      {visible.map((player) => (
        <PlayerCard
          key={player.id}
          player={cardData(player)}
          fonts={fonts}
          highlightedFormat={
            PROFILE_FORMATS.find(
              (format) =>
                player.interests?.formats.includes(format.key) &&
                format.filters.some((tag) => filters.interests.includes(tag)),
            )?.label
          }
        />
      ))}
      <Text style={[styles.availability, { fontFamily: fonts.regular }]}>
        {copy.actionsUnavailable}
      </Text>
    </View>
  );
}

function cardData(player: RallyPlayer) {
  const formats = (player.interests?.formats ?? []).map(
    (key) => PROFILE_FORMATS.find((option) => option.key === key)?.label ?? key,
  );
  const types = (player.interests?.competitionTypes ?? []).map(
    (key) => COMPETITION_TYPES.find((option) => option.key === key)?.label ?? key,
  );
  return {
    ...player,
    level: player.skillLevel,
    positions: (player.interests?.positions ?? []).map(
      (key) => PLAYER_POSITIONS.find((option) => option.key === key)?.label ?? key,
    ),
    formats: [...formats, ...types],
  };
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  message: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    gap: 12,
    alignItems: "center",
  },
  title: {
    color: "#24402f",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  detail: { color: "#666666", fontSize: 13, textAlign: "center" },
  button: {
    backgroundColor: "#24402f",
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    justifyContent: "center",
  },
  buttonText: { color: "#ffffff", fontSize: 13, fontWeight: "600" },
  availability: {
    color: "#666666",
    fontSize: 11,
    textAlign: "center",
    paddingVertical: 8,
  },
});
