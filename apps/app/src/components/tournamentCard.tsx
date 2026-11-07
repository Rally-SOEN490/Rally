// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radii } from "@/constants/rallyTheme";
import { dateParts, formatPrice, formatTime } from "@/lib/organizer-tournaments";
import type { SearchFonts } from "@/lib/search-fonts";
import { summarizeDivisions, type Tournament } from "@/lib/tournaments";
import { searchCopy as copy } from "@/translations/search.en";
import { tournamentCopy } from "@/translations/tournaments.en";

type Props = {
  tournament: Tournament;
  fonts: SearchFonts;
  onRegister: (tournament: Tournament) => void;
};

// The day, month and date of a Montreal time, without converting it to the
// phone's time zone: the date is read as written, then named in the phone's language.
function getDateParts(value: string | null) {
  if (!value) return undefined;
  const { year, day } = dateParts(value);
  const date = new Date(Date.UTC(year, Number(value.slice(5, 7)) - 1, day, 12));
  if (Number.isNaN(date.getTime())) return undefined;
  const name = (options: Intl.DateTimeFormatOptions) =>
    date.toLocaleDateString(undefined, { ...options, timeZone: "UTC" });
  return { day: name({ weekday: "short" }), month: name({ month: "short" }), date: day };
}

// "9:00 AM – 7:00 PM", or "9:00 AM – Nov 16, 7:00 PM" when it ends another day.
function timeRange(startsAt: string | null, endsAt: string | null) {
  if (!startsAt || !endsAt) return undefined;
  const start = formatTime(startsAt.slice(11, 16));
  const end = formatTime(endsAt.slice(11, 16));
  if (startsAt.slice(0, 10) === endsAt.slice(0, 10)) return copy.timeRange(start, end);
  const { month, day } = dateParts(endsAt);
  return copy.timeRange(start, copy.endsOtherDay(`${month} ${day}`, end));
}

// "$240 per team", "From $120.50 per team" when divisions cost different amounts, or "Free".
function priceLabel(lowest: number | undefined, highest: number | undefined) {
  if (lowest === undefined || highest === undefined) return copy.priceToBeAnnounced;
  if (highest === 0) return copy.free;
  const price = `${formatPrice(lowest)} ${copy.perTeam}`;
  return lowest === highest ? price : copy.priceFrom(price);
}

function display(value?: string | number | null) {
  return value === undefined || value === null || value === "" ? copy.detailsToBeAnnounced : value;
}

export function TournamentCard({ tournament, fonts, onRegister }: Props) {
  const startDate = getDateParts(tournament.startsAt);
  const summary = summarizeDivisions(tournament.divisions);
  const availableSpots =
    summary.spotsTotal > 0 ? { left: summary.spotsLeft, total: summary.spotsTotal } : undefined;
  const full = availableSpots !== undefined && availableSpots.left === 0;
  const progress = availableSpots ? availableSpots.left / availableSpots.total : 0;
  const price = priceLabel(summary.lowestPriceCents, summary.highestPriceCents);
  const tags = [
    ...summary.formatsAndTypes.map(
      ({ format, type }) => `${format} ${tournamentCopy.divisions.types[type]}`,
    ),
    ...(summary.levels.length > 0 ? [summary.levels.join(" / ")] : []),
  ];

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View
          style={styles.dateBlock}
          accessibilityLabel={
            startDate
              ? `${startDate.day}, ${startDate.month} ${startDate.date}`
              : copy.dateToBeAnnounced
          }
        >
          <Text style={[styles.dateDay, { fontFamily: fonts.medium }]}>
            {startDate?.day ?? copy.dateToBeAnnounced}
          </Text>
          {startDate && (
            <>
              <Text style={[styles.dateMonth, { fontFamily: fonts.semibold }]}>
                {startDate.month}
              </Text>
              <Text style={[styles.dateNumber, { fontFamily: fonts.semibold }]}>
                {startDate.date}
              </Text>
            </>
          )}
        </View>
        <View style={styles.details}>
          <Text style={[styles.name, { fontFamily: fonts.semibold }]}>
            {display(tournament.name)}
          </Text>
          <Text style={[styles.meta, { fontFamily: fonts.regular }]}>
            {display(timeRange(tournament.startsAt, tournament.endsAt))}
          </Text>
          <Text style={[styles.meta, { fontFamily: fonts.regular }]}>
            {display(tournament.location)}
          </Text>
        </View>
      </View>

      {tags.length > 0 && (
        <View style={styles.tags}>
          {tags.map((tag) => (
            <Text key={tag} style={[styles.tag, { fontFamily: fonts.medium }]}>
              {tag}
            </Text>
          ))}
        </View>
      )}

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
