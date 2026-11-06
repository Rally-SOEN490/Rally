// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { useLocalSearchParams } from "expo-router";
import { TournamentPageScreen } from "@/components/tournaments/page/tournamentPageScreen";

// A tournament's page, for players and its organizer.
export default function TournamentPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TournamentPageScreen id={id} />;
}
