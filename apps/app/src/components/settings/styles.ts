// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { StyleSheet } from "react-native";

// Colours used across the Settings screen.
export const GREEN = "#12382d";
export const MUTED = "#687872";
export const RED = "#c62828";

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#e8e4df",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 42,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    fontSize: 34,
    fontWeight: "800",
    color: GREEN,
    marginTop: 10,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 14,
    color: "#5a675f",
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  card: {
    backgroundColor: "#f7f5f2",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d9d5d0",
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  standaloneCard: {
    marginTop: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#cfcac4",
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTextStack: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: GREEN,
  },
  rowValue: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  note: {
    fontSize: 12,
    color: MUTED,
    marginTop: 8,
    marginBottom: 10,
  },
  socialInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dfe5df",
    borderRadius: 12,
    paddingLeft: 10,
    paddingRight: 5,
    paddingVertical: 5,
    gap: 4,
  },
  socialInputRowSpaced: {
    marginTop: 8,
    marginBottom: 10,
  },
  socialInput: {
    flex: 1,
    minWidth: 0,
    color: GREEN,
    paddingHorizontal: 6,
    paddingVertical: 6,
    fontSize: 12,
  },
  socialSaveButton: {
    backgroundColor: GREEN,
    borderRadius: 8,
    minWidth: 70,
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  socialSaveText: {
    color: "#f5f3ef",
    fontSize: 12,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.5,
  },
  languageToggle: {
    flexDirection: "row",
    backgroundColor: "#e5e1dc",
    borderRadius: 8,
    padding: 2,
  },
  languageOption: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 30,
    alignItems: "center",
  },
  languageOptionActive: {
    backgroundColor: "#fff",
  },
  languageText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8a948e",
  },
  languageTextActive: {
    color: GREEN,
  },
  colorOptions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  colorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  colorDotSelected: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f7f5f2",
    borderWidth: 1,
    borderColor: GREEN,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 24,
  },
  logoutText: {
    color: GREEN,
    fontSize: 18,
    fontWeight: "700",
  },
  deleteButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    marginTop: 6,
  },
  deleteText: {
    color: RED,
    fontSize: 18,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#f7f5f2",
    borderRadius: 22,
    padding: 20,
  },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#dfe5e0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  modalIconDanger: {
    backgroundColor: "#f6dcdc",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: GREEN,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: "#4f5b55",
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#d9d5d0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginTop: 12,
    backgroundColor: "#fff",
  },
  modalError: {
    color: RED,
    marginTop: 8,
    fontSize: 13,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 18,
  },
  modalCancel: {
    backgroundColor: "#dfe3df",
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  modalCancelText: {
    color: GREEN,
    fontWeight: "600",
    fontSize: 15,
  },
  modalConfirm: {
    backgroundColor: "#1f4535",
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 11,
    minWidth: 80,
    alignItems: "center",
  },
  modalConfirmDanger: {
    backgroundColor: RED,
  },
  modalConfirmText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
