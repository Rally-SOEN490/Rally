// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { sharedStyles } from "./styles";
import type { useProfilePhoto } from "./useProfilePhoto";

type PhotoActions = ReturnType<typeof useProfilePhoto>;

// Update, Remove and Cancel, plus any error from the last attempt.
function PhotoOptions({
  saving,
  error,
  choose,
  remove,
  onClose,
}: PhotoActions & { onClose: () => void }) {
  return (
    <View style={styles.photoActions}>
      <Text style={styles.photoActionsTitle}>Profile photo</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => void choose()}
        disabled={saving}
        style={styles.photoActionButton}
      >
        <Text style={styles.photoActionButtonText}>Update photo</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => void remove()}
        disabled={saving}
        style={styles.removePhotoButton}
      >
        <Text style={styles.removePhotoButtonText}>{saving ? "Removing..." : "Remove photo"}</Text>
      </Pressable>
      {!!error && <Text style={sharedStyles.photoError}>{error}</Text>}
      <Pressable
        accessibilityRole="button"
        onPress={onClose}
        disabled={saving}
        style={styles.cancelPhotoAction}
      >
        <Text style={styles.cancelPhotoActionText}>Cancel</Text>
      </Pressable>
    </View>
  );
}

// The options shown when the player already has a profile photo.
export function PhotoActionsModal(photo: PhotoActions) {
  const close = () => photo.setActionsVisible(false);
  return (
    <Modal visible={photo.actionsVisible} transparent animationType="fade" onRequestClose={close}>
      <View style={sharedStyles.modalBackdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close profile photo options"
          onPress={close}
          style={StyleSheet.absoluteFill}
        />
        <PhotoOptions {...photo} onClose={close} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  photoActions: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#f7f4f1",
    borderRadius: 18,
    padding: 20,
  },
  photoActionsTitle: {
    color: "#12382d",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 12,
  },
  photoActionButton: {
    backgroundColor: "#12382d",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  photoActionButtonText: {
    color: "#f7f4f1",
    fontWeight: "700",
  },
  removePhotoButton: {
    backgroundColor: "#fbe9e7",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 8,
  },
  removePhotoButtonText: {
    color: "#a12f25",
    fontWeight: "700",
  },
  cancelPhotoAction: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 4,
  },
  cancelPhotoActionText: {
    color: "#536761",
    fontWeight: "700",
  },
});
