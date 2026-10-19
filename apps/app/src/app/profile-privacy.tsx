// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { router } from "expo-router";
import type { User } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProfileButton, ProfileNotice, profileStyles as styles } from "@/components/profile/ProfileControls";
import { apiErrorMessage } from "@/lib/api";
import { getProfilePrivacy, saveProfilePrivacy, type ProfilePrivacy } from "@/lib/profiles";
import { useSession } from "@/lib/session";
import { profileText as copy } from "@/locales/en/profiles";

export default function ProfilePrivacyScreen() {
  const { user } = useSession();
  return user ? <PrivacyForm key={user.uid} user={user} /> : null;
}
function PrivacyForm({ user }: { user: User }) {
  const [draft, setDraft] = useState<ProfilePrivacy>();
  const [saved, setSaved] = useState<ProfilePrivacy>();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    let current = true;
    getProfilePrivacy(user).then((settings) => {
      if (current) { setDraft(settings); setSaved(settings); }
    }).catch((reason) => { if (current) setError(apiErrorMessage(reason)); });
    return () => { current = false; };
  }, [user, attempt]);

  const save = async () => {
    if (!draft || saving) return;
    setSaving(true); setError(""); setSuccess(false);
    try {
      const settings = await saveProfilePrivacy(user, draft);
      if (mounted.current) { setDraft(settings); setSaved(settings); setSuccess(true); }
    } catch (reason) {
      if (mounted.current) setError(apiErrorMessage(reason));
    } finally { if (mounted.current) setSaving(false); }
  };
  const change = (key: keyof ProfilePrivacy, value: boolean) => {
    setDraft((current) => current && { ...current, [key]: value });
    setSuccess(false);
  };
  const dirty = draft && saved && Object.keys(draft).some(
    (key) => draft[key as keyof ProfilePrivacy] !== saved[key as keyof ProfilePrivacy],
  );

  return <SafeAreaView style={styles.safe}>
    <ScrollView contentContainerStyle={styles.content}>
      <ProfileButton onPress={() => router.replace("/profile")}>{copy.back}</ProfileButton>
      <Text accessibilityRole="header" style={styles.title}>{copy.privacyTitle}</Text>
      <Text style={styles.body}>{copy.privacyIntro}</Text>
      {!draft && !error && <ActivityIndicator accessibilityLabel={copy.loading} />}
      {!!error && <ProfileNotice error>{error}</ProfileNotice>}
      {!draft && !!error && <ProfileButton onPress={() => { setError(""); setAttempt((value) => value + 1); }}>{copy.retry}</ProfileButton>}
      {draft && <>
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.label}>{copy.visibilityLabel}</Text>
            <Switch accessibilityLabel={copy.visibilityLabel} value={draft.profileVisible}
              onValueChange={(value) => change("profileVisible", value)} disabled={saving}
              trackColor={{ false: "#d9d5d0", true: "#1d5c4d" }} />
          </View>
          <Text style={styles.body}>{copy.visibilityDetail}</Text>
        </View>
        {!draft.profileVisible && <ProfileNotice>{copy.privateNotice}</ProfileNotice>}
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>{copy.sectionsTitle}</Text>
          <Text style={styles.body}>{copy.sectionsDetail}</Text>
          {Object.entries(copy.sections).map(([key, label]) => <View key={key} style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Switch accessibilityLabel={label} value={draft[key as keyof ProfilePrivacy]}
              disabled={saving} onValueChange={(value) => change(key as keyof ProfilePrivacy, value)}
              trackColor={{ false: "#d9d5d0", true: "#1d5c4d" }} />
          </View>)}
        </View>
        {success && <ProfileNotice>{copy.saved}</ProfileNotice>}
        <ProfileButton disabled={!dirty || saving} onPress={() => { void save(); }}>
          {saving ? copy.saving : copy.save}
        </ProfileButton>
      </>}
    </ScrollView>
  </SafeAreaView>;
}
