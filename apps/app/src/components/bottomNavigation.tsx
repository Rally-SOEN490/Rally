// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { Href } from "expo-router";
import { Pressable, Text, View, type TextStyle, type ViewStyle } from "react-native";

type NavigationItem = { label: string; active: boolean; action?: Href };
type NavigationStyles = {
  navBar: ViewStyle;
  navItem: ViewStyle;
  navItemActive: ViewStyle;
  navIcon: TextStyle;
  navIconActive: TextStyle;
  navLabel: TextStyle;
  navLabelActive: TextStyle;
};

const icons: Record<string, string> = {
  Home: "⌂",
  Events: "◫",
  Search: "⌕",
  Notifications: "◔",
};

export function BottomNavigation({
  items,
  styles,
  onNavigate,
}: {
  items: readonly NavigationItem[];
  styles: NavigationStyles;
  onNavigate: (href: Href) => void;
}) {
  return (
    <View style={styles.navBar}>
      {items.map((item) => (
        <Pressable
          key={item.label}
          style={[styles.navItem, item.active && styles.navItemActive]}
          onPress={() => {
            if (item.action) onNavigate(item.action);
          }}
          accessibilityRole="button"
          accessibilityLabel={item.label}
        >
          <Text style={[styles.navIcon, item.active && styles.navIconActive]}>
            {icons[item.label] ?? "◉"}
          </Text>
          <Text style={[styles.navLabel, item.active && styles.navLabelActive]}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
