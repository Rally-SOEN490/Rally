// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Image } from "expo-image";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import type { RallyPlayer } from "@/lib/api";
import type { SearchFonts } from "@/lib/search-fonts";
import { playerCardStyles as styles } from "./playerCard.styles";
import { searchCopy as copy } from "@/translations/search.en";

// Presentation contract only; unavailable API fields stay unknown.
export type PlayerCardData = Pick<RallyPlayer, "id" | "displayName" | "lookingForTeam"> & {
  level?: string | null;
  positions?: readonly string[];
  formats?: readonly string[];
  stats?: {
    matches?: number | null;
    wins?: number | null;
    topFour?: number | null;
    events?: number | null;
  };
};
type Props = {
  player: PlayerCardData;
  fonts?: SearchFonts;
  onViewProfile?: (id: string) => void;
  onMessage?: (id: string) => void;
  // Only highlight a supplied active preference; the directory has no active filters yet.
  highlightedFormat?: string;
};
const metrics = [
  {
    key: "matches",
    icon: require("@/assets/images/player-card/match.svg"),
    width: 14,
    height: 14,
  },
  {
    key: "wins",
    icon: require("@/assets/images/player-card/wins.svg"),
    width: 14,
    height: 12,
  },
  {
    key: "topFour",
    icon: require("@/assets/images/player-card/top-four.svg"),
    width: 12,
    height: 15,
  },
  {
    key: "events",
    icon: require("@/assets/images/player-card/events.svg"),
    width: 12,
    height: 14,
  },
] as const;
const dots = {
  format: {
    source: require("@/assets/images/player-card/format-dot.svg"),
    width: 9.4,
    height: 8,
  },
  position: {
    source: require("@/assets/images/player-card/position-dot.svg"),
    width: 8.41558,
    height: 8.8055,
  },
  level: {
    source: require("@/assets/images/player-card/level-dot.svg"),
    width: 9,
    height: 9.04639,
  },
  category: {
    source: require("@/assets/images/player-card/gender-dot.svg"),
    width: 7.83117,
    height: 8.04124,
  },
};
type Interest = { label: string; kind: keyof typeof dots; selected?: boolean };

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/u).filter(Boolean);
  const selected = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : parts;
  return (
    selected
      .map((part) => Array.from(part)[0])
      .join("")
      .toLocaleUpperCase() || "?"
  );
};

function PlayerMetrics({ player, fonts = {} }: Props) {
  return (
    <View style={styles.metrics}>
      {metrics.map(({ key, icon, width, height }) => {
        const value = player.stats?.[key];
        const known = typeof value === "number" && Number.isInteger(value) && value >= 0;
        return (
          <View
            key={key}
            style={styles.metric}
            accessible
            accessibilityLabel={`${copy[key]}: ${known ? value : copy.unknown}`}
          >
            <View style={styles.metricValue}>
              <Image source={icon} style={{ width, height }} contentFit="contain" />
              <Text style={[styles.count, { fontFamily: fonts.semibold }]}>
                {known ? value : "—"}
              </Text>
            </View>
            <Text style={[styles.metricLabel, { fontFamily: fonts.medium }]}>{copy[key]}</Text>
          </View>
        );
      })}
    </View>
  );
}

function PlayerHeader(props: Props) {
  const { player, fonts = {} } = props;
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
        <PlayerMetrics {...props} />
      </View>
    </View>
  );
}

function getInterests({ player, highlightedFormat }: Props): Interest[] {
  const formats = [...new Set(player.formats?.map((label) => label.trim()).filter(Boolean))];
  const positions = [...new Set(player.positions?.map((label) => label.trim()).filter(Boolean))];
  const first = formats[0];
  const level = player.level?.trim();
  return [
    ...(first
      ? [
          {
            label: first,
            kind: "format" as const,
            selected: first === highlightedFormat,
          },
        ]
      : []),
    ...positions.map((label) => ({ label, kind: "position" as const })),
    ...(level ? [{ label: level, kind: "level" as const }] : []),
    ...formats.slice(1).map((label) => ({ label, kind: "category" as const })),
  ];
}

function InterestChip({ interest, fonts }: { interest: Interest; fonts: SearchFonts }) {
  const dot = dots[interest.kind];
  return (
    <View style={[styles.chip, styles[interest.kind], interest.selected && styles.selectedChip]}>
      {interest.selected && (
        <Image
          source={require("@/assets/images/player-card/selected-interest.svg")}
          style={styles.selectedBackground}
          contentFit="contain"
        />
      )}
      <Image
        source={dot.source}
        style={{ width: dot.width, height: dot.height }}
        contentFit="contain"
      />
      <Text style={[styles.chipText, { fontFamily: fonts.semibold }]} numberOfLines={1}>
        {interest.label}
      </Text>
      {interest.selected && (
        <Image
          source={require("@/assets/images/player-card/check.svg")}
          style={styles.check}
          contentFit="contain"
        />
      )}
    </View>
  );
}

function MoreInterests({
  count,
  fonts,
  onPress,
}: {
  count: number;
  fonts: SearchFonts;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.more}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={copy.moreInterests}
      hitSlop={10}
    >
      <Text
        style={[styles.chipText, styles.moreText, { fontFamily: fonts.semibold }]}
        numberOfLines={1}
      >
        {copy.moreCount(count)}
      </Text>
      <Image
        source={require("@/assets/images/player-card/dropdown.svg")}
        style={styles.dropdown}
        contentFit="contain"
      />
    </Pressable>
  );
}

function Interests({
  interests,
  fonts = {},
  onMore,
}: {
  interests: Interest[];
  fonts?: SearchFonts;
  onMore: () => void;
}) {
  return (
    <View style={styles.interests}>
      <Text style={[styles.interestTitle, { fontFamily: fonts.semibold }]}>
        {copy.interestedIn}
      </Text>
      <View style={styles.chips}>
        {interests.slice(0, 4).map((interest) => (
          <InterestChip
            key={`${interest.kind}:${interest.label}`}
            interest={interest}
            fonts={fonts}
          />
        ))}
        {interests.length > 4 && (
          <MoreInterests count={interests.length - 4} fonts={fonts} onPress={onMore} />
        )}
        {interests.length === 0 && (
          <Text style={[styles.unset, { fontFamily: fonts.regular }]}>
            {copy.preferencesNotSet}
          </Text>
        )}
      </View>
    </View>
  );
}

type ActionProps = {
  label: string;
  name: string;
  hint: string;
  onPress?: () => void;
  message?: boolean;
  fonts: SearchFonts;
};

function CardAction({ label, name, hint, onPress, message, fonts }: ActionProps) {
  const intrinsicWidth = message ? 147 : 164;
  return (
    <Pressable
      style={[styles.action, { flexGrow: intrinsicWidth }]}
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${name}`}
      accessibilityHint={!onPress ? hint : undefined}
      accessibilityState={{ disabled: !onPress }}
      hitSlop={{ top: 6, bottom: 6 }}
    >
      <Image
        source={
          message
            ? require("@/assets/images/player-card/message-button.png")
            : require("@/assets/images/player-card/profile-button.png")
        }
        style={styles.actionBackground}
        contentFit="fill"
      />
      <Text
        style={[styles.actionLabel, message && styles.messageLabel, { fontFamily: fonts.semibold }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function CardActions({ player, fonts = {}, onViewProfile, onMessage }: Props) {
  const name = player.displayName.trim() || copy.player;
  return (
    <View style={styles.actions}>
      <CardAction
        label={copy.viewProfile}
        name={name}
        hint={copy.profileHint}
        onPress={onViewProfile ? () => onViewProfile(player.id) : undefined}
        fonts={fonts}
      />
      <CardAction
        label={copy.message}
        name={name}
        hint={copy.messageHint}
        onPress={onMessage ? () => onMessage(player.id) : undefined}
        fonts={fonts}
        message
      />
    </View>
  );
}

function InterestDialog({
  interests,
  visible,
  close,
  fonts = {},
}: {
  interests: Interest[];
  visible: boolean;
  close: () => void;
  fonts?: SearchFonts;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.dialog} accessibilityViewIsModal>
          <Text
            style={[styles.dialogTitle, { fontFamily: fonts.semibold }]}
            accessibilityRole="header"
          >
            {copy.interestedIn}
          </Text>
          <ScrollView style={{ maxHeight: 320 }} contentContainerStyle={{ gap: 12 }}>
            {interests.map(({ kind, label }) => (
              <Text
                key={`${kind}:${label}`}
                style={[styles.dialogInterest, { fontFamily: fonts.regular }]}
              >
                {label}
              </Text>
            ))}
          </ScrollView>
          <Pressable onPress={close} style={styles.close} accessibilityRole="button">
            <Text>{copy.close}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function PlayerCard(props: Props) {
  const [interestsOpen, setInterestsOpen] = useState(false);
  const interests = getInterests(props);
  return (
    <View style={styles.card}>
      <PlayerHeader {...props} />
      <Interests interests={interests} fonts={props.fonts} onMore={() => setInterestsOpen(true)} />
      {props.player.lookingForTeam && (
        <Text style={[styles.availability, { fontFamily: props.fonts?.medium }]}>
          {copy.lookingForTeam}
        </Text>
      )}
      <CardActions {...props} />
      <InterestDialog
        interests={interests}
        visible={interestsOpen}
        close={() => setInterestsOpen(false)}
        fonts={props.fonts}
      />
    </View>
  );
}
