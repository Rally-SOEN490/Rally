// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Pressable, Text, View } from "react-native";
import { formatPrice, type Division } from "@/lib/organizer-tournaments";
import { tournamentCopy } from "@/translations/tournaments.en";
import { styles } from "./styles";
import type { DivisionsState } from "./useDivisions";

const copy = tournamentCopy.divisions;

// A saved division, with Edit and Remove. Remove asks once more first.
export function DivisionSummary({
  state,
  division,
  number,
}: {
  state: DivisionsState;
  division: Division;
  number: number;
}) {
  const confirming = state.removing === division.id;
  return (
    <View style={styles.card}>
      <Text style={styles.stepLabel}>{copy.divisionNumber(number)}</Text>
      <Text style={styles.stepperValue}>{division.name}</Text>
      <Text style={styles.noteText}>
        {copy.summary(
          division.format,
          copy.types[division.type],
          division.levels.join(", "),
          division.maxTeams,
          formatPrice(division.priceCents),
        )}
      </Text>
      {confirming ? (
        <View style={styles.row}>
          <Text style={[styles.noteText, styles.flex]}>{copy.confirmRemove(division.name)}</Text>
          <TextButton label={copy.cancel} onPress={() => state.askRemove(null)} />
          <TextButton label={copy.remove} danger onPress={() => state.remove(division.id)} />
        </View>
      ) : (
        <View style={styles.row}>
          <TextButton label={copy.edit} onPress={() => state.edit(division)} />
          <TextButton label={copy.remove} danger onPress={() => state.askRemove(division.id)} />
        </View>
      )}
    </View>
  );
}

function TextButton({
  label,
  onPress,
  danger,
}: {
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.textButton}>
      <Text style={danger ? styles.dangerText : styles.textButtonText}>{label}</Text>
    </Pressable>
  );
}
