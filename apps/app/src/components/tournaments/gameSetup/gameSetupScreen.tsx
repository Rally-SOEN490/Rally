// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SegmentedToggle } from "@/components/searchToggle";
import { tournamentPaths } from "@/lib/organizer-tournaments";
import { getOrganizerPage, type OrganizerPage } from "@/lib/tournaments";
import { tournamentCopy } from "@/translations/tournaments.en";
import { BackButton, goBack, PageStatus, useLoadPage } from "../page/loadPage";
import { pageStyles } from "../page/pageStyles";
import { GREEN } from "../styles";
import { gameSetupStyles as styles } from "./styles";

const copy = tournamentCopy.gameSetup;

export const GAME_SETUP_TABS = ["pools", "playoffs", "schedule"] as const;
export type GameSetupTab = (typeof GAME_SETUP_TABS)[number];

const TAB_OPTIONS = GAME_SETUP_TABS.map((tab) => ({ value: tab, label: copy.tabs[tab] }));

const TAB_ICONS: Record<GameSetupTab, keyof typeof Ionicons.glyphMap> = {
  pools: "grid-outline",
  playoffs: "trophy-outline",
  schedule: "calendar-outline",
};

// Holds a tab's place until its screen is built: pools (RALLY-79), playoffs
// (RALLY-81) and the schedule.
function ComingSoonTab({ tab }: { tab: GameSetupTab }) {
  const { title, message } = copy.soon[tab];
  return (
    <View style={styles.soonCard} accessibilityLiveRegion="polite">
      <View style={styles.soonIcon}>
        <Ionicons name={TAB_ICONS[tab]} size={26} color={GREEN} />
      </View>
      <Text style={styles.soonTitle}>{title}</Text>
      <Text style={styles.soonMessage}>{message}</Text>
    </View>
  );
}

// Back to where it was opened from. Opened directly, as from a link on the
// web, it goes to the list of divisions, or to the tournament's page when
// there is no list to show.
const backFrom = ({ id, divisions }: Pick<OrganizerPage, "id" | "divisions">) =>
  goBack(divisions.length > 1 ? tournamentPaths.gameSetup(id) : tournamentPaths.page(id));

// One division's Game set up (RALLY-281): its pools, playoffs and schedule,
// one tab each. It opens on Pools.
export function GameSetupScreen({ id, divisionId }: { id: string; divisionId: string }) {
  const { loaded, retry } = useLoadPage(id, getOrganizerPage);
  const [tab, setTab] = useState<GameSetupTab>("pools");
  if (loaded.kind !== "ready")
    return (
      <PageStatus loaded={loaded} retry={retry} onBack={() => goBack(tournamentPaths.page(id))} />
    );

  const page = loaded.page;
  const back = () => backFrom(page);
  const division = page.divisions.find((candidate) => candidate.id === divisionId);
  if (!division)
    return (
      <PageStatus
        loaded={{ kind: "failed", message: copy.divisionNotFound, canRetry: false }}
        retry={retry}
        onBack={back}
      />
    );
  return (
    <SafeAreaView style={pageStyles.screen}>
      <ScrollView contentContainerStyle={pageStyles.content}>
        <View style={styles.header}>
          <BackButton onPress={back} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle} accessibilityRole="header">
              {copy.title}
            </Text>
            <Text style={styles.headerDetail} numberOfLines={1}>
              {page.name}
            </Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <SegmentedToggle options={TAB_OPTIONS} selected={tab} onChange={setTab} size="large" />
        <View>
          <Text style={styles.divisionTitle} accessibilityRole="header">
            {division.name}
          </Text>
          <Text style={styles.divisionDetail}>
            {copy.teamsRegistered(division.registeredTeams)}
          </Text>
        </View>
        <ComingSoonTab tab={tab} />
      </ScrollView>
    </SafeAreaView>
  );
}
