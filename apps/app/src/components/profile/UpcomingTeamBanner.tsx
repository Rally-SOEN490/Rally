// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { ProfileIcon } from "./ProfileIcon";
import { ProfileStripes } from "./ProfileStripes";
import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { apiErrorMessage } from "@/lib/api";
import { getUpcomingTournaments, type UpcomingTournament } from "@/lib/profile-tournaments";
import { profileCopy as copy } from "@/locales/en/profile";
const date = (value: string) => new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
export function UpcomingTeamBanner({ user }: { user: User }) {
  const [entries, setEntries] = useState<UpcomingTournament[]>();
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    let current = true;
    getUpcomingTournaments(user).then(({ tournaments }) => { if (current) setEntries(tournaments); })
      .catch((reason) => { if (current) setError(apiErrorMessage(reason)); });
    return () => { current = false; };
  }, [user, attempt]);
  const next = entries?.[0];
  return <>
    <View style={styles.banner}>
      <ProfileStripes />
      <View style={styles.icon}><ProfileIcon name="ball" size={25} color="#254f3e" /></View>
      <View style={styles.info}>
        <Text style={styles.eyebrow}>{copy.myTeam}</Text>
        {entries === undefined && !error && <ActivityIndicator accessibilityLabel={copy.loadingUpcoming} color="#fff" />}
        {!!error && <><Text accessibilityRole="alert" style={styles.meta}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={() => { setError(""); setAttempt(attempt + 1); }} style={styles.retry}><Text style={styles.retryText}>{copy.retry}</Text></Pressable></>}
        {entries && <>
          <Text style={styles.name} numberOfLines={1}>{next?.teamName ?? copy.noTeam}</Text>
          <Text style={styles.meta} numberOfLines={1}>{next ? `${next.format} · ${next.tournamentName}` : copy.noUpcoming}</Text>
        </>}
      </View>
      {!!entries && entries.length > 0 && <Pressable accessibilityRole="button" accessibilityLabel={`${copy.showUpcoming} (${entries.length})`}
        onPress={() => setExpanded(true)} style={styles.more}>{entries.length > 1 && <View style={styles.moreBubble}><Text style={styles.moreText}>+{entries.length - 1}</Text></View>}<ProfileIcon name="next" size={16} color="#deeadf" /></Pressable>}
    </View>
    <Modal visible={expanded} transparent animationType="fade" onRequestClose={() => setExpanded(false)}>
      <View style={styles.backdrop}><View style={styles.modal} accessibilityViewIsModal>
        <Text accessibilityRole="header" style={styles.title}>{copy.upcoming}</Text>
        <ScrollView contentContainerStyle={styles.list}>
          {entries?.map((entry) => <View key={entry.id} style={styles.row}>
            <Text style={styles.entryName}>{entry.tournamentName}</Text>
            <Text style={styles.body}>{entry.eventName}</Text>
            <Text style={styles.body}>{entry.teamName} · {entry.format}</Text>
            <Text style={styles.body}>{date(entry.startsAt)}</Text>
          </View>)}
        </ScrollView>
        <Pressable accessibilityRole="button" accessibilityLabel={copy.closeUpcoming} onPress={() => setExpanded(false)} style={styles.close}><Text style={styles.closeText}>{copy.close}</Text></Pressable>
      </View></View>
    </Modal>
  </>;
}
const styles = StyleSheet.create({
  banner: { marginTop: 14, backgroundColor: "#28513e", paddingVertical: 10, paddingLeft: 12, paddingRight: 6, borderRadius: 16, flexDirection: "row", alignItems: "center", gap: 10, overflow: "hidden", boxShadow: "0px 3px 8px rgba(28,57,43,0.18)" },
  icon: { width: 40, height: 40, borderRadius: 13, backgroundColor: "#f4d23b", alignItems: "center", justifyContent: "center" },
  info: { flex: 1 }, eyebrow: { fontSize: 8, fontWeight: "800", letterSpacing: 1.5, color: "#e9ec80" }, name: { fontSize: 15, fontWeight: "700", color: "#fff", marginTop: 2 }, meta: { fontSize: 10, lineHeight: 14, color: "#dae4d8", marginTop: 1 },
  more: { minHeight: 44, minWidth: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 }, moreBubble: { backgroundColor: "#e1eee0", borderRadius: 13, minWidth: 26, height: 26, alignItems: "center", justifyContent: "center" }, moreText: { color: "#234d40", fontWeight: "700", fontSize: 10 },
  backdrop: { flex: 1, backgroundColor: "rgba(18,56,45,0.45)", justifyContent: "center", padding: 24 }, modal: { backgroundColor: "#f7f4f1", borderRadius: 20, padding: 20, maxHeight: "80%", gap: 16 }, title: { fontSize: 18, fontWeight: "800", color: "#12382d" },
  list: { gap: 12 }, row: { borderBottomWidth: 1, borderBottomColor: "#d9d5d0", paddingBottom: 12, gap: 4 }, entryName: { color: "#12382d", fontSize: 15, fontWeight: "700" }, body: { color: "#536761", fontSize: 13, lineHeight: 20 },
  close: { minHeight: 44, backgroundColor: "#12382d", borderRadius: 12, alignItems: "center", justifyContent: "center" }, closeText: { color: "#fff", fontWeight: "600" }, retry: { minHeight: 44, justifyContent: "center" }, retryText: { color: "#fff", fontWeight: "600" },
});
