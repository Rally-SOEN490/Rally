// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Image, StyleSheet, Text, View } from "react-native";
import { searchCopy as copy } from "@/translations/search.en";
import { colors } from "@/constants/rallyTheme";

type Props = {
  title?: string;
  subtitle?: string;
  fontFamily?: string;
  regularFontFamily?: string;
  mediumFontFamily?: string;
};

export function SearchBanner({
  title = copy.banner.title,
  subtitle = copy.banner.subtitle,
  fontFamily,
  regularFontFamily,
  mediumFontFamily,
}: Props) {
  return (
    <View style={styles.banner}>
      <Image
        source={require("@/assets/images/tabIcons/searchbanner_volleyball.png")}
        style={styles.ball}
        resizeMode="contain"
      />
      <Text
        style={[styles.brand, { fontFamily: mediumFontFamily ?? fontFamily }]}
      >
        {copy.banner.brand}
      </Text>
      <Text style={[styles.title, { fontFamily }]}>{title}</Text>
      <Text
        style={[
          styles.subtitle,
          { fontFamily: regularFontFamily ?? fontFamily },
        ]}
      >
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.forest,
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 16,
    overflow: "hidden",
    minHeight: 118,
    justifyContent: "center",
  },
  ball: {
    position: "absolute",
    top: -15,
    bottom: 0,
    right: -30,
    width: 180,
  },
  brand: {
    color: colors.lime,
    fontSize: 16,
    letterSpacing: 1.5,
    fontWeight: "500",
  },
  title: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "700",
    marginTop: 6,
  },
  subtitle: {
    color: colors.lime,
    fontSize: 12,
    marginTop: 8,
  },
});
