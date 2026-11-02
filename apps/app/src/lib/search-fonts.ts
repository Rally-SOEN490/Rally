// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { useFonts } from "expo-font";

const assets = {
  InterRegular: require("@/assets/fonts/inter/Inter_400Regular.ttf"),
  InterMedium: require("@/assets/fonts/inter/Inter_500Medium.ttf"),
  InterSemiBold: require("@/assets/fonts/inter/Inter_600SemiBold.ttf"),
};
export type SearchFonts = {
  regular?: string;
  medium?: string;
  semibold?: string;
};
const families: SearchFonts = {
  regular: "InterRegular",
  medium: "InterMedium",
  semibold: "InterSemiBold",
};
const fallback: SearchFonts = {};

// Local font assets load without a network request; the system font remains usable on failure.
export const useSearchFonts = (): SearchFonts => {
  const [loaded] = useFonts(assets);
  return loaded ? families : fallback;
};
