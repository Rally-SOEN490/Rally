// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { RallyPlayer } from "@/lib/api";
import type { SearchFonts } from "@/lib/search-fonts";
import { PlayerCard } from "@/components/playerCard";
import { searchCopy as copy } from "@/translations/search.en";

type Props = {
  players: RallyPlayer[];
  query: string;
  loading: boolean;
  error?: string;
  retry: () => void;
  clearSearch: () => void;
  fonts: SearchFonts;
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
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={styles.button}
        >
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
}: Props) {
  const normalized = query.trim().toLocaleLowerCase();
  const visible = players.filter((player) =>
    player.displayName.toLocaleLowerCase().includes(normalized),
  );
  if (loading) return <Message title={copy.loading} loading />;
  if (error)
    return <Message title={error} action={copy.retry} onAction={retry} />;
  if (players.length === 0)
    return <Message title={copy.empty} detail={copy.emptyDetail} />;
  if (visible.length === 0)
    return (
      <Message
        title={copy.noMatches}
        detail={copy.noMatchesDetail}
        action={copy.clearSearch}
        onAction={clearSearch}
      />
    );
  return (
    <View style={styles.list}>
      {visible.map((player) => (
        <PlayerCard key={player.id} player={player} fonts={fonts} />
      ))}
      <Text style={[styles.availability, { fontFamily: fonts.regular }]}>
        {copy.actionsUnavailable}
      </Text>
    </View>
  );
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
