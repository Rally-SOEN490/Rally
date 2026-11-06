// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { tournamentPaths, type OrganizerTournament } from "@/lib/organizer-tournaments";
import { tournamentCopy } from "@/translations/tournaments.en";
import { DivisionEditor } from "./divisionEditor";
import { DivisionSummary } from "./divisionSummary";
import { LoadTournament } from "./loadTournament";
import { goToEvents } from "./setupScreen";
import { StepHeader } from "./stepHeader";
import { GREEN, styles } from "./styles";
import { useDivisions, type DivisionsState } from "./useDivisions";
import { useLeaveConfirmation } from "./useLeaveConfirmation";

const copy = tournamentCopy.divisions;

// Step 2 of 2. Each division is saved on its own; "Create tournament" publishes.
export function DivisionsScreen({ id }: { id: string }) {
  return (
    <LoadTournament id={id}>
      {(tournament) => <DivisionsStep tournament={tournament} />}
    </LoadTournament>
  );
}

function DivisionsStep({ tournament }: { tournament: OrganizerTournament }) {
  const state = useDivisions(tournament);
  // Everything is already saved; only an open, unsaved division needs a decision.
  const leave = () => (state.draft ? state.setError(copy.finishEditing) : goToEvents());
  // Saved divisions are kept; only a division still open in the editor would be
  // lost, so the guard asks only then, however the screen is closed.
  const guard = useLeaveConfirmation(
    state.draft !== null,
    tournamentCopy.steps.leaveDivisionMessage,
  );
  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <StepHeader
            step={2}
            stepName={copy.stepName}
            title={copy.title}
            onBack={() => router.replace(tournamentPaths.setup(tournament.id))}
            onSaveDraft={leave}
            saving={state.busy}
          />
          <Text style={styles.intro}>{copy.intro}</Text>
          <DivisionList state={state} />
          {!!state.error && (
            <Text style={styles.error} accessibilityLiveRegion="polite">
              {state.error}
            </Text>
          )}
          <Footer
            state={state}
            onSaveDraft={leave}
            onPublished={() => guard.leaveWithoutAsking(goToEvents)}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      {guard.dialog}
    </SafeAreaView>
  );
}

function DivisionList({ state }: { state: DivisionsState }) {
  const { divisions } = state.tournament;
  const editingNew = state.draft !== null && state.draft.id === null;
  return (
    <>
      {divisions.length === 0 && !editingNew && <Text style={styles.noteText}>{copy.none}</Text>}
      {divisions.map((division, index) =>
        state.draft?.id === division.id ? (
          <DivisionEditor key={division.id} state={state} draft={state.draft} number={index + 1} />
        ) : (
          <DivisionSummary key={division.id} state={state} division={division} number={index + 1} />
        ),
      )}
      {editingNew ? (
        <DivisionEditor state={state} draft={state.draft!} number={divisions.length + 1} />
      ) : (
        !state.draft && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.add}
            onPress={() => state.edit()}
            style={styles.dashedButton}
          >
            <Ionicons name="add" size={18} color={GREEN} />
            <Text style={styles.dashedText}>{copy.add}</Text>
          </Pressable>
        )
      )}
    </>
  );
}

function Footer({
  state,
  onSaveDraft,
  onPublished,
}: {
  state: DivisionsState;
  onSaveDraft: () => void;
  onPublished: () => void;
}) {
  const canCreate = state.tournament.divisions.length > 0 && !state.busy;
  const create = async () => {
    if (await state.publish()) onPublished();
  };
  return (
    <>
      <Text style={styles.noteText}>{copy.createHint}</Text>
      <View style={styles.footer}>
        <Pressable accessibilityRole="button" onPress={onSaveDraft} style={styles.secondaryButton}>
          <Text style={styles.secondaryText}>{tournamentCopy.steps.saveDraft}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canCreate }}
          disabled={!canCreate}
          onPress={create}
          style={[styles.primaryButton, !canCreate && styles.disabled]}
        >
          <Text style={styles.primaryText}>{state.busy ? copy.creating : copy.create}</Text>
        </Pressable>
      </View>
    </>
  );
}
