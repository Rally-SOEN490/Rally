// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { type ComponentProps, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// The tabs, in order. `name` is the screen's file name in app/(tabs).
export const NAV_TABS = [
  { name: "home", label: "Home", icon: "home-outline" },
  { name: "events", label: "Events", icon: "trophy-outline" },
  { name: "search", label: "Search", icon: "search" },
  { name: "notifications", label: "Notifications", icon: "notifications-outline" },
  { name: "profile", label: "You", icon: "person-outline" },
] as const satisfies readonly {
  name: string;
  label: string;
  icon: ComponentProps<typeof Ionicons>["name"];
}[];

export type NavTabName = (typeof NAV_TABS)[number]["name"];

const GREEN = "#12382d";
const MUTED = "#3f4a46";

// The native driver isn't available on the web; there the animation runs in JavaScript.
const useNativeDriver = Platform.OS !== "web";

// Where the bubble is, counted in tabs (0 = Home), and how swollen it is (0 = at rest).
// When the open tab changes, the bubble springs over to it and swells briefly
// on the way, then settles. Nothing moves when the bar first appears.
function useBubbleAnimation(activeIndex: number) {
  const position = useRef(new Animated.Value(activeIndex)).current;
  const swell = useRef(new Animated.Value(0)).current;
  const shownIndex = useRef(activeIndex);

  useEffect(() => {
    if (shownIndex.current === activeIndex) return;
    shownIndex.current = activeIndex;
    Animated.parallel([
      Animated.spring(position, {
        toValue: activeIndex,
        damping: 15,
        stiffness: 170,
        mass: 0.9,
        useNativeDriver,
      }),
      Animated.sequence([
        Animated.timing(swell, {
          toValue: 1,
          duration: 140,
          easing: Easing.out(Easing.quad),
          useNativeDriver,
        }),
        Animated.spring(swell, { toValue: 0, damping: 9, stiffness: 160, useNativeDriver }),
      ]),
    ]).start();
  }, [activeIndex, position, swell]);

  return { position, swell };
}

// The glass bubble behind the open tab.
function Bubble({
  tabWidth,
  position,
  swell,
}: {
  tabWidth: number;
  position: Animated.Value;
  swell: Animated.Value;
}) {
  const translateX = position.interpolate({
    inputRange: [0, NAV_TABS.length - 1],
    outputRange: [0, (NAV_TABS.length - 1) * tabWidth],
  });
  const scaleX = swell.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] });
  const scaleY = swell.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  return (
    <Animated.View
      testID="nav-bubble"
      pointerEvents="none"
      style={[
        styles.bubble,
        // A hair narrower than the tab, so neighbouring bubbles never touch.
        { width: tabWidth - 2, transform: [{ translateX }, { scaleX }, { scaleY }] },
      ]}
    />
  );
}

function Tab({
  tab,
  selected,
  onPress,
}: {
  tab: (typeof NAV_TABS)[number];
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={tab.label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={styles.tab}
    >
      <Ionicons name={tab.icon} size={22} color={selected ? GREEN : MUTED} />
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[styles.label, selected && styles.labelSelected]}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
}

// The floating glass bar at the bottom of the main screens. A glass bubble
// marks the open tab and slides to the next one, swelling a little while it
// moves, like iOS's "liquid glass" tab bar.
export function NavBar({
  active,
  onSelect,
}: {
  active: NavTabName;
  onSelect: (name: NavTabName) => void;
}) {
  const insets = useSafeAreaInsets();
  const activeIndex = Math.max(
    0,
    NAV_TABS.findIndex((tab) => tab.name === active),
  );
  const { position, swell } = useBubbleAnimation(activeIndex);
  // How wide each tab is, known once the bar has been laid out.
  const [tabWidth, setTabWidth] = useState(0);
  const measure = (event: LayoutChangeEvent) =>
    setTabWidth((event.nativeEvent.layout.width - BAR_PADDING * 2) / NAV_TABS.length);

  return (
    <View
      testID="nav-bar"
      pointerEvents="box-none"
      style={[styles.wrapper, { bottom: Math.max(insets.bottom, 12) }]}
    >
      <View testID="nav-tabs" style={styles.bar} onLayout={measure} accessibilityRole="tablist">
        <BlurView intensity={40} tint="light" style={styles.glass} />
        {tabWidth > 0 && <Bubble tabWidth={tabWidth} position={position} swell={swell} />}
        {NAV_TABS.map((tab, index) => (
          <Tab
            key={tab.name}
            tab={tab}
            selected={index === activeIndex}
            onPress={() => {
              if (index !== activeIndex) onSelect(tab.name);
            }}
          />
        ))}
      </View>
    </View>
  );
}

// Space between the bar's edge and the tabs, and above and below the bubble.
const BAR_PADDING = 4;
const BUBBLE_INSET = 4;

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 14,
    right: 14,
    alignItems: "center",
  },
  bar: {
    width: "100%",
    maxWidth: 460,
    flexDirection: "row",
    borderRadius: 999,
    paddingVertical: BAR_PADDING,
    paddingHorizontal: BAR_PADDING,
    // Soft shadow so the bar floats above the page.
    shadowColor: GREEN,
    shadowOpacity: 0.16,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  // Frosted glass: the page behind is blurred, then washed with a light tint.
  // On Android, where the blur is weaker, the tint alone keeps it readable.
  glass: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(246, 245, 241, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.85)",
  },
  bubble: {
    position: "absolute",
    top: BUBBLE_INSET,
    bottom: BUBBLE_INSET,
    left: BAR_PADDING + 1,
    borderRadius: 999,
    backgroundColor: "rgba(196, 216, 204, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
    shadowColor: GREEN,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    color: MUTED,
    marginTop: 3,
  },
  labelSelected: {
    color: GREEN,
    fontWeight: "700",
  },
});
