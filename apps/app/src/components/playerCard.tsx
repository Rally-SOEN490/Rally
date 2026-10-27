// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Image } from "expo-image";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import type { RallyPlayer } from "@/lib/api";
import type { SearchFonts } from "@/lib/search-fonts";
import { searchCopy as copy } from "@/translations/search.en";

// Presentation contract only. Preference/statistics owners can supply these when their APIs exist.
export type PlayerCardData = Pick<
  RallyPlayer,
  "id" | "displayName" | "lookingForTeam"
> & {
  level?: string | null;
  positions?: readonly string[];
  formats?: readonly string[];
  stats?: {
    matches?: number | null;
    wins?: number | null;
    events?: number | null;
  };
};
type Props = {
  player: PlayerCardData;
  fonts?: SearchFonts;
  onViewProfile?: (id: string) => void;
  onInvite?: (id: string) => void;
};
const icons = {
  matches: require("@/assets/images/player-card/match.svg"),
  wins: require("@/assets/images/player-card/wins.svg"),
  events: require("@/assets/images/player-card/events.svg"),
};
const initials = (name: string) => {
  const parts = name.trim().split(/\s+/u).filter(Boolean);
  const selected =
    parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;
  return (
    selected
      .map((part) => Array.from(part)[0])
      .join("")
      .toLocaleUpperCase() || "?"
  );
};

function PlayerHeader({ player, fonts = {} }: Props) {
  const name = player.displayName.trim() || copy.player;
  return (
    <View style={styles.header}>
      <View style={styles.avatar} accessible={false}>
        <Text style={[styles.initials, { fontFamily: fonts.semibold }]}>
          {initials(player.displayName)}
        </Text>
      </View>
      <View style={styles.identity}>
        <Text
          style={[styles.name, { fontFamily: fonts.semibold }]}
          numberOfLines={1}
          accessibilityLabel={name}
        >
          {name}
        </Text>
        <View style={styles.metadata}>
          <View style={styles.level}>
            <Text
              style={[styles.pillText, { fontFamily: fonts.semibold }]}
              accessibilityLabel={player.level || copy.unknown}
            >
              {player.level || "—"}
            </Text>
          </View>
          <View style={styles.position}>
            <Text
              style={[styles.pillText, { fontFamily: fonts.semibold }]}
              numberOfLines={1}
            >
              {player.positions?.join(" / ") || copy.positionsNotSet}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function FormatChips({
  player,
  fonts = {},
  onMore,
}: Props & { onMore: () => void }) {
  const formats = player.formats ?? [];
  return (
    <View style={styles.formats}>
      {formats.slice(0, 3).map((format, index) => (
        <View key={format} style={styles.format}>
          <View
            style={[
              styles.dot,
              { backgroundColor: ["#e3aecf", "#985365", "#913d96"][index] },
            ]}
          />
          <Text
            style={[styles.pillText, { fontFamily: fonts.semibold }]}
            numberOfLines={1}
          >
            {format}
          </Text>
        </View>
      ))}
      {formats.length > 3 && (
        <Pressable
          style={styles.overflow}
          onPress={onMore}
          accessibilityRole="button"
          accessibilityLabel={copy.moreFormats}
          hitSlop={6}
        >
          <Text style={styles.pillText}>+{formats.length - 3}</Text>
        </Pressable>
      )}
      {formats.length === 0 && (
        <Text style={[styles.unset, { fontFamily: fonts.regular }]}>
          {copy.preferencesNotSet}
        </Text>
      )}
      {player.lookingForTeam && (
        <Text style={[styles.availability, { fontFamily: fonts.medium }]}>
          {copy.lookingForTeam}
        </Text>
      )}
    </View>
  );
}

function PlayerMetrics({ player, fonts = {} }: Props) {
  return (
    <View style={styles.metrics}>
      {(["matches", "wins", "events"] as const).map((key) => {
        const value = player.stats?.[key];
        const known =
          typeof value === "number" && Number.isInteger(value) && value >= 0;
        return (
          <View
            key={key}
            style={styles.metric}
            accessible
            accessibilityLabel={`${copy[key]}: ${known ? value : copy.unknown}`}
          >
            <View style={styles.metricValue}>
              <Image
                source={icons[key]}
                style={styles.metricIcon}
                contentFit="contain"
              />
              <Text style={[styles.count, { fontFamily: fonts.semibold }]}>
                {known ? value : "—"}
              </Text>
            </View>
            <Text style={[styles.metricLabel, { fontFamily: fonts.regular }]}>
              {copy[key]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function CardActions({ player, fonts = {}, onViewProfile, onInvite }: Props) {
  return (
    <View style={styles.actions}>
      <Pressable
        style={[styles.profileButton, !onViewProfile && styles.disabled]}
        disabled={!onViewProfile}
        onPress={() => onViewProfile?.(player.id)}
        accessibilityRole="button"
        accessibilityLabel={`${copy.viewProfile}: ${player.displayName}`}
        accessibilityHint={!onViewProfile ? copy.profileHint : undefined}
        accessibilityState={{ disabled: !onViewProfile }}
        hitSlop={{ top: 6, bottom: 6 }}
      >
        <Image
          source={require("@/assets/images/player-card/profile-button.svg")}
          style={styles.profileBackground}
          contentFit="contain"
        />
        <Text style={[styles.actionLabel, { fontFamily: fonts.semibold }]}>
          {copy.viewProfile}
        </Text>
      </Pressable>
      <Pressable
        style={[styles.inviteButton, !onInvite && styles.disabled]}
        disabled={!onInvite}
        onPress={() => onInvite?.(player.id)}
        accessibilityRole="button"
        accessibilityLabel={`${copy.invite}: ${player.displayName}`}
        accessibilityHint={!onInvite ? copy.inviteHint : undefined}
        accessibilityState={{ disabled: !onInvite }}
        hitSlop={{ top: 6, bottom: 6 }}
      >
        <Image
          source={require("@/assets/images/player-card/invite-button.svg")}
          style={styles.inviteBackground}
          contentFit="contain"
        />
        <Image
          source={require("@/assets/images/player-card/invite.svg")}
          style={styles.inviteIcon}
          contentFit="contain"
        />
        <Text
          style={[
            styles.actionLabel,
            styles.inviteLabel,
            { fontFamily: fonts.medium },
          ]}
        >
          {copy.invite}
        </Text>
      </Pressable>
    </View>
  );
}

function FormatDialog({
  formats,
  visible,
  close,
}: {
  formats: readonly string[];
  visible: boolean;
  close: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}
    >
      <View style={styles.backdrop}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <Text style={styles.dialogTitle} accessibilityRole="header">
            {copy.formats}
          </Text>
          {formats.map((format) => (
            <Text key={format} style={styles.dialogFormat}>
              {format}
            </Text>
          ))}
          <Pressable
            onPress={close}
            style={styles.close}
            accessibilityRole="button"
          >
            <Text>{copy.close}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function PlayerCard(props: Props) {
  const [formatsOpen, setFormatsOpen] = useState(false);
  return (
    <View style={styles.card}>
      <PlayerHeader {...props} />
      <FormatChips {...props} onMore={() => setFormatsOpen(true)} />
      <View style={styles.footer}>
        <PlayerMetrics {...props} />
        <CardActions {...props} />
      </View>
      <FormatDialog
        formats={props.player.formats ?? []}
        visible={formatsOpen}
        close={() => setFormatsOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderColor: "#d4d4d4",
    borderWidth: 1,
    borderRadius: 15,
    padding: 12,
    minHeight: 161,
    gap: 8,
  },
  header: { flexDirection: "row", gap: 13, alignItems: "center" },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#24402f",
    alignItems: "center",
    justifyContent: "center",
  },
  initials: { fontSize: 24, fontWeight: "600", color: "#ffffff" },
  identity: { flex: 1, gap: 5, minWidth: 0 },
  name: { fontSize: 14, lineHeight: 21, fontWeight: "600", color: "#000000" },
  metadata: { flexDirection: "row", gap: 6, alignItems: "center" },
  level: {
    minWidth: 34,
    minHeight: 29,
    borderRadius: 15,
    backgroundColor: "#d9ec7a",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  position: {
    borderWidth: 1,
    borderColor: "#cacaca",
    borderRadius: 15,
    minHeight: 28,
    paddingHorizontal: 12,
    justifyContent: "center",
    maxWidth: "80%",
  },
  pillText: {
    fontSize: 10,
    lineHeight: 14,
    color: "#000000",
    fontWeight: "600",
  },
  formats: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    minHeight: 25,
  },
  format: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    minHeight: 25,
    paddingHorizontal: 9,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#d5d5d5",
    maxWidth: "42%",
  },
  dot: { width: 9, height: 9, borderRadius: 5 },
  overflow: {
    paddingHorizontal: 8,
    minHeight: 25,
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d5d5d5",
    borderRadius: 15,
  },
  unset: { fontSize: 10, color: "#666666" },
  availability: {
    fontSize: 10,
    color: "#24402f",
    backgroundColor: "#e8efd9",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 8,
  },
  metrics: {
    width: 116,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metric: { alignItems: "center", gap: 2 },
  metricValue: { flexDirection: "row", gap: 3, alignItems: "center" },
  metricIcon: { width: 14, height: 14 },
  count: { fontSize: 12, color: "#000000", fontWeight: "600" },
  metricLabel: { fontSize: 8, color: "#666666" },
  actions: { flexDirection: "row", gap: 5, alignItems: "center" },
  profileButton: {
    width: 100,
    minHeight: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  inviteButton: {
    width: 93,
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  profileBackground: { position: "absolute", width: 100, height: 30.716 },
  inviteBackground: { position: "absolute", width: 93, height: 30.716 },
  inviteIcon: { width: 16.306, height: 16.306 },
  actionLabel: { fontSize: 12, fontWeight: "600", color: "#000000" },
  inviteLabel: { color: "#ffffff" },
  disabled: { opacity: 0.5 },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 28,
  },
  dialog: {
    backgroundColor: "#ffffff",
    borderRadius: 15,
    padding: 20,
    gap: 12,
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
  },
  dialogTitle: { fontSize: 18, fontWeight: "600", color: "#24402f" },
  dialogFormat: { fontSize: 14, color: "#24402f" },
  close: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8efd9",
    borderRadius: 10,
  },
});
