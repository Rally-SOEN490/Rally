// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { styles } from "./styles";

export function DialogCard({
  icon,
  title,
  message,
  danger,
  children,
}: {
  icon: ReactNode;
  title: string;
  message: string;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <View style={[styles.modalIcon, danger && styles.modalIconDanger]}>{icon}</View>
      <Text style={styles.modalTitle}>{title}</Text>
      <Text style={styles.modalMessage}>{message}</Text>
      {children}
    </>
  );
}

export function DialogActions({
  onCancel,
  confirmLabel,
  onConfirm,
  disabled,
  danger,
}: {
  onCancel?: () => void;
  confirmLabel: string;
  onConfirm: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <View style={styles.modalActions}>
      {onCancel && (
        <Pressable accessibilityRole="button" onPress={onCancel} style={styles.modalCancel}>
          <Text style={styles.modalCancelText}>Cancel</Text>
        </Pressable>
      )}
      <Pressable
        accessibilityRole="button"
        onPress={onConfirm}
        disabled={disabled}
        style={[
          styles.modalConfirm,
          danger && styles.modalConfirmDanger,
          disabled && styles.disabled,
        ]}
      >
        <Text style={styles.modalConfirmText}>{confirmLabel}</Text>
      </Pressable>
    </View>
  );
}
