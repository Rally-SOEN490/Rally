// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import type { RallyUser } from "@/lib/api";
import { organizerCopy } from "@/translations/organizer.en";
import { GREEN, styles } from "./styles";

// Players can ask to become organizers; organizers and admins already are.
export function OrganizerRow({
  account,
  onPress,
}: {
  account: Pick<RallyUser, "role"> | null | undefined;
  onPress: () => void;
}) {
  const isOrganizer = account?.role === "ORGANIZER" || account?.role === "ADMIN";
  const text = isOrganizer ? organizerCopy.settingsRow.organizer : organizerCopy.settingsRow.player;
  return (
    <Row
      icon={<MaterialCommunityIcons name="volleyball" size={22} color={GREEN} />}
      label={text.label}
      value={text.value}
      onPress={isOrganizer ? undefined : onPress}
      last
    />
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

export function Row({
  icon,
  iconBackground = "#e2e8e3",
  label,
  value,
  right,
  onPress,
  last,
}: {
  icon: ReactNode;
  iconBackground?: string;
  label: string;
  value?: string;
  right?: ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  const content = (
    <>
      <View style={[styles.iconBadge, { backgroundColor: iconBackground }]}>{icon}</View>
      <View style={styles.rowTextStack}>
        <Text style={styles.rowLabel}>{label}</Text>
        {!!value && (
          <Text style={styles.rowValue} numberOfLines={2}>
            {value}
          </Text>
        )}
      </View>
      {right ?? (onPress && <Ionicons name="chevron-forward" size={20} color={GREEN} />)}
    </>
  );
  const style = [styles.row, !last && styles.rowDivider];
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={style}
    >
      {content}
    </Pressable>
  ) : (
    <View style={style}>{content}</View>
  );
}
