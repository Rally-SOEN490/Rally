// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { useLocalSearchParams } from "expo-router";
import { DivisionsScreen } from "@/components/tournaments/divisionsScreen";

// Step 2: the draft's divisions, and publishing it.
export default function TournamentDivisions() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DivisionsScreen id={id} />;
}
