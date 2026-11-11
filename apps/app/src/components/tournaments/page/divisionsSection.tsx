// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Text, View } from "react-native";
import { summarizeDivisions, type TournamentPage } from "@/lib/tournaments";
import { tournamentCopy } from "@/translations/tournaments.en";
import { divisionDetail, spotsLeftIn } from "./pageModel";
import { pageStyles } from "./pageStyles";

const copy = tournamentCopy.page;

// The teams in the tournament. Team lists don't exist yet (RALLY-53), so
// nothing here opens anything: no "See all", no arrows.
export function DivisionsSection({ page }: { page: TournamentPage }) {
  const { divisions } = page;
  if (divisions.length === 0) return null;
  const registered = divisions.reduce((sum, division) => sum + division.registeredTeams, 0);
  const max = summarizeDivisions(divisions).spotsTotal;

  // One division is already a row of the info card; only its teams count shows here.
  if (divisions.length === 1)
    return (
      <Text style={pageStyles.sectionTitle} accessibilityRole="header">
        {copy.teams(registered, max)}
      </Text>
    );

  return (
    <View style={{ gap: 10 }}>
      <View style={pageStyles.sectionHeader}>
        <Text style={pageStyles.sectionTitle} accessibilityRole="header">
          {copy.divisions}
        </Text>
        {page.isOrganizer && (
          <Text style={pageStyles.sectionCount}>{copy.teamCount(registered, max)}</Text>
        )}
      </View>
      <View style={pageStyles.card}>
        {divisions.map((division, index) => {
          const full = spotsLeftIn(division) === 0;
          return (
            <View
              key={division.id}
              style={[pageStyles.divisionRow, index > 0 && pageStyles.divided]}
            >
              <Text style={[pageStyles.rowTitle, full && pageStyles.faded]}>{division.name}</Text>
              <Text style={[pageStyles.rowDetail, full && pageStyles.faded]}>
                {divisionDetail(division, page.isOrganizer)}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// The organizer's "Registered teams" button, greyed out until the list exists (RALLY-53).
export function RegisteredTeams() {
  return (
    <View style={{ gap: 12 }}>
      <View
        accessible
        accessibilityRole="button"
        accessibilityState={{ disabled: true }}
        accessibilityLabel={copy.registeredTeams}
        accessibilityHint={copy.registeredTeamsSoon}
        style={pageStyles.soonButton}
      >
        <Text style={pageStyles.soonButtonText}>{copy.registeredTeams}</Text>
      </View>
      <Text style={pageStyles.soonHint}>{copy.registeredTeamsSoon}</Text>
    </View>
  );
}
