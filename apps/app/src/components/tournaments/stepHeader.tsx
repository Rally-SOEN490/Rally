// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { tournamentCopy } from "@/translations/tournaments.en";
import { GREEN, styles } from "./styles";

const copy = tournamentCopy.steps;
const TOTAL_STEPS = 2;

// The top of each setup step: back, "Save draft", progress and the title.
export function StepHeader({
  step,
  stepName,
  title,
  onBack,
  onSaveDraft,
  saving,
}: {
  step: number;
  stepName: string;
  title: string;
  onBack: () => void;
  onSaveDraft: () => void;
  saving: boolean;
}) {
  return (
    <View>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.back}
          onPress={onBack}
          style={styles.roundButton}
        >
          <Ionicons name="chevron-back" size={22} color={GREEN} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: saving }}
          disabled={saving}
          onPress={onSaveDraft}
        >
          <Text style={styles.linkText}>{saving ? copy.saving : copy.saveDraft}</Text>
        </Pressable>
      </View>
      <View style={styles.progress}>
        {Array.from({ length: TOTAL_STEPS }, (_, index) => (
          <View key={index} style={[styles.progressBar, index < step && styles.progressDone]} />
        ))}
      </View>
      <Text style={styles.stepLabel}>{copy.stepOf(step, TOTAL_STEPS, stepName)}</Text>
      <Text style={styles.pageTitle} accessibilityRole="header">
        {title}
      </Text>
    </View>
  );
}
