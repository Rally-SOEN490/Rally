import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  apiErrorMessage,
  BIO_MAX_LENGTH,
  NAME_MAX_LENGTH,
  updateMyProfile,
  uploadMyProfilePhoto,
} from "@/lib/api";
import type { RallyUser } from "@/lib/api";
import { useSession } from "@/lib/session";

const stats = [
  { label: "Matches", value: "132" },
  { label: "Wins", value: "90" },
  { label: "Top 4", value: "11" },
  { label: "Events", value: "9" },
];

const interested = ["Beach 2s", "Indoor 6s", "Cobra 6s", "Weekend leagues"];
const results = [
  { title: "Nationals, 9-man", year: "Jul 2026", accent: "#f3e5c9" },
  { title: "Summer Slam 6s", year: "Jun 2026", accent: "#f7d7b4" },
  { title: "Verdun Spring Open", year: "May 2026", accent: "#e0e7b8" },
  { title: "Fall Classic 6s", year: "Sep 2025", accent: "#d9e8dc" },
];

const badgeImages = {
  "badge-gold-placeholder": require("@/assets/images/badge-gold-placeholder.png"),
} as const;

const tierColors = {
  Bronze: "#8c5a3c",
  Silver: "#9aa1a8",
  Gold: "#d4a72c",
} as const;

export default function Profile() {
  // The guards in _layout.tsx only show Profile to someone with a Rally account.
  const { user, account, setAccount } = useSession();
  const [selectedBadge, setSelectedBadge] = useState<RallyUser["badges"][number] | null>(
    null,
  );
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(account?.displayName ?? "");
  const [bio, setBio] = useState(account?.bio ?? "");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoMimeType, setPhotoMimeType] = useState<string | null>(null);

  const openEditor = () => {
    setDisplayName(account?.displayName ?? "");
    setBio(account?.bio ?? "");
    setPhotoUri(null);
    setPhotoMimeType(null);
    setSaveError("");
    setEditing(true);
  };

  const choosePhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
      setSaveError("Choose a photo smaller than 5 MB.");
      return;
    }
    if (asset.mimeType && !["image/jpeg", "image/png", "image/webp"].includes(asset.mimeType)) {
      setSaveError("Use a JPEG, PNG, or WebP image.");
      return;
    }
    setPhotoUri(asset.uri);
    setPhotoMimeType(asset.mimeType ?? null);
    setSaveError("");
  };

  const saveProfile = async () => {
    if (!user) return;
    if (!displayName.trim()) {
      setSaveError("Please enter a display name.");
      return;
    }

    setSaving(true);
    setSaveError("");
    try {
      let updated = await updateMyProfile(user, displayName.trim(), bio);
      setAccount(updated);
      if (photoUri) updated = await uploadMyProfilePhoto(user, {
        uri: photoUri,
        mimeType: photoMimeType,
      });
      setAccount(updated);
      setEditing(false);
    } catch (error) {
      setSaveError(apiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            onPress={() => router.push("/settings")}
            style={styles.gearButton}
          >
            <Text style={styles.gearIcon}>⚙️</Text>
          </Pressable>
        </View>

        <View style={styles.avatarSection}>
          <View style={styles.avatarBadge}>
            {account?.profilePhotoUrl ? (
              <Image source={{ uri: account.profilePhotoUrl }} style={styles.profilePhoto} />
            ) : (
              <Text style={styles.avatarText}>{account?.displayName?.[0]?.toUpperCase() ?? "?"}</Text>
            )}
          </View>
          <Text style={styles.playerName}>{account?.displayName}</Text>
          <Text style={styles.playerMeta}>Outside hitter • Sunbirds</Text>
          <Text style={styles.playerBio}>
            {account?.bio || "Add a short bio to introduce yourself."}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit profile"
            onPress={openEditor}
            style={styles.editProfileButton}
          >
            <Text style={styles.editProfileButtonText}>Edit profile</Text>
          </Pressable>
        </View>

        <View style={styles.teamBanner}>
          <View style={styles.teamBadge}>
            <Text style={styles.teamEmoji}>🌿</Text>
          </View>
          <View style={styles.teamInfo}>
            <Text style={styles.teamName}>Sunbirds</Text>
            <Text style={styles.teamMeta}>Co-ed 6s • Captain</Text>
          </View>
          <View style={styles.teamTag}>
            <Text style={styles.teamTagText}>Rank</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          {stats.map((stat) => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.awardsSection}>
          <Text style={styles.sectionTitle}>Awards</Text>
          <ScrollView
            horizontal
            accessible
            accessibilityLabel="Scrollable awards"
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.awardsRow}
          >
            {[...(account?.badges ?? [])]
              .sort(
                (left, right) =>
                  right.receivedCount - left.receivedCount ||
                  left.key.localeCompare(right.key),
              )
              .map((badge) => (
              <Pressable
                key={badge.key}
                accessibilityRole="button"
                accessibilityLabel={`${badge.name} badge`}
                onPress={() => setSelectedBadge(badge)}
                style={styles.awardBadge}
              >
                <View style={styles.awardImageWrapper}>
                  {badge.tier === "Gold" && (
                    <>
                      <Text style={[styles.goldStar, styles.goldStarTop]}>✦</Text>
                      <Text style={[styles.goldStar, styles.goldStarRight]}>✦</Text>
                      <Text style={[styles.goldStar, styles.goldStarBottom]}>✦</Text>
                      <Text style={[styles.goldStar, styles.goldStarLeft]}>✦</Text>
                    </>
                  )}
                  <Image
                    accessibilityLabel={`${badge.name} badge image`}
                    source={badgeImages[badge.image as keyof typeof badgeImages]}
                    style={[
                      styles.awardImage,
                      { borderColor: tierColors[badge.tier as keyof typeof tierColors] },
                    ]}
                  />
                </View>
                <Text style={styles.awardName}>{badge.name}</Text>
              </Pressable>
              ))}
          </ScrollView>
        </View>

        <View style={styles.tagSection}>
          <Text style={styles.sectionTitle}>Interested in</Text>
          <View style={styles.tagRow}>
            {interested.map((tag) => (
              <View key={tag} style={styles.tagPill}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.resultsSection}>
          <View style={styles.resultsHeader}>
            <Text style={styles.sectionTitle}>Results</Text>
            <Text style={styles.linkText}>See all</Text>
          </View>
          <View style={styles.resultList}>
            {results.map((result) => (
              <View key={result.title} style={styles.resultItem}>
                <View style={[styles.resultBadge, { backgroundColor: result.accent }]}>
                  <Text style={styles.resultBadgeText}>🏆</Text>
                </View>
                <View style={styles.resultInfo}>
                  <Text style={styles.resultTitle}>{result.title}</Text>
                </View>
                <Text style={styles.resultYear}>{result.year}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={editing}
        transparent
        animationType="slide"
        onRequestClose={() => setEditing(false)}
      >
        <View style={styles.editorBackdrop}>
          <View style={styles.profileEditor}>
            <Text style={styles.editorTitle}>Edit profile</Text>
            <View style={styles.photoEditorRow}>
              <View style={styles.photoPreview}>
                {photoUri || account?.profilePhotoUrl ? (
                  <Image
                    source={{ uri: photoUri ?? account?.profilePhotoUrl ?? undefined }}
                    style={styles.profilePhoto}
                  />
                ) : (
                  <Text style={styles.photoPreviewInitial}>
                    {displayName[0]?.toUpperCase() ?? "?"}
                  </Text>
                )}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Change profile photo"
                onPress={choosePhoto}
                disabled={saving}
                style={styles.choosePhotoButton}
              >
                <Text style={styles.choosePhotoButtonText}>
                  {photoUri ? "Choose another photo" : "Change photo"}
                </Text>
              </Pressable>
            </View>
            <Text style={styles.editorLabel}>Display name</Text>
            <TextInput
              accessibilityLabel="Display name"
              maxLength={NAME_MAX_LENGTH}
              value={displayName}
              onChangeText={setDisplayName}
              style={styles.editorInput}
              returnKeyType="next"
            />
            <Text style={styles.editorLabel}>Bio</Text>
            <TextInput
              accessibilityLabel="Bio"
              maxLength={BIO_MAX_LENGTH}
              multiline
              value={bio}
              onChangeText={setBio}
              placeholder="Tell other players about yourself"
              placeholderTextColor="#78857f"
              style={[styles.editorInput, styles.bioInput]}
              textAlignVertical="top"
            />
            <Text style={styles.bioCharacterCount}>
              {bio.length}/{BIO_MAX_LENGTH}
            </Text>
            {!!saveError && <Text style={styles.editorError}>{saveError}</Text>}
            <View style={styles.editorActions}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setEditing(false)}
                disabled={saving}
                style={styles.cancelEditButton}
              >
                <Text style={styles.cancelEditButtonText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Save profile"
                onPress={saveProfile}
                disabled={saving}
                style={styles.saveEditButton}
              >
                <Text style={styles.saveEditButtonText}>{saving ? "Saving..." : "Save"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={selectedBadge !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}
      >
        <Pressable
          onPress={() => setSelectedBadge(null)}
          style={styles.modalBackdrop}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            style={styles.badgeDetails}
          >
            <Text style={styles.badgeDetailsTitle}>{selectedBadge?.name}</Text>
            <Text style={styles.badgeDetailsTier}>{selectedBadge?.tier} tier</Text>
            <Text style={styles.badgeDetailsDescription}>
              {selectedBadge?.description}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close badge details"
              onPress={() => setSelectedBadge(null)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      <View style={styles.navBar}>
        {[
          { label: "Home" },
          { label: "Events" },
          { label: "Search" },
          { label: "Notifications" },
          { label: "You", active: true },
        ].map((item) => (
          <Pressable
            key={item.label}
            style={[styles.navItem, item.active && styles.navItemActive]}
            onPress={() => {
              if (item.label === "Home") router.replace("/home");
            }}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <Text style={[styles.navIcon, item.active && styles.navIconActive]}>
              {item.label === "Home" ? "⌂" : item.label === "Events" ? "◫" : item.label === "Search" ? "⌕" : item.label === "Notifications" ? "◔" : "◉"}
            </Text>
            <Text style={[styles.navLabel, item.active && styles.navLabelActive]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#e8e4df",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 110,
  },
  profileHeader: {
    alignItems: "flex-end",
    paddingTop: 18,
    paddingBottom: 8,
  },
  gearButton: {
    backgroundColor: "#f4f1ee",
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  gearIcon: {
    fontSize: 20,
  },
  avatarSection: {
    alignItems: "center",
    marginTop: 8,
  },
  avatarBadge: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "#d5d9d1",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#f7f4f1",
  },
  avatarText: {
    fontSize: 52,
    fontWeight: "700",
    color: "#12382d",
  },
  profilePhoto: {
    width: "100%",
    height: "100%",
    borderRadius: 100,
  },
  photoEditorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },
  photoPreview: {
    width: 68,
    height: 68,
    borderRadius: 34,
    overflow: "hidden",
    backgroundColor: "#d5d9d1",
    alignItems: "center",
    justifyContent: "center",
  },
  photoPreviewInitial: {
    color: "#12382d",
    fontSize: 30,
    fontWeight: "700",
  },
  choosePhotoButton: {
    borderWidth: 1,
    borderColor: "#9aa8a1",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  choosePhotoButtonText: {
    color: "#12382d",
    fontSize: 13,
    fontWeight: "700",
  },
  playerName: {
    marginTop: 12,
    fontSize: 28,
    fontWeight: "800",
    color: "#12382d",
  },
  playerMeta: {
    marginTop: 2,
    fontSize: 15,
    color: "#536761",
  },
  playerBio: {
    maxWidth: 320,
    marginTop: 12,
    color: "#344b43",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  editProfileButton: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#9aa8a1",
    borderRadius: 8,
  },
  editProfileButtonText: {
    color: "#12382d",
    fontSize: 13,
    fontWeight: "700",
  },
  editorBackdrop: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(18, 56, 45, 0.45)",
    padding: 20,
  },
  profileEditor: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    backgroundColor: "#f7f4f1",
    borderRadius: 12,
    padding: 20,
  },
  editorTitle: {
    color: "#12382d",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 18,
  },
  editorLabel: {
    color: "#344b43",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  editorInput: {
    minHeight: 44,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#b8c0ba",
    borderRadius: 8,
    color: "#173a30",
    fontSize: 15,
  },
  bioInput: {
    minHeight: 110,
  },
  bioCharacterCount: {
    marginTop: -10,
    marginBottom: 12,
    color: "#536761",
    fontSize: 12,
    textAlign: "right",
  },
  editorError: {
    marginBottom: 12,
    color: "#a12f25",
    fontSize: 13,
  },
  editorActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 4,
  },
  cancelEditButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  cancelEditButtonText: {
    color: "#344b43",
    fontWeight: "700",
  },
  saveEditButton: {
    minWidth: 82,
    alignItems: "center",
    backgroundColor: "#12382d",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  saveEditButtonText: {
    color: "#f7f4f1",
    fontWeight: "700",
  },
  teamBanner: {
    backgroundColor: "#12382d",
    borderRadius: 20,
    padding: 14,
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  teamBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#dfe9e4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  teamEmoji: {
    fontSize: 20,
  },
  teamInfo: {
    flex: 1,
  },
  teamName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#f5f3ef",
  },
  teamMeta: {
    fontSize: 12,
    color: "#d9dfd7",
    marginTop: 4,
  },
  teamTag: {
    backgroundColor: "#f3f6f5",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  teamTagText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#12382d",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f2f0ed",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d9d5d0",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "800",
    color: "#12382d",
  },
  statLabel: {
    fontSize: 12,
    color: "#536761",
    marginTop: 6,
  },
  awardsSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#12382d",
  },
  awardsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
    paddingRight: 4,
  },
  awardBadge: {
    width: 72,
    minHeight: 82,
    borderRadius: 16,
    backgroundColor: "#dfe9e4",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  awardImage: {
    width: 34,
    height: 34,
    borderWidth: 3,
    borderRadius: 17,
  },
  awardImageWrapper: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  goldStar: {
    position: "absolute",
    color: "#d4a72c",
    fontSize: 11,
    lineHeight: 11,
  },
  goldStarTop: {
    top: 0,
  },
  goldStarRight: {
    right: 0,
  },
  goldStarBottom: {
    bottom: 0,
  },
  goldStarLeft: {
    left: 0,
  },
  awardName: {
    color: "#12382d",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 5,
    textAlign: "center",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(18, 56, 45, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  badgeDetails: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#f7f4f1",
    borderRadius: 20,
    padding: 22,
    alignItems: "center",
  },
  badgeDetailsTitle: {
    color: "#12382d",
    fontSize: 22,
    fontWeight: "800",
  },
  badgeDetailsTier: {
    color: "#536761",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 5,
  },
  badgeDetailsDescription: {
    color: "#536761",
    fontSize: 15,
    lineHeight: 21,
    marginTop: 14,
    textAlign: "center",
  },
  closeButton: {
    backgroundColor: "#12382d",
    borderRadius: 999,
    marginTop: 20,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  closeButtonText: {
    color: "#f7f4f1",
    fontSize: 13,
    fontWeight: "700",
  },
  tagSection: {
    marginTop: 22,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  tagPill: {
    backgroundColor: "#f2f0ed",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#d9d5d0",
  },
  tagText: {
    fontSize: 12,
    color: "#12382d",
    fontWeight: "600",
  },
  resultsSection: {
    marginTop: 24,
  },
  resultsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  linkText: {
    fontSize: 14,
    color: "#204d42",
    fontWeight: "600",
  },
  resultList: {
    marginTop: 12,
    gap: 10,
  },
  resultItem: {
    backgroundColor: "#f2f0ed",
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d9d5d0",
  },
  resultBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  resultBadgeText: {
    fontSize: 18,
  },
  resultInfo: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#12382d",
  },
  resultYear: {
    fontSize: 12,
    color: "#5d6c68",
    fontWeight: "600",
  },
  navBar: {
    position: "absolute",
    bottom: 14,
    left: 20,
    right: 20,
    backgroundColor: "#f2f0ed",
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "#d9d5d0",
    paddingVertical: 10,
    paddingHorizontal: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  navItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 16,
  },
  navItemActive: {
    backgroundColor: "#dfe9e4",
  },
  navIcon: {
    fontSize: 18,
    color: "#4d5d58",
  },
  navIconActive: {
    color: "#12382d",
  },
  navLabel: {
    fontSize: 10,
    marginTop: 4,
    color: "#4d5d58",
    fontWeight: "600",
  },
  navLabelActive: {
    color: "#12382d",
  },
});
