// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { useLocalSearchParams } from "expo-router";
import { SetupScreen } from "@/components/tournaments/setupScreen";

// Step 1 again, for a draft that already exists.
export default function TournamentSetup() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <SetupScreen id={id} />;
}
