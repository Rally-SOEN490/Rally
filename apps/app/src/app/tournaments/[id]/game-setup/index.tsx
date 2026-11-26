// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { useLocalSearchParams } from "expo-router";
import { DivisionPickerScreen } from "@/components/tournaments/gameSetup/divisionPicker";

// Game set up: the organizer picks one of the tournament's divisions.
export default function GameSetupDivisions() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DivisionPickerScreen id={id} />;
}
