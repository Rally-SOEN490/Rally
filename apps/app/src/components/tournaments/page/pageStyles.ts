// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { StyleSheet } from "react-native";
import { GREEN, MUTED } from "../styles";

// The tournament page in the Figma mock-ups ("Tournament · Player sign-up", Nov 2).
const INK = "#101b15";
const ICON_TILE = "#eef0e8";
const DIVIDER = "#ecebe6";
export const OPEN_DOT = "#3fa45b";
export const FADED = "#9a9a94";

export const pageStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#ecebe6" },
  content: { padding: 16, paddingBottom: 24, gap: 14 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 32, fontWeight: "800", color: INK },
  by: { fontSize: 14, color: MUTED, marginTop: -10 },
  card: { backgroundColor: "#ffffff", borderRadius: 18, overflow: "hidden" },
  // ---------- Info card ----------
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  divided: { borderTopWidth: 1, borderTopColor: DIVIDER },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: ICON_TILE,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1, minWidth: 0, gap: 2 },
  rowTitle: { fontSize: 15, fontWeight: "600", color: INK },
  rowDetail: { fontSize: 13, color: MUTED },
  // ---------- Sections ----------
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: INK },
  sectionCount: { fontSize: 13, color: MUTED },
  about: { fontSize: 15, lineHeight: 22, color: INK, padding: 16 },
  divisionRow: { padding: 14, gap: 2 },
  faded: { color: FADED },
  soonButton: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#d6d8d2",
    alignItems: "center",
    justifyContent: "center",
  },
  soonButtonText: { fontSize: 15, fontWeight: "600", color: FADED },
  soonHint: { fontSize: 13, color: MUTED, textAlign: "center", marginTop: -6 },
  // ---------- Bottom bar ----------
  bar: { backgroundColor: "#ffffff", borderTopWidth: 1, borderTopColor: "#e4e4de" },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 72,
  },
  barSpots: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: OPEN_DOT },
  barStrong: { fontSize: 14, fontWeight: "700", color: INK },
  barMessage: { flex: 1, fontSize: 15, color: MUTED, textAlign: "center" },
  primaryButton: {
    minHeight: 48,
    paddingHorizontal: 26,
    borderRadius: 14,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  pressed: { opacity: 0.8 },
  notice: {
    fontSize: 13,
    color: GREEN,
    textAlign: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  // ---------- Loading and errors ----------
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  status: { fontSize: 15, color: MUTED, textAlign: "center" },
  error: { fontSize: 15, color: INK, textAlign: "center" },
  secondaryButton: {
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryText: { fontSize: 15, fontWeight: "600", color: GREEN },
});
