// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii } from "@/constants/rallyTheme";
import type { SearchFonts } from "@/lib/search-fonts";
import type { Tournament } from "@/lib/tournaments";
import { searchCopy as copy } from "@/translations/search.en";

type Props = {
  tournament: Tournament;
  fonts: SearchFonts;
  onRegister: (tournament: Tournament) => void;
};

function getDateParts(value?: string | null) {
  if (!value) return undefined;
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return undefined;
  return {
    day: date.toLocaleDateString(undefined, { weekday: "short" }),
    month: date.toLocaleDateString(undefined, { month: "short" }),
    date: date.getDate(),
  };
}

function display(value?: string | number | null) {
  return value === undefined || value === null || value === "" ? copy.detailsToBeAnnounced : value;
}

export function TournamentCard({ tournament, fonts, onRegister }: Props) {
  const dateParts = getDateParts(tournament.date);
  const full = typeof tournament.spotsLeft === "number" && tournament.spotsLeft <= 0;
  const availableSpots =
    typeof tournament.spotsLeft === "number" &&
    typeof tournament.spotsTotal === "number" &&
    tournament.spotsTotal > 0
      ? {
          left: Math.max(0, Math.min(tournament.spotsLeft, tournament.spotsTotal)),
          total: tournament.spotsTotal,
        }
      : undefined;
  const progress = availableSpots ? availableSpots.left / availableSpots.total : 0;
  const price =
    typeof tournament.pricePerTeam === "number"
      ? `$${tournament.pricePerTeam} ${copy.perTeam}`
      : copy.priceToBeAnnounced;

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View
          style={styles.dateBlock}
          accessibilityLabel={
            dateParts
              ? `${dateParts.day}, ${dateParts.month} ${dateParts.date}`
              : copy.dateToBeAnnounced
          }
        >
          <Text style={[styles.dateDay, { fontFamily: fonts.medium }]}>
            {dateParts?.day ?? copy.dateToBeAnnounced}
          </Text>
          {dateParts && (
            <>
              <Text style={[styles.dateMonth, { fontFamily: fonts.semibold }]}>
                {dateParts.month}
              </Text>
              <Text style={[styles.dateNumber, { fontFamily: fonts.semibold }]}>
                {dateParts.date}
              </Text>
            </>
          )}
        </View>
        <View style={styles.details}>
          <Text style={[styles.name, { fontFamily: fonts.semibold }]}>
            {display(tournament.name)}
          </Text>
          <Text style={[styles.meta, { fontFamily: fonts.regular }]}>
            {display(tournament.startTime)} – {display(tournament.endTime)}
          </Text>
          <Text style={[styles.meta, { fontFamily: fonts.regular }]}>
            {display(tournament.venue)}
          </Text>
        </View>
      </View>

      <View style={styles.tags}>
        <Text style={[styles.tag, { fontFamily: fonts.medium }]}>{display(tournament.format)}</Text>
        <Text style={[styles.tag, { fontFamily: fonts.medium }]}>{display(tournament.level)}</Text>
      </View>

      <View style={styles.bottom}>
        <View style={styles.availability}>
          <View style={styles.availabilityHeader}>
            <Text style={[styles.spots, { fontFamily: fonts.medium }]}>
              {availableSpots
                ? copy.spotsLeft(availableSpots.left, availableSpots.total)
                : copy.spotsUnavailable}
            </Text>
            <Text style={[styles.price, { fontFamily: fonts.semibold }]}>{price}</Text>
          </View>
          {availableSpots && (
            <View
              style={styles.progressTrack}
              accessibilityRole="progressbar"
              accessibilityLabel={copy.spotsProgress(availableSpots.left, availableSpots.total)}
              accessibilityValue={{
                min: 0,
                max: availableSpots.total,
                now: availableSpots.left,
              }}
            >
              <View style={[styles.progress, { width: `${progress * 100}%` }]} />
            </View>
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: full }}
          disabled={full}
          onPress={() => onRegister(tournament)}
          style={({ pressed }) => [
            styles.register,
            full && styles.registerDisabled,
            pressed && !full && styles.pressed,
          ]}
        >
          <Text
            style={[
              styles.registerText,
              { fontFamily: fonts.semibold },
              full && styles.disabledText,
            ]}
          >
            {full ? copy.full : copy.register}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radii.card,
    padding: 14,
    gap: 12,
  },
  top: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  dateBlock: {
    width: 56,
    minHeight: 65,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  dateDay: { color: colors.lime, fontSize: 10, textTransform: "uppercase" },
  dateMonth: { color: colors.white, fontSize: 12, textTransform: "uppercase" },
  dateNumber: { color: colors.white, fontSize: 19, lineHeight: 22 },
  details: { flex: 1, minWidth: 0, gap: 4 },
  name: { color: colors.textPrimary, fontSize: 15, lineHeight: 20, flexShrink: 1 },
  meta: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingLeft: 68 },
  tag: {
    color: colors.forest,
    backgroundColor: "#E8EEDC",
    borderRadius: radii.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 11,
    overflow: "hidden",
  },
  bottom: { flexDirection: "row", alignItems: "center", gap: 12 },
  availability: { flex: 1, minWidth: 0, gap: 7 },
  availabilityHeader: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    justifyContent: "space-between",
  },
  spots: { color: colors.textMuted, fontSize: 11, flexShrink: 1 },
  price: { color: colors.forest, fontSize: 12 },
  progressTrack: {
    height: 6,
    borderRadius: radii.pill,
    backgroundColor: "#DADDD4",
    overflow: "hidden",
  },
  progress: { height: "100%", borderRadius: radii.pill, backgroundColor: colors.seam },
  register: {
    minHeight: 40,
    minWidth: 96,
    paddingHorizontal: 14,
    borderRadius: radii.button,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  registerDisabled: { backgroundColor: "#E2E2DE" },
  registerText: { color: colors.white, fontSize: 12 },
  disabledText: { color: colors.textMuted },
  pressed: { opacity: 0.8 },
});
