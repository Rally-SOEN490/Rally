// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { StyleSheet, Text } from "react-native";

// The four sparkles drawn around a Gold badge. Place inside a wrapper that is
// slightly bigger than the badge image.
export function GoldStars() {
  return (
    <>
      <Text style={[styles.goldStar, styles.goldStarTop]}>✦</Text>
      <Text style={[styles.goldStar, styles.goldStarRight]}>✦</Text>
      <Text style={[styles.goldStar, styles.goldStarBottom]}>✦</Text>
      <Text style={[styles.goldStar, styles.goldStarLeft]}>✦</Text>
    </>
  );
}

const styles = StyleSheet.create({
  goldStar: {
    position: "absolute",
    color: "#d4a72c",
    fontSize: 11,
    lineHeight: 11,
  },
  goldStarTop: {
    top: 0,
  },
  goldStarRight: {
    right: 0,
  },
  goldStarBottom: {
    bottom: 0,
  },
  goldStarLeft: {
    left: 0,
  },
});
