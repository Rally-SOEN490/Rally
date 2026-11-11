// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { StyleSheet } from "react-native";

// Styles shared by more than one part of the Profile screen.
export const sharedStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#e8e4df",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 110, // room for the floating nav bar
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(18, 56, 45, 0.52)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  saveError: {
    color: "#d15b57",
    fontSize: 13,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#12382d",
  },
  linkText: {
    fontSize: 14,
    color: "#204d42",
    fontWeight: "600",
  },
  photoError: {
    marginTop: 8,
    color: "#a12f25",
    fontSize: 13,
    textAlign: "center",
  },
});
