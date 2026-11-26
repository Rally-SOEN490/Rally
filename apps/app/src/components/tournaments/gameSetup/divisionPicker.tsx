// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Redirect, router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { tournamentPaths } from "@/lib/organizer-tournaments";
import { getOrganizerPage, type BrowseDivision } from "@/lib/tournaments";
import { tournamentCopy } from "@/translations/tournaments.en";
import { BackButton, goBack, PageStatus, useLoadPage } from "../page/loadPage";
import { pageStyles } from "../page/pageStyles";
import { GREEN, MUTED } from "../styles";
import { GAME_SETUP_TABS } from "./gameSetupScreen";
import { gameSetupStyles as styles } from "./styles";

const copy = tournamentCopy.gameSetup;

function DivisionRow({
  tournamentId,
  division,
}: {
  tournamentId: string;
  division: BrowseDivision;
}) {
  const teams = tournamentCopy.page.teamCount(division.registeredTeams, division.maxTeams);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={copy.divisionLabel(division.name, teams)}
      onPress={() => router.push(tournamentPaths.divisionSetup(tournamentId, division.id))}
      style={({ pressed }) => [styles.divisionCard, pressed && pageStyles.pressed]}
    >
      <View style={styles.divisionIcon}>
        <MaterialCommunityIcons name="volleyball" size={22} color={GREEN} />
      </View>
      <View style={pageStyles.rowText}>
        <Text style={styles.divisionName}>{division.name}</Text>
        <Text style={pageStyles.rowDetail}>{teams}</Text>
        {/* What each division's Game set up holds. */}
        <View style={styles.chips}>
          {GAME_SETUP_TABS.map((tab) => (
            <View key={tab} style={styles.chip}>
              <Text style={styles.chipText}>{copy.tabs[tab]}</Text>
            </View>
          ))}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={MUTED} />
    </Pressable>
  );
}

// Game set up starts by picking a division (RALLY-281). A tournament with only
// one division skips the list and opens that division straight away.
export function DivisionPickerScreen({ id }: { id: string }) {
  const { loaded, retry } = useLoadPage(id, getOrganizerPage);
  const back = () => goBack(tournamentPaths.page(id));
  if (loaded.kind !== "ready") return <PageStatus loaded={loaded} retry={retry} onBack={back} />;

  const { name, divisions } = loaded.page;
  if (divisions.length === 1)
    return <Redirect href={tournamentPaths.divisionSetup(id, divisions[0].id)} />;
  return (
    <SafeAreaView style={pageStyles.screen}>
      <ScrollView contentContainerStyle={pageStyles.content}>
        <BackButton onPress={back} />
        <Text style={pageStyles.title} accessibilityRole="header">
          {copy.title}
        </Text>
        <Text style={pageStyles.by}>{copy.tournamentAndDivisions(name, divisions.length)}</Text>
        {divisions.length === 0 ? (
          <Text style={styles.note}>{copy.noDivisions}</Text>
        ) : (
          <>
            <Text style={styles.sectionLabel}>{copy.pickDivision}</Text>
            {divisions.map((division) => (
              <DivisionRow key={division.id} tournamentId={id} division={division} />
            ))}
            <Text style={styles.note}>{copy.eachDivision}</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
