// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, TextInput, View } from "react-native";
import { DESCRIPTION_MAX_LENGTH } from "@/lib/organizer-applications";
import { organizerCopy } from "@/translations/organizer.en";
import { MUTED, styles } from "./styles";

const copy = organizerCopy.sheet;

export type ApplicationDraft = { description: string; link: string };

// The request form. The parent keeps the text, so a failed send never loses it.
export function ApplicationForm({
  draft,
  onChange,
  error,
  sending,
  onSubmit,
}: {
  draft: ApplicationDraft;
  onChange: (draft: ApplicationDraft) => void;
  error: string;
  sending: boolean;
  onSubmit: () => void;
}) {
  return (
    <View>
      <Text style={styles.label}>{copy.descriptionLabel}</Text>
      <TextInput
        accessibilityLabel={copy.descriptionLabel}
        value={draft.description}
        onChangeText={(description) => onChange({ ...draft, description })}
        placeholder={copy.descriptionPlaceholder}
        maxLength={DESCRIPTION_MAX_LENGTH}
        multiline
        style={[styles.input, styles.multiline]}
      />
      <Text style={styles.label}>{copy.linkLabel}</Text>
      <TextInput
        accessibilityLabel={copy.linkLabel}
        value={draft.link}
        onChangeText={(link) => onChange({ ...draft, link })}
        placeholder={copy.linkPlaceholder}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        style={styles.input}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
      <SendButton
        sending={sending}
        disabled={sending || !draft.description.trim()}
        onPress={onSubmit}
      />
    </View>
  );
}

function SendButton({
  sending,
  disabled,
  onPress,
}: {
  sending: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <>
      <View style={styles.note}>
        <Ionicons name="notifications-outline" size={16} color={MUTED} />
        <Text style={styles.muted}>{copy.answerNote}</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={[styles.primaryButton, disabled && styles.disabled]}
      >
        <Text style={styles.primaryButtonText}>{sending ? copy.sending : copy.send}</Text>
      </Pressable>
    </>
  );
}
