// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { useLocalSearchParams } from "expo-router";
import { GameSetupScreen } from "@/components/tournaments/gameSetup/gameSetupScreen";

// Game set up for one division: its pools, playoffs and schedule.
export default function DivisionGameSetup() {
  const { id, divisionId } = useLocalSearchParams<{ id: string; divisionId: string }>();
  return <GameSetupScreen id={id} divisionId={divisionId} />;
}
