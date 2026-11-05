// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Text, View } from "react-native";
import type { OrganizerApplication } from "@/lib/organizer-applications";
import { organizerCopy } from "@/translations/organizer.en";
import { GREEN, RED, styles } from "./styles";

const copy = organizerCopy.sheet;

type Icon = ComponentProps<typeof Ionicons>["name"];

const describe = (application: OrganizerApplication): [Icon, string, string, string] => {
  switch (application.status) {
    case "PENDING":
      return ["time-outline", GREEN, copy.pendingTitle, copy.pendingMessage(application.expiresAt)];
    case "APPROVED":
      return ["checkmark-circle", GREEN, copy.approvedTitle, copy.approvedMessage];
    case "DENIED":
      return [
        "close-circle",
        RED,
        copy.deniedTitle,
        application.denyReason ? copy.deniedReason(application.denyReason) : copy.deniedNoReason,
      ];
    case "EXPIRED":
      return ["hourglass-outline", GREEN, copy.expiredTitle, copy.expiredMessage];
  }
};

// Where the person's latest request stands. Pending requests also repeat what
// they sent, so they can check it.
export function ApplicationStatus({ application }: { application: OrganizerApplication }) {
  const [icon, color, title, message] = describe(application);
  return (
    <View style={styles.statusCard} accessibilityLiveRegion="polite">
      <View style={styles.statusHeader}>
        <Ionicons name={icon} size={22} color={color} />
        <Text style={styles.statusTitle}>{title}</Text>
      </View>
      <Text style={styles.body}>{message}</Text>
      {application.status === "PENDING" && (
        <View style={styles.quote}>
          <Text style={styles.muted}>{copy.yourRequest}</Text>
          <Text style={styles.body}>{application.description}</Text>
          {!!application.link && <Text style={styles.muted}>{application.link}</Text>}
        </View>
      )}
    </View>
  );
}
