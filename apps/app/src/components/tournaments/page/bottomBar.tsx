// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { router } from "expo-router";
import { useState } from "react";
import { Alert, Platform, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { tournamentPaths } from "@/lib/organizer-tournaments";
import type { TournamentPage } from "@/lib/tournaments";
import { tournamentCopy } from "@/translations/tournaments.en";
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

// Docked at the bottom: "Sign up" while a player can sign up, otherwise why not.
export function BottomBar({ page }: { page: TournamentPage }) {
  const bar = bottomBar(page);
  const [notice, setNotice] = useState<string>();
  // Signing up is RALLY-36 (create a team) and RALLY-38 (join one).
  const signUp = () => {
    if (Platform.OS === "web") setNotice(copy.registrationUnavailable);
    else Alert.alert(copy.signUp, copy.registrationUnavailable);
  };

  return (
    <SafeAreaView edges={["bottom"]} style={pageStyles.bar}>
      <View style={pageStyles.barRow}>
        {bar.kind === "signUp" && (
          <>
            <View style={pageStyles.barSpots}>
              <View style={pageStyles.dot} />
              <Text style={pageStyles.barStrong}>{copy.spotsLeft(bar.spotsLeft)}</Text>
            </View>
            <PrimaryButton label={copy.signUp} onPress={signUp} />
          </>
        )}
        {bar.kind === "message" && <Text style={pageStyles.barMessage}>{bar.text}</Text>}
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
      {notice && (
        <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={pageStyles.notice}>
          {notice}
        </Text>
      )}
    </SafeAreaView>
  );
}
