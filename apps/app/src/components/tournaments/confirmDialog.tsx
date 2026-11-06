// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { GREEN, RED } from "./styles";

// A "Are you sure?" pop-up. Alert.alert doesn't show on the web, so this is
// our own. The backdrop sits behind the card, not around it, so a click on
// the card never reaches it (see the organizer sheet fix).
export function ConfirmDialog({
  visible,
  title,
  message,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  danger,
  busy,
  error,
}: {
  visible: boolean;
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  danger?: boolean;
  busy?: boolean;
  error?: string;
}) {
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onCancel}>
      <View style={dialog.overlay}>
        <Pressable testID="confirm-backdrop" style={dialog.backdrop} onPress={onCancel} />
        <View testID="confirm-dialog" style={dialog.card} accessibilityViewIsModal>
          <Text style={dialog.title} accessibilityRole="header">
            {title}
          </Text>
          <Text style={dialog.message}>{message}</Text>
          {!!error && <Text style={dialog.error}>{error}</Text>}
          <DialogActions
            cancelLabel={cancelLabel}
            confirmLabel={confirmLabel}
            onCancel={onCancel}
            onConfirm={onConfirm}
            danger={danger}
            busy={busy}
          />
        </View>
      </View>
    </Modal>
  );
}

function DialogActions({
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  danger,
  busy,
}: {
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  danger?: boolean;
  busy?: boolean;
}) {
  return (
    <View style={dialog.actions}>
      <Pressable accessibilityRole="button" onPress={onCancel} style={dialog.cancel}>
        <Text style={dialog.cancelText}>{cancelLabel}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!busy }}
        disabled={busy}
        onPress={onConfirm}
        style={[dialog.confirm, danger && dialog.danger, busy && dialog.disabled]}
      >
        <Text style={dialog.confirmText}>{confirmLabel}</Text>
      </Pressable>
    </View>
  );
}

const dialog = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "center", padding: 24 },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(10, 20, 15, 0.45)",
  },
  card: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    gap: 10,
  },
  title: { fontSize: 20, fontWeight: "800", color: "#101b15" },
  message: { fontSize: 15, lineHeight: 21, color: "#3f4a44" },
  error: { color: RED, fontSize: 14 },
  actions: { flexDirection: "row", gap: 10, marginTop: 8 },
  cancel: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    borderWidth: 1,
    borderColor: GREEN,
  },
  cancelText: { color: GREEN, fontSize: 15, fontWeight: "700" },
  confirm: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    backgroundColor: GREEN,
  },
  danger: { backgroundColor: RED },
  disabled: { opacity: 0.5 },
  confirmText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
});
