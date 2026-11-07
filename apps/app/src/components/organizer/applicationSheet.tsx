// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Ionicons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useSession } from "@/lib/session";
import { organizerCopy } from "@/translations/organizer.en";
import { ApplicationForm } from "./applicationForm";
import { ApplicationStatus } from "./applicationStatus";
import { GREEN, styles } from "./styles";
import { useOrganizerRequest } from "./useOrganizerRequest";

const copy = organizerCopy.sheet;

// The "Become an organizer" sheet from Settings. Its content mounts each time it
// opens, so it always shows the latest answer.
export function OrganizerApplicationSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <SheetContent onClose={onClose} />
    </Modal>
  );
}

function SheetContent({ onClose }: { onClose: () => void }) {
  const { reloadAccount } = useSession();
  const request = useOrganizerRequest();
  const { loaded } = request;
  const approved = loaded.kind === "ready" && loaded.application?.status === "APPROVED";
  // After an approval, reload the account so organizer tools appear without restarting.
  const close = () => {
    if (approved) reloadAccount();
    onClose();
  };

  // The backdrop sits behind the sheet, not around it. Around it, a click in the
  // sheet (even in a text box) reached the backdrop on the web and closed the sheet.
  return (
    <View style={styles.overlay}>
      <Pressable testID="organizer-sheet-backdrop" style={styles.backdrop} onPress={close} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View testID="organizer-sheet" style={styles.sheet}>
          <View style={styles.grabber} />
          <View style={styles.header}>
            <Text style={styles.title} accessibilityRole="header">
              {copy.title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.close}
              onPress={close}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={20} color={GREEN} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled">
            <SheetBody request={request} onDone={close} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function SheetBody({
  request,
  onDone,
}: {
  request: ReturnType<typeof useOrganizerRequest>;
  onDone: () => void;
}) {
  const { loaded } = request;
  if (loaded.kind === "loading")
    return (
      <View style={styles.center}>
        <ActivityIndicator color={GREEN} />
        <Text style={styles.muted}>{copy.loading}</Text>
      </View>
    );
  if (loaded.kind === "failed")
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{loaded.message}</Text>
        <SecondaryButton label={copy.retry} onPress={request.retry} />
      </View>
    );
  const { application } = loaded;
  if (!application || request.editing) return <RequestForm request={request} />;
  const canApplyAgain = application.status === "DENIED" || application.status === "EXPIRED";
  return (
    <View>
      <ApplicationStatus application={application} />
      {canApplyAgain ? (
        <SecondaryButton label={copy.sendAgain} onPress={() => request.startOver(application)} />
      ) : (
        <SecondaryButton label={copy.done} onPress={onDone} />
      )}
    </View>
  );
}

function RequestForm({ request }: { request: ReturnType<typeof useOrganizerRequest> }) {
  return (
    <View>
      <Text style={styles.body}>{copy.intro}</Text>
      <ApplicationForm
        draft={request.draft}
        onChange={request.setDraft}
        error={request.error}
        sending={request.sending}
        onSubmit={request.submit}
      />
    </View>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.secondaryButton}>
      <Text style={styles.secondaryButtonText}>{label}</Text>
    </Pressable>
  );
}
