// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { sharedStyles } from "./styles";
import type { useThoughtEditor } from "./useThoughtEditor";

type ThoughtEditor = ReturnType<typeof useThoughtEditor>;

function ThoughtEditorHeader({
  hasThought,
  onClose,
}: {
  hasThought: boolean;
  onClose: () => void;
}) {
  return (
    <View style={styles.thoughtEditorHeader}>
      <View style={styles.thoughtEditorIcon}>
        <Text style={styles.thoughtEditorIconText}>✦</Text>
      </View>
      <View style={styles.thoughtEditorHeading}>
        <Text style={styles.thoughtEditorTitle}>
          {hasThought ? "Edit your thought" : "Share a thought"}
        </Text>
        <Text style={styles.thoughtEditorHint}>This appears publicly on your profile.</Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close thought editor"
        onPress={onClose}
        style={styles.thoughtEditorClose}
      >
        <Text style={styles.thoughtEditorCloseText}>×</Text>
      </Pressable>
    </View>
  );
}

// Delete (only for an existing thought) and Share.
function ThoughtEditorActions({
  editor,
  hasThought,
}: {
  editor: ThoughtEditor;
  hasThought: boolean;
}) {
  return (
    <View style={styles.thoughtActions}>
      {hasThought && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete thought"
          disabled={editor.saving}
          onPress={editor.remove}
          style={styles.deleteThoughtButton}
        >
          <Text style={styles.deleteThoughtText}>Delete</Text>
        </Pressable>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Share thought"
        disabled={editor.saving}
        onPress={editor.save}
        style={styles.shareThoughtButton}
      >
        {editor.saving ? (
          <ActivityIndicator color="#f7f4f1" />
        ) : (
          <Text style={styles.shareThoughtText}>Share</Text>
        )}
      </Pressable>
    </View>
  );
}

// The popup for writing, editing or deleting the profile thought.
export function ThoughtEditorModal({
  editor,
  hasThought,
}: {
  editor: ThoughtEditor;
  hasThought: boolean;
}) {
  return (
    <Modal visible={editor.visible} transparent animationType="slide" onRequestClose={editor.close}>
      <View style={sharedStyles.modalBackdrop}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close thought editor backdrop"
          onPress={editor.close}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.thoughtEditor}>
          <ThoughtEditorHeader hasThought={hasThought} onClose={editor.close} />
          <Text style={styles.thoughtFieldLabel}>MESSAGE</Text>
          <TextInput
            accessibilityLabel="Thought"
            maxLength={180}
            multiline
            onChangeText={editor.setText}
            placeholder="Your thoughts go here..."
            placeholderTextColor="#8a9690"
            submitBehavior="newline"
            style={styles.thoughtInput}
            value={editor.text}
          />
          <Text style={styles.thoughtCharacterCount}>{editor.text.length}/180</Text>
          {!!editor.error && (
            <Text accessibilityRole="alert" style={sharedStyles.saveError}>
              {editor.error}
            </Text>
          )}
          <ThoughtEditorActions editor={editor} hasThought={hasThought} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  thoughtEditor: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#fbfaf8",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#071c15",
    shadowOpacity: 0.2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  thoughtEditorHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  thoughtEditorIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#dcebe4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  thoughtEditorIconText: {
    color: "#0b5544",
    fontSize: 18,
    fontWeight: "800",
  },
  thoughtEditorHeading: {
    flex: 1,
  },
  thoughtEditorClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#edf0ed",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  thoughtEditorCloseText: {
    color: "#536761",
    fontSize: 22,
    fontWeight: "400",
    lineHeight: 25,
  },
  thoughtEditorTitle: {
    color: "#12382d",
    fontSize: 21,
    fontWeight: "800",
  },
  thoughtEditorHint: {
    color: "#536761",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  thoughtFieldLabel: {
    color: "#789087",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  thoughtInput: {
    minHeight: 76,
    maxHeight: 92,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#d4dfd9",
    backgroundColor: "#ffffff",
    color: "#12382d",
    fontSize: 15,
    paddingHorizontal: 13,
    paddingVertical: 10,
    textAlignVertical: "top",
  },
  thoughtCharacterCount: {
    alignSelf: "flex-end",
    color: "#97a49e",
    fontSize: 11,
    marginTop: 4,
    marginBottom: 13,
  },
  thoughtActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
    marginTop: 0,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e7ebe8",
  },
  deleteThoughtButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  deleteThoughtText: {
    color: "#c24f4b",
    fontWeight: "700",
  },
  shareThoughtButton: {
    minWidth: 92,
    alignItems: "center",
    backgroundColor: "#12382d",
    borderRadius: 999,
    paddingHorizontal: 17,
    paddingVertical: 10,
    shadowColor: "#063e31",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  shareThoughtText: {
    color: "#f7f4f1",
    fontWeight: "700",
  },
});
