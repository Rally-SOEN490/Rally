// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { StyleSheet } from "react-native";

// The same greens as Settings, and the request sheet from the Figma mock-ups.
export const GREEN = "#12382d";
export const MUTED = "#687872";
export const RED = "#c62828";

export const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  // Fills the screen behind the sheet; tapping it closes the sheet.
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(10, 20, 15, 0.45)",
  },
  sheet: {
    maxHeight: "92%",
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  grabber: {
    alignSelf: "center",
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#d9ddd7",
    marginTop: 10,
    marginBottom: 12,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 22, fontWeight: "800", color: "#101b15", flexShrink: 1 },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eef1ec",
  },
  body: { fontSize: 15, lineHeight: 21, color: "#3f4a44", marginTop: 10 },
  muted: { fontSize: 13, lineHeight: 18, color: MUTED },
  label: { fontSize: 13, fontWeight: "600", color: "#1d2a22", marginTop: 16, marginBottom: 6 },
  input: {
    backgroundColor: "#f3f4f0",
    borderWidth: 1,
    borderColor: "#e3e5df",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#101b15",
  },
  multiline: { minHeight: 96, textAlignVertical: "top" },
  error: { color: RED, fontSize: 14, marginTop: 10 },
  note: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14 },
  primaryButton: {
    marginTop: 16,
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  primaryButtonText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  secondaryButton: {
    marginTop: 10,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cfd6cf",
  },
  secondaryButtonText: { color: GREEN, fontSize: 16, fontWeight: "700" },
  dangerButton: { backgroundColor: RED },
  disabled: { opacity: 0.5 },
  row: { flexDirection: "row", gap: 10 },
  // Side-by-side buttons line up on the same top margin.
  flex: { flex: 1, marginTop: 16 },
  statusCard: { marginTop: 14, borderRadius: 16, padding: 16, backgroundColor: "#f3f6f1" },
  statusTitle: { fontSize: 17, fontWeight: "700", color: "#101b15", marginLeft: 8, flexShrink: 1 },
  statusHeader: { flexDirection: "row", alignItems: "center" },
  quote: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e3e5df",
  },
  center: { alignItems: "center", paddingVertical: 32, gap: 12 },
  // The review page in the browser.
  page: { flex: 1, backgroundColor: "#ecebe6" },
  pageContent: { padding: 16, alignItems: "center" },
  pageCard: {
    width: "100%",
    maxWidth: 560,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
  },
  brand: { fontSize: 13, fontWeight: "800", letterSpacing: 2, color: GREEN },
  link: { color: "#1f6f4a", textDecorationLine: "underline", fontSize: 15 },
  badge: {
    alignSelf: "flex-start",
    marginTop: 12,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: "#e6efd0",
  },
  badgeText: { fontSize: 12, fontWeight: "700", color: GREEN },
});
