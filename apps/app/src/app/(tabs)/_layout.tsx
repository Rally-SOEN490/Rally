// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { router, Tabs } from "expo-router";
import { NavBar, type NavTabName } from "@/components/navBar";

// The five main screens share one nav bar. Because the bar stays on screen
// while the pages switch underneath it, its bubble can slide between tabs.
// Tabs also keep each page as you left it (scroll position, search text).
// Settings and Awards sit on top of these screens, without the bar.
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state }) => (
        <NavBar
          active={state.routes[state.index].name as NavTabName}
          // Every tab's address is its file name, e.g. "You" is /profile.
          onSelect={(name) => router.navigate(`/${name}`)}
        />
      )}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="events" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="notifications" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}
