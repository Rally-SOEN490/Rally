// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { useEffect, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { apiErrorMessage } from "@/lib/api";
import { getProfileMessage, saveProfileMessage } from "@/lib/profile-message";
import { profileCopy as copy } from "@/locales/en/profile";

export function ProfileMessage({ user }: { user: User }) {
  const [saved, setSaved] = useState<string>();
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [attempt, setAttempt] = useState(0);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);
  useEffect(() => {
    let current = true;
    getProfileMessage(user).then(({ message }) => {
      if (current) { setSaved(message); setDraft(message); }
    }).catch((reason) => { if (current) setError(apiErrorMessage(reason)); });
    return () => { current = false; };
  }, [user, attempt]);
  const length = Array.from(draft).length;
  const save = async () => {
    setSaving(true); setError(""); setNotice("");
    try {
      const { message } = await saveProfileMessage(user, draft);
      if (!active.current) return;
      setSaved(message); setDraft(message); setEditing(false);
      setNotice(message ? copy.saved : copy.removed);
    } catch (reason) {
      if (active.current) setError(apiErrorMessage(reason));
    } finally { if (active.current) setSaving(false); }
  };
  return (
    <View style={styles.card}>
      <View style={styles.heading}>
        <Text style={styles.title}>{copy.message}</Text>
        {saved !== undefined && !editing && <Pressable accessibilityRole="button"
          accessibilityLabel={saved ? copy.edit : copy.add} hitSlop={8}
          onPress={() => { setDraft(saved); setEditing(true); setNotice(""); setError(""); }}>
          <Text style={styles.link}>{saved ? copy.edit : copy.add}</Text>
        </Pressable>}
      </View>
      {saved === undefined && !error && <ActivityIndicator accessibilityLabel={copy.loading} color="#204d42" />}
      {saved !== undefined && !editing && <Text style={[styles.message, !saved && styles.muted]}>{saved || copy.empty}</Text>}
      {editing && <>
        <TextInput accessibilityLabel={copy.message} placeholder={copy.placeholder}
          value={draft} onChangeText={setDraft} multiline editable={!saving}
          textAlignVertical="top" style={styles.input} autoFocus />
        <Text style={[styles.counter, length > 280 && styles.error]}>{length}/280</Text>
        {length > 280 && <Text accessibilityRole="alert" style={styles.error}>{copy.limit}</Text>}
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" disabled={saving} accessibilityState={{ disabled: saving }}
            onPress={() => { setDraft(saved ?? ""); setEditing(false); setError(""); }} style={styles.secondary}>
            <Text style={styles.link}>{copy.cancel}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel={copy.save}
            disabled={saving || length > 280 || draft.trim() === saved}
            accessibilityState={{ disabled: saving || length > 280 || draft.trim() === saved, busy: saving }}
            onPress={save} style={[styles.primary, (saving || length > 280 || draft.trim() === saved) && styles.disabled]}>
            <Text style={styles.primaryText}>{saving ? copy.saving : copy.save}</Text>
          </Pressable>
        </View>
      </>}
      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      {saved === undefined && !!error && <Pressable accessibilityRole="button" style={styles.secondary}
        onPress={() => { setError(""); setAttempt(attempt + 1); }}><Text style={styles.link}>{copy.retry}</Text></Pressable>}
      {!!notice && <Text accessibilityRole="alert" style={styles.notice}>{notice}</Text>}
    </View>
  );
}
const styles = StyleSheet.create({
  card: { marginTop: 14, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 14, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8df", gap: 5 },
  heading: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12 },
  title: { color: "#12382d", fontSize: 11, fontWeight: "700" },
  link: { color: "#204d42", fontSize: 11, fontWeight: "600" },
  message: { color: "#12382d", fontSize: 13, lineHeight: 19 }, muted: { color: "#536761" },
  input: { minHeight: 110, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#8a9d94", padding: 12, color: "#12382d", fontSize: 16, lineHeight: 24 },
  counter: { textAlign: "right", fontSize: 12, color: "#536761" },
  actions: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: 10 },
  primary: { backgroundColor: "#12382d", padding: 12, borderRadius: 12, minHeight: 44, justifyContent: "center" },
  primaryText: { color: "#fff", fontWeight: "600" }, disabled: { opacity: 0.5 },
  secondary: { padding: 12, minHeight: 44, justifyContent: "center" },
  error: { color: "#9b2929", fontSize: 14 }, notice: { color: "#204d42", fontSize: 14 },
});
