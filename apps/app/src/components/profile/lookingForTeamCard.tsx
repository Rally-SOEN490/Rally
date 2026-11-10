// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { ActivityIndicator, StyleSheet, Switch, Text, View } from "react-native";
import { sharedStyles } from "./styles";
import type { useLookingForTeam } from "./useLookingForTeam";

// The card with the "Looking for a team" switch.
export function LookingForTeamCard({
  switchValue,
  saving,
  error,
  change,
}: ReturnType<typeof useLookingForTeam>) {
  return (
    <View style={styles.lookingCard}>
      <View style={styles.lookingRow}>
        <View style={styles.lookingTextStack}>
          <Text style={styles.lookingTitle}>Looking for a team</Text>
          <Text style={styles.lookingHint}>Captains will see a badge on your profile.</Text>
        </View>
        {saving && (
          <ActivityIndicator
            size="small"
            color="#1d5c4d"
            accessibilityLabel="Saving"
            style={styles.lookingSpinner}
          />
        )}
        <Switch
          value={switchValue}
          onValueChange={change}
          disabled={saving}
          accessibilityLabel="Looking for a team"
          accessibilityHint="Shows captains that you're available"
          accessibilityState={{ disabled: saving, busy: saving }}
          trackColor={{ false: "#d9d5d0", true: "#1d5c4d" }}
        />
      </View>
      {!!error && (
        <Text accessibilityRole="alert" style={sharedStyles.saveError}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  lookingCard: {
    backgroundColor: "#f2f0ed",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d9d5d0",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 20,
  },
  lookingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  lookingTextStack: {
    flex: 1,
    marginRight: 12,
  },
  lookingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#12382d",
  },
  lookingHint: {
    fontSize: 12,
    color: "#536761",
    marginTop: 2,
  },
  lookingSpinner: {
    marginRight: 8,
  },
});
