// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import type { RallyUser } from "@/lib/api";
import { SocialLinks } from "./socialLinks";
import { sharedStyles } from "./styles";

function ThoughtBubble({
  thoughtText,
  onPress,
}: {
  thoughtText?: string | null;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={thoughtText ? "Edit thought" : "Add a thought"}
      onPress={onPress}
      style={styles.thoughtBubbleButton}
    >
      <View style={styles.thoughtBubble}>
        <Text numberOfLines={3} style={styles.thoughtBubbleText}>
          {thoughtText || "Your thought"}
        </Text>
        <View style={styles.thoughtBubbleTail} />
        <View style={styles.thoughtBubbleTailDot} />
      </View>
    </Pressable>
  );
}

// The profile photo, or a silhouette when there isn't one. With a photo, a tap
// opens the photo options; without one, it goes straight to the library.
function AvatarPicker({
  photoUrl,
  saving,
  onShowActions,
  onChoose,
}: {
  photoUrl?: string | null;
  saving: boolean;
  onShowActions: () => void;
  onChoose: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={photoUrl ? "Profile photo options" : "Change profile photo"}
      onPress={photoUrl ? onShowActions : onChoose}
      disabled={saving}
      style={styles.avatarPicker}
    >
      <View
        style={[
          styles.avatarBadge,
          photoUrl ? styles.avatarBadgeWithPhoto : styles.avatarBadgeEmpty,
        ]}
      >
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.profilePhoto} />
        ) : (
          <View style={styles.avatarSilhouette}>
            <View style={styles.avatarHead} />
            <View style={styles.avatarBody} />
          </View>
        )}
      </View>
      <View style={styles.photoActionBadge}>
        <Text style={styles.photoActionIcon}>{photoUrl ? "✎" : "📷"}</Text>
      </View>
    </Pressable>
  );
}

function LookingForTeamBadge() {
  return (
    <View testID="looking-for-team-badge" style={styles.lookingBadge}>
      <View style={styles.lookingDot} />
      <Text style={styles.lookingBadgeText}>Looking for a team</Text>
    </View>
  );
}

// The top of the profile: thought, photo, name and links.
export function AvatarSection({
  account,
  photo,
  onOpenThought,
  lookingForTeam,
}: {
  account: RallyUser | null | undefined;
  photo: {
    saving: boolean;
    error: string;
    actionsVisible: boolean;
    setActionsVisible: (visible: boolean) => void;
    choose: () => Promise<void>;
  };
  onOpenThought: () => void;
  lookingForTeam: boolean;
}) {
  return (
    <View style={styles.avatarSection}>
      <ThoughtBubble thoughtText={account?.thoughtText} onPress={onOpenThought} />
      <AvatarPicker
        photoUrl={account?.profilePhotoUrl}
        saving={photo.saving}
        onShowActions={() => photo.setActionsVisible(true)}
        onChoose={() => void photo.choose()}
      />
      {!photo.actionsVisible && !!photo.error && (
        <Text style={sharedStyles.photoError}>{photo.error}</Text>
      )}
      <Text style={styles.playerName}>{account?.displayName}</Text>
      <SocialLinks account={account} />
      {lookingForTeam && <LookingForTeamBadge />}
    </View>
  );
}

const styles = StyleSheet.create({
  avatarSection: {
    alignItems: "center",
    marginTop: 8,
  },
  thoughtBubbleButton: {
    alignItems: "center",
    marginBottom: 3,
    transform: [{ translateX: 16 }],
  },
  avatarBadge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#d5d9d1",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarPicker: {
    width: 88,
    height: 88,
  },
  avatarBadgeEmpty: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#a9b6ae",
  },
  avatarBadgeWithPhoto: {
    borderWidth: 2,
    borderColor: "#1d5c4d",
  },
  avatarSilhouette: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  avatarHead: {
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: "#a4aea8",
  },
  avatarBody: {
    width: 34,
    height: 17,
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
    backgroundColor: "#a4aea8",
  },
  photoActionBadge: {
    position: "absolute",
    right: -2,
    bottom: 1,
    width: 25,
    height: 25,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: "#f7f4f1",
    backgroundColor: "#1d5c4d",
    alignItems: "center",
    justifyContent: "center",
  },
  photoActionIcon: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  profilePhoto: {
    width: "100%",
    height: "100%",
    borderRadius: 100,
  },
  thoughtBubble: {
    maxWidth: 260,
    minWidth: 162,
    minHeight: 50,
    paddingHorizontal: 19,
    paddingVertical: 13,
    borderRadius: 26,
    backgroundColor: "#f8f8f6",
    shadowColor: "#12382d",
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  thoughtBubbleText: {
    color: "#68706c",
    fontSize: 16,
    fontWeight: "500",
    textAlign: "center",
  },
  thoughtBubbleTail: {
    position: "absolute",
    bottom: -10,
    left: 30,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#f8f8f6",
    transform: [{ rotate: "28deg" }],
  },
  thoughtBubbleTailDot: {
    position: "absolute",
    bottom: -21,
    left: 46,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: "#f8f8f6",
  },
  playerName: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: "800",
    color: "#12382d",
  },
  lookingBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    backgroundColor: "#dfe9e4",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  lookingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1d5c4d",
    marginRight: 6,
  },
  lookingBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#12382d",
  },
});
