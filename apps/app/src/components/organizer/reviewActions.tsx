// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Pressable, Text, TextInput, View } from "react-native";
import { REASON_MAX_LENGTH } from "@/lib/organizer-applications";
import { organizerCopy } from "@/translations/organizer.en";
import { styles } from "./styles";
import type { ApplicationReview } from "./useApplicationReview";

const copy = organizerCopy.review;

// Approve or deny. Both ask once more before sending, since the decision is final.
export function ReviewActions({ review, name }: { review: ApplicationReview; name: string }) {
  const { mode, setMode, deciding, error } = review;
  return (
    <View>
      {mode === "idle" && (
        <View style={styles.row}>
          <Button label={copy.deny} onPress={() => setMode("deny")} secondary />
          <Button label={copy.approve} onPress={() => setMode("confirmApprove")} />
        </View>
      )}
      {mode === "confirmApprove" && (
        <View>
          <Text style={styles.statusTitle}>{copy.confirmApproveTitle(name)}</Text>
          <Text style={styles.body}>{copy.confirmApproveMessage}</Text>
          <Confirm
            review={review}
            label={deciding ? copy.approving : copy.approve}
            onConfirm={() => review.decide("approve")}
          />
        </View>
      )}
      {mode === "deny" && <DenyForm review={review} />}
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

function DenyForm({ review }: { review: ApplicationReview }) {
  return (
    <View>
      <Text style={styles.label}>{copy.reasonLabel}</Text>
      <TextInput
        accessibilityLabel={copy.reasonLabel}
        value={review.reason}
        onChangeText={review.setReason}
        placeholder={copy.reasonPlaceholder}
        maxLength={REASON_MAX_LENGTH}
        multiline
        style={[styles.input, styles.multiline]}
      />
      <Confirm
        review={review}
        label={review.deciding ? copy.denying : copy.denyRequest}
        onConfirm={() => review.decide("deny")}
        danger
      />
    </View>
  );
}

function Confirm({
  review,
  label,
  onConfirm,
  danger,
}: {
  review: ApplicationReview;
  label: string;
  onConfirm: () => void;
  danger?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Button
        label={copy.cancel}
        onPress={() => review.setMode("idle")}
        disabled={review.deciding}
        secondary
      />
      <Button label={label} onPress={onConfirm} disabled={review.deciding} danger={danger} />
    </View>
  );
}

function Button({
  label,
  onPress,
  disabled,
  secondary,
  danger,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.flex,
        secondary ? styles.secondaryButton : styles.primaryButton,
        danger && styles.dangerButton,
        disabled && styles.disabled,
      ]}
    >
      <Text style={secondary ? styles.secondaryButtonText : styles.primaryButtonText}>{label}</Text>
    </Pressable>
  );
}
