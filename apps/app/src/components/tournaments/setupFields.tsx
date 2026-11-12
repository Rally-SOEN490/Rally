// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, TextInput, View } from "react-native";
import { LIMITS } from "@/lib/organizer-tournaments";
import { tournamentCopy } from "@/translations/tournaments.en";
import { DateTimeField } from "./dateTimeField";
import { GREEN, MUTED, styles } from "./styles";
import type { Moment, SetupFormState } from "./useSetupForm";

const copy = tournamentCopy.setup;

// Name, location and courts.
export function BasicsCard({ state }: { state: SetupFormState }) {
  const { form, change } = state;
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{copy.name}</Text>
      <TextInput
        accessibilityLabel={copy.name}
        value={form.name}
        onChangeText={(name) => change("name", name)}
        placeholder={copy.namePlaceholder}
        maxLength={LIMITS.nameMaxLength}
        style={styles.input}
      />
      <Text style={styles.label}>{copy.location}</Text>
      <TextInput
        accessibilityLabel={copy.location}
        value={form.location}
        onChangeText={(location) => change("location", location)}
        placeholder={copy.locationPlaceholder}
        maxLength={LIMITS.locationMaxLength}
        style={styles.input}
      />
      <Text style={styles.label}>{copy.courts}</Text>
      <Stepper
        value={form.courts}
        text={copy.courtsValue(form.courts)}
        min={LIMITS.minCourts}
        max={LIMITS.maxCourts}
        onChange={(courts) => change("courts", courts)}
        lessLabel={copy.fewerCourts}
        moreLabel={copy.moreCourts}
      />
    </View>
  );
}

// − value +. Starts empty; the first "+" sets the minimum.
export function Stepper({
  value,
  text,
  min,
  max,
  onChange,
  lessLabel,
  moreLabel,
}: {
  value: number | null;
  text: string;
  min: number;
  max: number;
  onChange: (value: number) => void;
  lessLabel: string;
  moreLabel: string;
}) {
  const canLess = value !== null && value > min;
  const canMore = value === null || value < max;
  return (
    <View style={styles.stepper}>
      <StepButton
        icon="remove"
        label={lessLabel}
        enabled={canLess}
        onPress={() => onChange(value! - 1)}
      />
      <Text style={styles.stepperValue}>{text}</Text>
      <StepButton
        icon="add"
        label={moreLabel}
        enabled={canMore}
        onPress={() => onChange(value === null ? min : value + 1)}
      />
    </View>
  );
}

function StepButton({
  icon,
  label,
  enabled,
  onPress,
}: {
  icon: "add" | "remove";
  label: string;
  enabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !enabled }}
      disabled={!enabled}
      onPress={onPress}
      style={[styles.stepperButton, !enabled && styles.disabled]}
    >
      <Ionicons name={icon} size={18} color={GREEN} />
    </Pressable>
  );
}

// Two date-and-time rows, e.g. Starts and Ends.
export function MomentsCard({
  state,
  moments,
}: {
  state: SetupFormState;
  moments: [Moment, string][];
}) {
  return (
    <View style={styles.card}>
      {moments.map(([moment, label]) => (
        <MomentRow key={moment} state={state} moment={moment} label={label} />
      ))}
    </View>
  );
}

function MomentRow({
  state,
  moment,
  label,
}: {
  state: SetupFormState;
  moment: Moment;
  label: string;
}) {
  const value = state.form[moment];
  const set = (part: "date" | "time", text: string | null) =>
    state.change(moment, text === null ? { date: null, time: null } : { ...value, [part]: text });
  return (
    <View style={styles.row}>
      <View style={styles.flex}>
        <Text style={styles.label}>{label}</Text>
        <DateTimeField
          mode="date"
          value={value.date}
          onChange={(date) => set("date", date)}
          accessibilityLabel={`${label} ${copy.date.toLowerCase()}`}
        />
      </View>
      <View style={styles.flex}>
        <Text style={styles.label}>{copy.time}</Text>
        <DateTimeField
          mode="time"
          value={value.time}
          onChange={(time) => set("time", time)}
          accessibilityLabel={`${label} ${copy.time.toLowerCase()}`}
        />
      </View>
    </View>
  );
}

// The free-form description, kept exactly as typed.
export function AboutCard({ state }: { state: SetupFormState }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{copy.description}</Text>
      <TextInput
        accessibilityLabel={copy.description}
        value={state.form.description}
        onChangeText={(description) => state.change("description", description)}
        placeholder={copy.descriptionPlaceholder}
        maxLength={LIMITS.descriptionMaxLength}
        multiline
        style={[styles.input, styles.multiline]}
      />
      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={16} color={MUTED} />
        <Text style={styles.noteText}>{copy.montrealTime}</Text>
      </View>
    </View>
  );
}
