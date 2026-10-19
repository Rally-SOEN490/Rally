// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

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
      <View style={styles.icon}><Text style={styles.flag}>⚑</Text></View>
      <View style={styles.info}>
        <Text style={styles.eyebrow}>{copy.upcoming}</Text>
        {entries === undefined && !error && <ActivityIndicator accessibilityLabel={copy.loadingUpcoming} color="#fff" />}
        {!!error && <><Text accessibilityRole="alert" style={styles.meta}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={() => { setError(""); setAttempt(attempt + 1); }} style={styles.retry}><Text style={styles.retryText}>{copy.retry}</Text></Pressable></>}
        {entries && <>
          <Text style={styles.name}>{next?.teamName ?? copy.noTeam}</Text>
          <Text style={styles.meta}>{next ? `${next.eventName} · ${next.tournamentName}` : copy.noUpcoming}</Text>
          {next && <Text style={styles.meta}>{next.format} · {date(next.startsAt)}</Text>}
        </>}
      </View>
      {!!entries && entries.length > 1 && <Pressable accessibilityRole="button" accessibilityLabel={`${copy.showUpcoming} (${entries.length})`}
        onPress={() => setExpanded(true)} style={styles.more}><Text style={styles.moreText}>+{entries.length - 1}</Text></Pressable>}
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
  banner: { marginTop: 20, backgroundColor: "#12382d", padding: 16, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { width: 42, height: 42, borderRadius: 12, backgroundColor: "#dfe9e4", alignItems: "center", justifyContent: "center" }, flag: { fontSize: 24, color: "#12382d" },
  info: { flex: 1 }, eyebrow: { fontSize: 11, fontWeight: "700", color: "#d9dfd7" }, name: { fontSize: 18, fontWeight: "800", color: "#f5f3ef", marginTop: 4 }, meta: { fontSize: 12, lineHeight: 18, color: "#d9dfd7", marginTop: 4 },
  more: { backgroundColor: "#f3f6f5", borderRadius: 22, minHeight: 44, minWidth: 44, padding: 10, alignItems: "center", justifyContent: "center" }, moreText: { color: "#12382d", fontWeight: "700" },
  backdrop: { flex: 1, backgroundColor: "rgba(18,56,45,0.45)", justifyContent: "center", padding: 24 }, modal: { backgroundColor: "#f7f4f1", borderRadius: 20, padding: 20, maxHeight: "80%", gap: 16 }, title: { fontSize: 18, fontWeight: "800", color: "#12382d" },
  list: { gap: 12 }, row: { borderBottomWidth: 1, borderBottomColor: "#d9d5d0", paddingBottom: 12, gap: 4 }, entryName: { color: "#12382d", fontSize: 15, fontWeight: "700" }, body: { color: "#536761", fontSize: 13, lineHeight: 20 },
  close: { minHeight: 44, backgroundColor: "#12382d", borderRadius: 12, alignItems: "center", justifyContent: "center" }, closeText: { color: "#fff", fontWeight: "600" }, retry: { minHeight: 44, justifyContent: "center" }, retryText: { color: "#fff", fontWeight: "600" },
});
