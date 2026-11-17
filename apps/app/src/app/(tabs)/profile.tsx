// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AvatarSection } from "@/components/profile/avatarSection";
import { AwardsPreview } from "@/components/profile/awardsPreview";
import { BadgeDetailsModal } from "@/components/profile/badgeDetailsModal";
import { InterestSection } from "@/components/profile/interestSection";
import { LookingForTeamCard } from "@/components/profile/lookingForTeamCard";
import { PhotoActionsModal } from "@/components/profile/photoActionsModal";
import { RecentResults } from "@/components/profile/recentResults";
import { sharedStyles } from "@/components/profile/styles";
import { TeamSummary } from "@/components/profile/teamSummary";
import { ThoughtEditorModal } from "@/components/profile/thoughtEditorModal";
import { useInterestEditor } from "@/components/profile/useInterestEditor";
import { useLookingForTeam } from "@/components/profile/useLookingForTeam";
import { useProfilePhoto } from "@/components/profile/useProfilePhoto";
import { useThoughtEditor } from "@/components/profile/useThoughtEditor";
import type { Badge } from "@/lib/badges";
import { useSession } from "@/lib/session";

// The gear in the top corner.
function SettingsButton() {
  return (
    <View style={styles.profileHeader}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open settings"
        testID="open-profile-settings"
        onPress={() => router.push("/settings")}
        style={styles.gearButton}
      >
        <Text style={styles.gearIcon}>⚙️</Text>
      </Pressable>
    </View>
  );
}

// The guards in _layout.tsx only show Profile to someone with a Rally account.
export default function Profile() {
  const session = useSession();
  const { account, selectedBadgeKeys } = session;
  const photo = useProfilePhoto(session);
  const thought = useThoughtEditor(session);
  const looking = useLookingForTeam(session);
  const interests = useInterestEditor(session);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  return (
    <SafeAreaView style={sharedStyles.safeArea}>
      <ScrollView contentContainerStyle={sharedStyles.content}>
        <SettingsButton />

        <AvatarSection
          account={account}
          photo={photo}
          onOpenThought={thought.open}
          lookingForTeam={looking.lookingForTeam}
        />
        <LookingForTeamCard {...looking} />
        <TeamSummary />
        <AwardsPreview
          account={account}
          selectedBadgeKeys={selectedBadgeKeys}
          onSelectBadge={setSelectedBadge}
        />

        <InterestSection
          selection={interests.selection}
          saving={interests.saving}
          onToggle={interests.toggle}
        />
        <View>
          {!!interests.error && (
            <Text accessibilityRole="alert" style={sharedStyles.saveError}>
              {interests.error}
            </Text>
          )}
        </View>

        <RecentResults />
      </ScrollView>

      <PhotoActionsModal {...photo} />
      <BadgeDetailsModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
      <ThoughtEditorModal editor={thought} hasThought={!!account?.thoughtText} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  profileHeader: {
    alignItems: "flex-end",
    paddingTop: 18,
    paddingBottom: 8,
  },
  gearButton: {
    backgroundColor: "#f4f1ee",
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  gearIcon: {
    fontSize: 20,
  },
});
