// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { longDate, timeRange } from "@/lib/tournament-dates";
import type { TournamentPage } from "@/lib/tournaments";
import { tournamentCopy } from "@/translations/tournaments.en";
import { GREEN } from "../styles";
import { pricePerTeam, signUpsRow } from "./pageModel";
import { pageStyles } from "./pageStyles";

const copy = tournamentCopy.page;

function InfoRow({
  icon,
  title,
  detail,
  first,
}: {
  icon: ReactNode;
  title: string;
  detail?: string;
  first?: boolean;
}) {
  return (
    <View style={[pageStyles.infoRow, !first && pageStyles.divided]}>
      <View style={pageStyles.iconTile}>{icon}</View>
      <View style={pageStyles.rowText}>
        <Text style={pageStyles.rowTitle}>{title}</Text>
        {detail ? <Text style={pageStyles.rowDetail}>{detail}</Text> : null}
      </View>
    </View>
  );
}

const icon = (name: keyof typeof Ionicons.glyphMap) => (
  <Ionicons name={name} size={20} color={GREEN} />
);

// When, where, sign-ups and, for a single division, the division itself. Rows
// are read-only.
export function InfoCard({ page }: { page: TournamentPage }) {
  const date = page.startsAt ? longDate(page.startsAt) : undefined;
  const signUps = signUpsRow(page);
  const onlyDivision = page.divisions.length === 1 ? page.divisions[0] : undefined;
  return (
    <View style={pageStyles.card}>
      <InfoRow
        first
        icon={icon("calendar-outline")}
        title={date ?? copy.datesToBeAnnounced}
        detail={timeRange(page.startsAt, page.endsAt)}
      />
      <InfoRow
        icon={icon("location-outline")}
        title={page.location ?? copy.locationToBeAnnounced}
      />
      <InfoRow icon={icon("time-outline")} title={signUps.title} detail={signUps.detail} />
      {onlyDivision && (
        <InfoRow
          icon={<MaterialCommunityIcons name="volleyball" size={20} color={GREEN} />}
          title={copy.divisionAndPrice(onlyDivision.name, pricePerTeam(onlyDivision.priceCents))}
        />
      )}
    </View>
  );
}
