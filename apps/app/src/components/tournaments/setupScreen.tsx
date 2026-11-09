// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { tournamentPaths, type OrganizerTournament } from "@/lib/organizer-tournaments";
import { tournamentCopy } from "@/translations/tournaments.en";
import { AboutCard, BasicsCard, MomentsCard } from "./setupFields";
import { StepHeader } from "./stepHeader";
import { styles } from "./styles";
import { useSetupForm, type SetupFormState } from "./useSetupForm";
import { LoadTournament } from "./loadTournament";
import { useLeaveConfirmation } from "./useLeaveConfirmation";

const copy = tournamentCopy.setup;

export const goToEvents = () => router.replace("/events");

// Step 1 of 2. A new tournament has no ID until its first save.
export function SetupScreen({ id }: { id?: string }) {
  if (!id) return <SetupStep />;
  return (
    <LoadTournament id={id}>{(tournament) => <SetupStep tournament={tournament} />}</LoadTournament>
  );
}

function SetupStep({ tournament }: { tournament?: OrganizerTournament }) {
  const state = useSetupForm(tournament);
  // The back arrow doesn't save; the guard asks first if there are unsaved changes.
  const guard = useLeaveConfirmation(state.hasUnsavedChanges, tournamentCopy.steps.leaveMessage);
  const goBack = () => (router.canGoBack() ? router.back() : goToEvents());
  const saveThen = (next: (id: string) => void) => async () => {
    const id = await state.save();
    if (id) guard.leaveWithoutAsking(() => next(id));
  };
  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <StepHeader
            step={1}
            stepName={copy.stepName}
            title={copy.title}
            onBack={goBack}
            onSaveDraft={saveThen(goToEvents)}
            saving={state.saving}
          />
          <BasicsCard state={state} />
          <DatesAndAbout state={state} />
          <SetupFooter
            state={state}
            onNext={saveThen((id) => router.replace(tournamentPaths.divisions(id)))}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      {guard.dialog}
    </SafeAreaView>
  );
}

// When it happens, when registration runs, and the description.
function DatesAndAbout({ state }: { state: SetupFormState }) {
  return (
    <>
      <Text style={styles.sectionLabel}>{copy.tournament}</Text>
      <MomentsCard
        state={state}
        moments={[
          ["startsAt", copy.starts],
          ["endsAt", copy.ends],
        ]}
      />
      <Text style={styles.sectionLabel}>{copy.registration}</Text>
      <MomentsCard
        state={state}
        moments={[
          ["registrationOpensAt", copy.opens],
          ["registrationClosesAt", copy.closes],
        ]}
      />
      <Text style={styles.sectionLabel}>{copy.about}</Text>
      <AboutCard state={state} />
    </>
  );
}

// The error, if any, and "Divisions", which saves first.
function SetupFooter({ state, onNext }: { state: SetupFormState; onNext: () => void }) {
  return (
    <>
      {!!state.error && (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {state.error}
        </Text>
      )}
      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.next}
          accessibilityState={{ disabled: state.saving }}
          disabled={state.saving}
          onPress={onNext}
          style={[styles.primaryButton, state.saving && styles.disabled]}
        >
          <Ionicons name="arrow-forward" size={18} color="#ffffff" />
          <Text style={styles.primaryText}>{copy.next}</Text>
        </Pressable>
      </View>
    </>
  );
}
