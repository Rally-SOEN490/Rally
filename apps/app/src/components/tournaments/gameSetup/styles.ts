// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { StyleSheet } from "react-native";
import { ICON_TILE, INK } from "../page/pageStyles";
import { MUTED } from "../styles";

// Game set up in the Figma mock-ups (Mock-Up page, Nov 25). The rest comes
// from the tournament page's styles.
const CHIP = "#ecebe6";

export const gameSetupStyles = StyleSheet.create({
  // ---------- Picking a division ----------
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    color: MUTED,
    marginTop: 4,
    marginLeft: 12,
  },
  divisionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
  },
  divisionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: ICON_TILE,
    alignItems: "center",
    justifyContent: "center",
  },
  divisionName: { fontSize: 16, fontWeight: "700", color: INK },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  chip: { borderRadius: 8, backgroundColor: CHIP, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 12, fontWeight: "600", color: "#4b4b46" },
  note: { fontSize: 13, color: MUTED, textAlign: "center", marginTop: 4 },
  // ---------- A division's Game set up ----------
  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerText: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: INK },
  headerDetail: { fontSize: 12, color: MUTED },
  // As wide as the back button, so the title stays centred.
  headerSpacer: { width: 40 },
  divisionTitle: { fontSize: 30, fontWeight: "800", color: INK, marginTop: 4 },
  divisionDetail: { fontSize: 14, color: MUTED, marginTop: 2 },
  soonCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: "center",
    gap: 8,
  },
  soonIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ICON_TILE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  soonTitle: { fontSize: 17, fontWeight: "800", color: INK, textAlign: "center" },
  soonMessage: { fontSize: 14, lineHeight: 20, color: MUTED, textAlign: "center", maxWidth: 300 },
});
