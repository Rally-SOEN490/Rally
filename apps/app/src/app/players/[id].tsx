// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { router, useLocalSearchParams } from "expo-router";
import type { User } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BadgeGallery } from "@/components/profile/BadgeGallery";
import {
  ProfileButton,
  ProfileNotice,
  profileStyles as styles,
} from "@/components/profile/ProfileControls";
import { ApiError, apiErrorMessage } from "@/lib/api";
import { getPlayerProfile, type PlayerProfile } from "@/lib/profiles";
import { useProfileIntent } from "@/lib/profile-intent";
import { useSession } from "@/lib/session";
import { profileText as copy } from "@/locales/en/profiles";

export default function PlayerProfileRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, account } = useSession();
  const { clearProfileIntent } = useProfileIntent();
  useEffect(clearProfileIntent, [clearProfileIntent]);
  return user ? (
    <Player
      key={`${user.uid}/${id}`}
      user={user}
      id={id}
      isOwner={account?.id === id}
    />
  ) : null;
}
function Player({
  user,
  id,
  isOwner,
}: {
  user: User;
  id: string;
  isOwner: boolean;
}) {
  const [profile, setProfile] = useState<PlayerProfile>();
  const [error, setError] = useState<{
    message: string;
    unavailable: boolean;
  }>();
  const [linkError, setLinkError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let current = true;
    getPlayerProfile(user, id)
      .then((value) => {
        if (current) setProfile(value);
      })
      .catch((reason) => {
        if (current)
          setError({
            message: apiErrorMessage(reason),
            unavailable:
              reason instanceof ApiError &&
              (reason.status === 404 || reason.status === 400),
          });
      });
    return () => {
      current = false;
    };
  }, [user, id, attempt]);
  const openSocial = async (url: string) => {
    try {
      await Linking.openURL(url);
      setLinkError("");
    } catch {
      setLinkError(copy.openSocialFailed);
    }
  };
  const hasDetails =
    profile &&
    (profile.photoUrl ||
      profile.bio ||
      profile.statusMessage ||
      profile.interests?.length ||
      profile.memberSince ||
      profile.badges?.length ||
      profile.socialLinks?.facebook ||
      profile.socialLinks?.instagram);
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <ProfileButton onPress={() => router.replace("/profile")}>
          {copy.back}
        </ProfileButton>
        {!profile && !error && (
          <ActivityIndicator accessibilityLabel={copy.loading} />
        )}
        {error && (
          <>
            <Text accessibilityRole="header" style={styles.title}>
              {error.unavailable ? copy.unavailableTitle : copy.playerTitle}
            </Text>
            <ProfileNotice error>
              {error.unavailable ? copy.unavailable : error.message}
            </ProfileNotice>
            {!error.unavailable && (
              <ProfileButton
                onPress={() => {
                  setError(undefined);
                  setAttempt((value) => value + 1);
                }}
              >
                {copy.retry}
              </ProfileButton>
            )}
          </>
        )}
        {profile && (
          <>
            <View style={local.header}>
              {profile.photoUrl ? (
                <Image
                  source={{ uri: profile.photoUrl }}
                  style={local.avatar}
                  accessibilityLabel={profile.displayName}
                />
              ) : (
                <View style={[local.avatar, local.fallback]}>
                  <Text style={local.initial}>
                    {profile.displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <Text accessibilityRole="header" style={styles.title}>
                {profile.displayName}
              </Text>
              {profile.memberSince && (
                <Text style={styles.body}>
                  {copy.memberSince}{" "}
                  {new Date(profile.memberSince).toLocaleDateString(undefined, {
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
              )}
            </View>
            {!!profile.statusMessage && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{copy.statusTitle}</Text>
                <Text style={styles.body}>{profile.statusMessage}</Text>
              </View>
            )}
            {!!profile.bio && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{copy.bioTitle}</Text>
                <Text style={styles.body}>{profile.bio}</Text>
              </View>
            )}
            {profile.badges && <BadgeGallery badges={profile.badges} />}
            {!!profile.interests?.length && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{copy.interestsTitle}</Text>
                <View style={local.tags}>
                  {profile.interests.map((interest) => (
                    <View style={local.tag} key={interest}>
                      <Text style={styles.body}>{interest}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {(profile.socialLinks?.facebook ||
              profile.socialLinks?.instagram) && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>{copy.socialsTitle}</Text>
                {profile.socialLinks.facebook && (
                  <ProfileButton
                    onPress={() => {
                      void openSocial(profile.socialLinks!.facebook!);
                    }}
                  >
                    {copy.facebook}
                  </ProfileButton>
                )}
                {profile.socialLinks.instagram && (
                  <ProfileButton
                    onPress={() => {
                      void openSocial(profile.socialLinks!.instagram!);
                    }}
                  >
                    {copy.instagram}
                  </ProfileButton>
                )}
                {!!linkError && (
                  <ProfileNotice error>{linkError}</ProfileNotice>
                )}
              </View>
            )}
            {!hasDetails && <ProfileNotice>{copy.noDetails}</ProfileNotice>}
          </>
        )}
        {isOwner && (
          <ProfileButton onPress={() => router.push("/profile-privacy")}>
            {copy.managePrivacy}
          </ProfileButton>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const local = StyleSheet.create({
  header: { alignItems: "center", gap: 12, paddingVertical: 14 },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 4,
    borderColor: "#f7f4f1",
  },
  fallback: {
    backgroundColor: "#d5d9d1",
    alignItems: "center",
    justifyContent: "center",
  },
  initial: { fontSize: 48, fontWeight: "700", color: "#12382d" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#dfe9e4",
  },
});
