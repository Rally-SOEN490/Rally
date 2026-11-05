// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, TextInput, View } from "react-native";
import { DIVISION_TYPES, FORMATS, LEVELS, LIMITS, type Level } from "@/lib/organizer-tournaments";
import { tournamentCopy } from "@/translations/tournaments.en";
import { Stepper } from "./setupFields";
import { MUTED, styles } from "./styles";
import type { DivisionDraft, DivisionsState } from "./useDivisions";

const copy = tournamentCopy.divisions;

// The form for adding or editing one division.
export function DivisionEditor({
  state,
  draft,
  number,
}: {
  state: DivisionsState;
  draft: DivisionDraft;
  number: number;
}) {
  const toggleLevel = (level: Level) =>
    state.change({
      levels: draft.levels.includes(level)
        ? draft.levels.filter((chosen) => chosen !== level)
        : [...draft.levels, level],
    });
  return (
    <View style={styles.card}>
      <Text style={styles.stepLabel}>{copy.divisionNumber(number)}</Text>
      <Text style={styles.label}>{copy.format}</Text>
      <Segmented
        options={FORMATS.map((format) => [format, format])}
        selected={draft.format}
        onSelect={(format) => state.change({ format })}
      />
      <Text style={styles.label}>{copy.type}</Text>
      <Segmented
        options={DIVISION_TYPES.map((type) => [type, copy.types[type]])}
        selected={draft.type}
        onSelect={(type) => state.change({ type })}
      />
      <Text style={styles.label}>
        {copy.level} · {copy.levelHint}
      </Text>
      <View style={styles.chips}>
        {LEVELS.map((level) => (
          <Choice
            key={level}
            label={level}
            on={draft.levels.includes(level)}
            onPress={() => toggleLevel(level)}
          />
        ))}
      </View>
      <NameAndNumbers state={state} draft={draft} />
      <EditorButtons state={state} />
    </View>
  );
}

function NameAndNumbers({ state, draft }: { state: DivisionsState; draft: DivisionDraft }) {
  return (
    <>
      <Text style={styles.label}>{copy.name}</Text>
      <TextInput
        accessibilityLabel={copy.name}
        value={draft.name}
        onChangeText={(name) => state.change({ name, nameEdited: true })}
        maxLength={LIMITS.divisionNameMaxLength}
        style={styles.input}
      />
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text style={styles.label}>{copy.maxTeams}</Text>
          <Stepper
            value={draft.maxTeams}
            text={String(draft.maxTeams)}
            min={LIMITS.minTeams}
            max={LIMITS.maxTeams}
            onChange={(maxTeams) => state.change({ maxTeams })}
            lessLabel={copy.fewerTeams}
            moreLabel={copy.moreTeams}
          />
        </View>
        <View style={styles.flex}>
          <Text style={styles.label}>
            {copy.price} {copy.perTeam}
          </Text>
          <TextInput
            accessibilityLabel={copy.price}
            value={draft.price}
            onChangeText={(price) => state.change({ price })}
            placeholder={copy.pricePlaceholder}
            keyboardType="decimal-pad"
            style={styles.input}
          />
        </View>
      </View>
      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={16} color={MUTED} />
        <Text style={styles.noteText}>{copy.priceNote}</Text>
      </View>
    </>
  );
}

function EditorButtons({ state }: { state: DivisionsState }) {
  return (
    <View style={styles.footer}>
      <Pressable accessibilityRole="button" onPress={state.cancel} style={styles.secondaryButton}>
        <Text style={styles.secondaryText}>{copy.cancel}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: state.busy }}
        disabled={state.busy}
        onPress={state.saveDraft}
        style={[styles.primaryButton, state.busy && styles.disabled]}
      >
        <Text style={styles.primaryText}>
          {state.busy ? copy.savingDivision : copy.saveDivision}
        </Text>
      </Pressable>
    </View>
  );
}

function Segmented<T extends string>({
  options,
  selected,
  onSelect,
}: {
  options: [T, string][];
  selected: T;
  onSelect: (value: T) => void;
}) {
  return (
    <View style={styles.segmented} accessibilityRole="radiogroup">
      {options.map(([value, label]) => (
        <Pressable
          key={value}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === selected }}
          onPress={() => onSelect(value)}
          style={[styles.segment, value === selected && styles.segmentOn]}
        >
          <Text style={[styles.segmentText, value === selected && styles.segmentTextOn]}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function Choice({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: on }}
      onPress={onPress}
      style={[styles.chip, on && styles.chipOn]}
    >
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}
