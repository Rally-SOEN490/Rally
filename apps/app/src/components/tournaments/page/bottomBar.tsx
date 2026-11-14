// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { tournamentPaths } from "@/lib/organizer-tournaments";
import type { TournamentPage } from "@/lib/tournaments";
import { tournamentCopy } from "@/translations/tournaments.en";
import { GREEN } from "../styles";
import { bottomBar } from "./pageModel";
import { pageStyles } from "./pageStyles";

const copy = tournamentCopy.page;

function PrimaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [pageStyles.primaryButton, pressed && pageStyles.pressed]}
    >
      <Text style={pageStyles.primaryText}>{label}</Text>
    </Pressable>
  );
}

// Docked at the bottom: "Sign up" while a team can sign up, the viewer's team
// once they are on one, otherwise why signing up isn't possible.
export function BottomBar({ page, onSignUp }: { page: TournamentPage; onSignUp: () => void }) {
  const bar = bottomBar(page);

  return (
    <SafeAreaView edges={["bottom"]} style={pageStyles.bar}>
      <View style={pageStyles.barRow}>
        {bar.kind === "signUp" && (
          <>
            <View style={pageStyles.barSpots}>
              <View style={pageStyles.dot} />
              <Text style={pageStyles.barStrong}>{copy.spotsLeft(bar.spotsLeft)}</Text>
            </View>
            <PrimaryButton label={copy.signUp} onPress={onSignUp} />
          </>
        )}
        {bar.kind === "message" && <Text style={pageStyles.barMessage}>{bar.text}</Text>}
        {bar.kind === "myTeam" && (
          // Announced when it replaces Sign up, so a screen reader hears the sign-up worked.
          <View style={pageStyles.barTeam} accessible accessibilityLiveRegion="polite">
            <Ionicons name="checkmark-circle" size={24} color={GREEN} />
            <View style={pageStyles.rowText}>
              <Text style={pageStyles.barStrong}>{bar.title}</Text>
              <Text style={pageStyles.rowDetail}>{bar.detail}</Text>
            </View>
          </View>
        )}
        {bar.kind === "draft" && (
          <>
            <Text style={pageStyles.barStrong}>{copy.draft}</Text>
            <PrimaryButton
              label={copy.continueSetup}
              onPress={() => router.push(tournamentPaths.setup(page.id))}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
