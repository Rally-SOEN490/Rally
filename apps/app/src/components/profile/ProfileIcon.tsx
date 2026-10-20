// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { SymbolView } from "expo-symbols";

const symbols = {
  settings: { ios: "gearshape", android: "settings", web: "settings" },
  person: { ios: "person.fill", android: "person", web: "person" },
  home: { ios: "house", android: "home", web: "home" },
  events: { ios: "trophy", android: "emoji_events", web: "emoji_events" },
  teams: { ios: "person.3", android: "groups", web: "groups" },
  search: { ios: "magnifyingglass", android: "search", web: "search" },
  ball: { ios: "volleyball", android: "sports_volleyball", web: "sports_volleyball" },
  wins: { ios: "crown.fill", android: "crown", web: "crown" },
  top: { ios: "medal", android: "workspace_premium", web: "workspace_premium" },
  calendar: { ios: "calendar", android: "calendar_month", web: "calendar_month" },
  next: { ios: "chevron.right", android: "chevron_right", web: "chevron_right" },
  block: { ios: "hand.raised.fill", android: "back_hand", web: "back_hand" },
  bolt: { ios: "bolt.fill", android: "bolt", web: "bolt" },
  shield: { ios: "shield.fill", android: "shield", web: "shield" },
  star: { ios: "star.fill", android: "star", web: "star" },
} as const;

export function ProfileIcon({ name, size = 18, color = "#234d40" }: {
  name: keyof typeof symbols; size?: number; color?: string;
}) {
  return <SymbolView name={symbols[name]} size={size} tintColor={color} />;
}
