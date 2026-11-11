// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { router } from "expo-router";
import * as Linking from "expo-linking";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import type { RallyUser } from "@/lib/api";

const InstagramLogo = () => (
  <View style={styles.instagramLogo}>
    <View style={styles.instagramLens} />
    <View style={styles.instagramDot} />
  </View>
);

const FacebookLogo = () => (
  <View style={styles.facebookLogo}>
    <Text style={styles.facebookLogoText}>f</Text>
  </View>
);

// Opens the link, or Settings (where it can be added) when there isn't one.
const openSocialLink = (name: string, url: string | null | undefined) =>
  url
    ? Linking.openURL(url).catch(() => {
        Alert.alert(`Unable to open ${name}`, "Please try opening the link again.");
      })
    : router.push("/settings");

function SocialLink({
  name,
  url,
  Logo,
}: {
  name: string;
  url: string | null | undefined;
  Logo: () => React.JSX.Element;
}) {
  return (
    <Pressable
      accessibilityRole={url ? "link" : "button"}
      accessibilityLabel={`${name}${url ? " profile" : " (not connected)"}`}
      onPress={() => void openSocialLink(name, url)}
      style={[styles.socialLink, !url && styles.socialLinkPlaceholder]}
    >
      <Logo />
      <View>
        <Text style={styles.socialLinkText}>{name}</Text>
        <Text
          accessibilityLabel={`${name} ${url ? "connected" : "not connected"}`}
          testID={`${name.toLowerCase()}-status`}
          style={styles.socialLinkStatus}
        >
          {url ? "Connected" : "Not connected"}
        </Text>
      </View>
    </Pressable>
  );
}

// The Instagram and Facebook links under the player's name.
export function SocialLinks({ account }: { account: RallyUser | null | undefined }) {
  return (
    <View style={styles.socialLinks}>
      <SocialLink name="Instagram" url={account?.instagramUrl} Logo={InstagramLogo} />
      <SocialLink name="Facebook" url={account?.facebookUrl} Logo={FacebookLogo} />
    </View>
  );
}

const styles = StyleSheet.create({
  socialLinks: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  socialLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 132,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: "#f7f5f2",
    borderWidth: 1,
    borderColor: "#d9d5d0",
  },
  socialLinkPlaceholder: {
    opacity: 0.55,
  },
  socialLinkText: {
    fontSize: 13,
    fontWeight: "700",
  },
  socialLinkStatus: {
    color: "#687872",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 1,
  },
  instagramLogo: {
    width: 25,
    height: 25,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#1d5c4d",
    alignItems: "center",
    justifyContent: "center",
  },
  instagramLens: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#1d5c4d",
  },
  instagramDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d62976",
  },
  facebookLogo: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#1d5c4d",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  facebookLogoText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 24,
  },
});
