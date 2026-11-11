// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, radii } from "@/constants/rallyTheme";
import { ApiError, apiErrorMessage } from "@/lib/api";
import { formatPrice } from "@/lib/organizer-tournaments";
import { useSession } from "@/lib/session";
import {
  signUpTeam,
  TEAM_NAME_MAX_LENGTH,
  tidyTeamName,
  type BrowseDivision,
  type MyTeam,
  type TournamentPage,
} from "@/lib/tournaments";
import { tournamentCopy } from "@/translations/tournaments.en";
import { RED } from "../styles";
import { pricePerTeam, spotsLeftIn } from "./pageModel";
import { pageStyles } from "./pageStyles";

const copy = tournamentCopy.signUp;

type Props = {
  page: TournamentPage;
  onClose: () => void;
  // Called when the server refuses because the tournament changed since the
  // page loaded (a division filled up, a name was taken…), to fetch it again.
  onOutdated: () => void;
  // Called once the server confirms the team.
  onSignedUp: (team: MyTeam) => void;
};

// The "Create a team" sheet from the Figma mock-ups (C1): pick a division with
// room and a team name, then check them and the price before signing up. The
// mock-up's "Join a team" choice (S1) and join-request switch come with RALLY-38.
export function SignUpSheet({ page, onClose, onOutdated, onSignedUp }: Props) {
  const form = useSignUpForm(page, onSignedUp, onOutdated);
  const close = () => !form.saving && onClose();
  return (
    <Modal visible transparent animationType="slide" onRequestClose={close} statusBarTranslucent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={sheet.backdrop}
      >
        {/* Tapping outside closes it; screen readers use the close button instead. */}
        <Pressable accessible={false} onPress={close} style={StyleSheet.absoluteFill} />
        <SafeAreaView
          testID="sign-up sheet"
          edges={["bottom"]}
          style={sheet.card}
          accessibilityViewIsModal
        >
          <SheetHeader
            title={form.step === "details" ? copy.createTeam : copy.checkTeam}
            onBack={form.step === "review" && !form.saving ? form.back : undefined}
            onClose={close}
          />
          <ScrollView contentContainerStyle={sheet.content} keyboardShouldPersistTaps="handled">
            {form.step === "details" ? <Details form={form} page={page} /> : <Review form={form} />}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type Form = ReturnType<typeof useSignUpForm>;

// What the sheet keeps while it is open, so nothing typed is lost when a
// request fails or the player goes back a step. The page may be fetched again
// while the sheet is open, so a picked division can fill up meanwhile.
function useSignUpForm(
  page: TournamentPage,
  onSignedUp: (team: MyTeam) => void,
  onOutdated: () => void,
) {
  const { user } = useSession();
  const withRoom = page.divisions.filter((division) => spotsLeftIn(division) > 0);
  const [divisionId, setDivisionId] = useState(withRoom.length === 1 ? withRoom[0].id : undefined);
  const [name, setName] = useState("");
  const [step, setStep] = useState<"details" | "review">("details");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const division = page.divisions.find(({ id }) => id === divisionId);
  const hasRoom = !!division && spotsLeftIn(division) > 0;
  const teamName = tidyTeamName(name);

  const submit = async () => {
    if (!user || !division || !hasRoom) return;
    setSaving(true);
    setError(undefined);
    try {
      onSignedUp(await signUpTeam(user, page.id, { divisionId: division.id, name: teamName }));
    } catch (failure) {
      setError(apiErrorMessage(failure));
      setSaving(false);
      if (failure instanceof ApiError && failure.status === 409) onOutdated();
    }
  };

  return {
    step,
    division,
    divisionId,
    setDivisionId,
    name,
    setName,
    teamName,
    saving,
    error,
    hasRoom,
    canContinue: hasRoom && teamName.length > 0,
    next: () => setStep("review"),
    back: () => {
      setError(undefined);
      setStep("details");
    },
    submit,
  };
}

function SheetHeader({
  title,
  onBack,
  onClose,
}: {
  title: string;
  onBack?: () => void;
  onClose: () => void;
}) {
  return (
    <View style={sheet.header}>
      <View style={sheet.grabber} />
      <View style={sheet.headerRow}>
        {onBack && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.back}
            onPress={onBack}
            style={sheet.roundButton}
          >
            <Ionicons name="chevron-back" size={20} color={colors.forest} />
          </Pressable>
        )}
        <Text style={sheet.title} accessibilityRole="header">
          {title}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.close}
          onPress={onClose}
          style={sheet.roundButton}
        >
          <Ionicons name="close" size={20} color={colors.forest} />
        </Pressable>
      </View>
    </View>
  );
}

function Details({ form, page }: { form: Form; page: TournamentPage }) {
  return (
    <>
      <Text style={sheet.label}>{copy.division}</Text>
      <View accessibilityRole="radiogroup" style={sheet.options}>
        {page.divisions.map((division) => (
          <DivisionOption
            key={division.id}
            division={division}
            selected={division.id === form.divisionId}
            onSelect={() => form.setDivisionId(division.id)}
          />
        ))}
      </View>
      <Text style={sheet.label}>{copy.teamName}</Text>
      <TextInput
        accessibilityLabel={copy.teamName}
        value={form.name}
        onChangeText={form.setName}
        maxLength={TEAM_NAME_MAX_LENGTH}
        autoCapitalize="words"
        autoCorrect={false}
        returnKeyType="next"
        onSubmitEditing={() => form.canContinue && form.next()}
        style={sheet.input}
      />
      <View style={sheet.note}>
        <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
        <Text style={sheet.noteText}>{copy.captainNote}</Text>
      </View>
      <SheetButton label={copy.next} disabled={!form.canContinue} onPress={form.next} />
    </>
  );
}

// One division to pick. A full one stays visible but can't be picked.
function DivisionOption({
  division,
  selected,
  onSelect,
}: {
  division: BrowseDivision;
  selected: boolean;
  onSelect: () => void;
}) {
  const spotsLeft = spotsLeftIn(division);
  const full = spotsLeft === 0;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={division.name}
      accessibilityHint={full ? copy.full : copy.spotsLeft(spotsLeft)}
      accessibilityState={{ checked: selected, disabled: full }}
      disabled={full}
      onPress={onSelect}
      style={[sheet.option, selected && sheet.optionOn, full && sheet.optionFull]}
    >
      <Ionicons
        name={selected ? "radio-button-on" : "radio-button-off"}
        size={22}
        color={full ? colors.textMuted : colors.forest}
      />
      <Text style={[sheet.optionName, full && sheet.optionNameFull]}>{division.name}</Text>
      {full ? (
        <Text style={sheet.fullChip}>{copy.full}</Text>
      ) : (
        <Text style={sheet.optionDetail}>{copy.spotsLeft(spotsLeft)}</Text>
      )}
    </Pressable>
  );
}

function Review({ form }: { form: Form }) {
  const priceCents = form.division?.priceCents ?? 0;
  return (
    <>
      <View style={sheet.summary}>
        <SummaryRow label={copy.team} value={form.teamName} />
        <SummaryRow label={copy.division} value={form.division?.name ?? ""} />
        <SummaryRow label={copy.price} value={pricePerTeam(priceCents)} />
      </View>
      {priceCents > 0 && (
        <View style={sheet.note}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
          <Text style={sheet.noteText}>{copy.payOutside(formatPrice(priceCents))}</Text>
        </View>
      )}
      {form.error && (
        <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={sheet.error}>
          {form.error}
        </Text>
      )}
      <SheetButton
        label={form.saving ? copy.submitting : copy.submit}
        disabled={form.saving || !form.hasRoom}
        busy={form.saving}
        onPress={form.submit}
      />
    </>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={sheet.summaryRow}>
      <Text style={sheet.summaryLabel}>{label}</Text>
      <Text style={sheet.summaryValue}>{value}</Text>
    </View>
  );
}

function SheetButton({
  label,
  disabled,
  busy = false,
  onPress,
}: {
  label: string;
  disabled: boolean;
  busy?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled, busy }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        sheet.button,
        disabled && !busy && sheet.buttonOff,
        pressed && pageStyles.pressed,
      ]}
    >
      {busy && <ActivityIndicator color={colors.white} />}
      <Text style={sheet.buttonText}>{label}</Text>
    </Pressable>
  );
}

// The sheet's colours come from the app theme (constants/rallyTheme), like the
// Search filters sheet. The theme has no red yet, so errors keep the forms' red.
const sheet = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.38)" },
  card: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  header: { paddingHorizontal: 16, paddingTop: 8, gap: 8 },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.border,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { flex: 1, fontSize: 22, fontWeight: "800", color: colors.forest },
  roundButton: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 16, gap: 10 },
  label: { fontSize: 13, color: colors.textMuted },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.button,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.textPrimary,
  },
  note: { flexDirection: "row", gap: 6, alignItems: "center" },
  noteText: { fontSize: 13, color: colors.textMuted, flexShrink: 1 },
  options: { gap: 8 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionOn: { borderColor: colors.forest, borderWidth: 2 },
  optionFull: { backgroundColor: colors.background },
  optionName: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  optionNameFull: { color: colors.textMuted },
  optionDetail: { fontSize: 13, color: colors.textMuted },
  fullChip: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: "hidden",
  },
  summary: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  summaryLabel: { fontSize: 14, color: colors.textMuted },
  summaryValue: { flexShrink: 1, fontSize: 15, fontWeight: "600", color: colors.textPrimary },
  error: { fontSize: 14, color: RED },
  button: {
    minHeight: 48,
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
    paddingHorizontal: 26,
    borderRadius: radii.button,
    backgroundColor: colors.forest,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: "700" },
  buttonOff: { opacity: 0.4 },
});
