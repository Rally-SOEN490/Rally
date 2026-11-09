// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { colors } from "@/constants/rallyTheme";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { apiErrorMessage, updateMyAccount } from "@/lib/api";
import { PLAYER_LEVELS } from "@/lib/player-preferences";
import type { SkillLevel } from "@/lib/player-preferences";
import { useSession } from "@/lib/session";
import { playerFilterCopy as copy } from "@/translations/player-filters.en";

export function ProfileSkillLevel() {
  const { user, account, setAccount } = useSession();
  const [pending, setPending] = useState<SkillLevel | null>();
  const [error, setError] = useState("");
  const saving = pending !== undefined;
  const selected = saving ? pending : (account?.skillLevel ?? null);
  const save = async (value: SkillLevel | null) => {
    if (!user || saving) return;
    setError("");
    setPending(value);
    try {
      setAccount(await updateMyAccount(user, { skillLevel: value }));
    } catch (failure) {
      setError(apiErrorMessage(failure));
    } finally {
      setPending(undefined);
    }
  };
  return (
    <View style={styles.section}>
      <Text style={styles.title}>{copy.profileLevel}</Text>
      <Text style={styles.hint}>{copy.publicLevel}</Text>
      <Text style={styles.hint}>{copy.levelHint}</Text>
      <View style={styles.options}>
        {[...PLAYER_LEVELS, null].map((level) => (
          <Pressable
            key={level ?? "unset"}
            accessibilityRole="radio"
            accessibilityLabel={level ?? copy.unsetLevel}
            accessibilityState={{ checked: selected === level, disabled: saving }}
            disabled={saving}
            onPress={() => void save(level)}
            style={[styles.option, selected === level && styles.selected]}
          >
            <Text style={[styles.label, selected === level && styles.selectedLabel]}>
              {level ?? copy.unsetLevel}
            </Text>
          </Pressable>
        ))}
      </View>
      {error !== "" && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  section: { gap: 10, paddingBottom: 20 },
  title: { color: colors.forest, fontWeight: "700", fontSize: 18 },
  hint: { color: colors.textMuted, fontSize: 12 },
  options: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: {
    minHeight: 40,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  selected: { backgroundColor: colors.forest, borderColor: colors.forest },
  label: { fontSize: 13, color: colors.forest },
  selectedLabel: { color: colors.surface },
  error: { color: colors.textPrimary, fontSize: 12 },
});
