// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ComingSoon } from "@/components/comingSoon";
import { eventStyles } from "@/components/tournaments/eventStyles";
import { OrganizerSection } from "@/components/tournaments/organizerSection";
import { useSession } from "@/lib/session";
import { tournamentCopy } from "@/translations/tournaments.en";

const copy = tournamentCopy.events;

// Organizers and admins see their Organizer section (#90). The sections every
// player gets (upcoming, current and past tournaments) are #91.
export default function Events() {
  const { account } = useSession();
  const isOrganizer = account?.role === "ORGANIZER" || account?.role === "ADMIN";
  if (!isOrganizer)
    return (
      <ComingSoon
        title="Events"
        icon="trophy-outline"
        message="Tournaments and leagues you can join will show up here."
      />
    );
  return (
    <SafeAreaView style={eventStyles.screen}>
      <ScrollView contentContainerStyle={eventStyles.content}>
        <View>
          <Text style={eventStyles.city}>{copy.city}</Text>
          <Text style={eventStyles.title} accessibilityRole="header">
            {copy.title}
          </Text>
        </View>
        <OrganizerSection />
        <Text style={eventStyles.sectionTitle}>{copy.playerTitle}</Text>
        <View style={eventStyles.playerCard}>
          <Text style={eventStyles.muted}>{copy.playerSoon}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
