// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { router } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Linking from "expo-linking";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { apiErrorMessage, updateMyAccount, type RallyUser } from "@/lib/api";
import { useSession } from "@/lib/session";

const stats = [
  { label: "Matches", value: "132" },
  { label: "Wins", value: "90" },
  { label: "Top 4", value: "11" },
  { label: "Events", value: "9" },
];

const interestFormats = [
  { key: "indoor-6s", label: "Indoor 6s" },
  { key: "beach-2s", label: "Beach 2s" },
  { key: "9-man", label: "9-man" },
] as const;
const interestPositions = [
  { key: "libero", label: "Libero" },
  { key: "outside", label: "Outside" },
  { key: "setter", label: "Setter" },
  { key: "middle", label: "Middle" },
  { key: "opposite", label: "Opposite" },
] as const;
type InterestCategory = "formats" | "positions";
type InterestOption = (typeof interestFormats)[number] | (typeof interestPositions)[number];
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

const getBadgeProgress = (receivedCount: number, nextTierThreshold?: number | null) => {
  const safeCount = Math.max(0, receivedCount);
  const target = nextTierThreshold ?? (Math.floor(safeCount / 10) + 1) * 10;

  return {
    target,
    percentage: Math.min(safeCount / target, 1),
  };
};

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

const InterestPills = ({
  category,
  options,
  selectedKeys,
  saving,
  onToggle,
}: {
  category: InterestCategory;
  options: readonly InterestOption[];
  selectedKeys: string[];
  saving: boolean;
  onToggle: (category: InterestCategory, key: string) => void;
}) => (
  <View style={styles.tagRow}>
    {options.map(({ key, label }) => {
      const selected = selectedKeys.includes(key);
      return (
        <Pressable
          key={key}
          accessibilityRole="button"
          accessibilityLabel={`${label}${selected ? " selected" : ""}`}
          accessibilityState={{ selected, disabled: saving }}
          disabled={saving}
          onPress={() => onToggle(category, key)}
          style={[styles.tagPill, selected && styles.tagPillSelected]}
        >
          <Text style={[styles.tagText, selected && styles.tagTextSelected]}>{label}</Text>
        </Pressable>
      );
    })}
  </View>
);

export default function Profile() {
  // The guards in _layout.tsx only show Profile to someone with a Rally account.
  const { user, account, setAccount, selectedBadgeKeys } = useSession();
  const [selectedBadge, setSelectedBadge] = useState<RallyUser["badges"][number] | null>(null);
  const hasSavedShownBadges = account?.shownBadgeKeys !== undefined;
  const lookingForTeam = account?.lookingForTeam ?? false;
  // The switch shows this right away; the badge waits for the server.
  const [savingValue, setSavingValue] = useState<boolean>();
  const [saveError, setSaveError] = useState("");
  const saving = savingValue !== undefined;
  const [thoughtEditorVisible, setThoughtEditorVisible] = useState(false);
  const [thoughtText, setThoughtText] = useState(account?.thoughtText ?? "");
  const [thoughtSaving, setThoughtSaving] = useState(false);
  const [thoughtError, setThoughtError] = useState("");
  const [interestSelection, setInterestSelection] = useState(() => ({
    formats: account?.interests?.formats ?? [],
    positions: account?.interests?.positions ?? [],
  }));
  const [interestSaving, setInterestSaving] = useState(false);
  const [interestError, setInterestError] = useState("");

  const openThoughtEditor = () => {
    setThoughtText(account?.thoughtText ?? "");
    setThoughtError("");
    setThoughtEditorVisible(true);
  };

  const saveThought = async () => {
    if (!user) return;
    const text = thoughtText.trim();
    if (!text) {
      setThoughtError("Write a thought before sharing.");
      return;
    }
    setThoughtSaving(true);
    setThoughtError("");
    try {
      setAccount(
        await updateMyAccount(user, {
          thoughtText: text || null,
        }),
      );
      setThoughtEditorVisible(false);
    } catch (error) {
      setThoughtError(apiErrorMessage(error));
    } finally {
      setThoughtSaving(false);
    }
  };

  const deleteThought = async () => {
    if (!user) return;
    setThoughtSaving(true);
    setThoughtError("");
    try {
      setAccount(
        await updateMyAccount(user, {
          thoughtText: null,
        }),
      );
      setThoughtEditorVisible(false);
    } catch (error) {
      setThoughtError(apiErrorMessage(error));
    } finally {
      setThoughtSaving(false);
    }
  };

  const openProfilePictureEditor = () => {
    Alert.alert("Edit profile picture", "Profile picture selection will be available here.");
  };

  const changeLookingForTeam = async (value: boolean) => {
    if (!user) return;
    setSavingValue(value);
    setSaveError("");
    try {
      setAccount(await updateMyAccount(user, { lookingForTeam: value }));
    } catch (e) {
      setSaveError(apiErrorMessage(e));
    } finally {
      setSavingValue(undefined);
    }
  };

  const toggleInterest = async (category: InterestCategory, key: string) => {
    if (!user || interestSaving) return;
    const previousSelection = interestSelection;
    const nextSelection = {
      ...previousSelection,
      [category]: previousSelection[category].includes(key)
        ? previousSelection[category].filter((selectedKey) => selectedKey !== key)
        : [...previousSelection[category], key],
    };
    setInterestSelection(nextSelection);
    setInterestSaving(true);
    setInterestError("");
    try {
      setAccount(await updateMyAccount(user, { interests: nextSelection }));
    } catch (error) {
      setInterestSelection(previousSelection);
      setInterestError(apiErrorMessage(error));
    } finally {
      setInterestSaving(false);
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={account?.thoughtText ? "Edit thought" : "Add a thought"}
            onPress={openThoughtEditor}
            style={styles.thoughtBubbleButton}
          >
            <View style={styles.thoughtBubble}>
              <Text numberOfLines={3} style={styles.thoughtBubbleText}>
                {account?.thoughtText || "Your thought"}
              </Text>
              <View style={styles.thoughtBubbleTail} />
              <View style={styles.thoughtBubbleTailDot} />
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Edit profile picture"
            onPress={openProfilePictureEditor}
            style={styles.avatarWithThought}
          >
            <View style={styles.avatarBadge}>
              <Text style={styles.avatarText}>M</Text>
            </View>
            <View style={styles.profilePictureEditBadge}>
              <Text style={styles.profilePictureEditText}>✎</Text>
            </View>
          </Pressable>
          <Text style={styles.playerName}>{account?.displayName}</Text>
          <Text style={styles.playerMeta}>Outside hitter • Sunbirds</Text>
          <View style={styles.socialLinks}>
            {[
              {
                name: "Instagram",
                url: account?.instagramUrl,
                Logo: InstagramLogo,
              },
              {
                name: "Facebook",
                url: account?.facebookUrl,
                Logo: FacebookLogo,
              },
            ].map(({ name, url, Logo }) => (
              <Pressable
                key={name}
                accessibilityRole={url ? "link" : "button"}
                accessibilityLabel={`${name}${url ? " profile" : " (not connected)"}`}
                onPress={() =>
                  url
                    ? Linking.openURL(url).catch(() => {
                        Alert.alert(`Unable to open ${name}`, "Please try opening the link again.");
                      })
                    : router.push("/settings")
                }
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
            ))}
          </View>
          {lookingForTeam && (
            <View testID="looking-for-team-badge" style={styles.lookingBadge}>
              <View style={styles.lookingDot} />
              <Text style={styles.lookingBadgeText}>Looking for a team</Text>
            </View>
          )}
        </View>

        <View style={styles.lookingCard}>
          <View style={styles.lookingRow}>
            <View style={styles.lookingTextStack}>
              <Text style={styles.lookingTitle}>Looking for a team</Text>
              <Text style={styles.lookingHint}>Captains will see a badge on your profile.</Text>
            </View>
            {saving && (
              <ActivityIndicator
                size="small"
                color="#1d5c4d"
                accessibilityLabel="Saving"
                style={styles.lookingSpinner}
              />
            )}
            <Switch
              value={savingValue ?? lookingForTeam}
              onValueChange={changeLookingForTeam}
              disabled={saving}
              accessibilityLabel="Looking for a team"
              accessibilityHint="Shows captains that you're available"
              accessibilityState={{ disabled: saving, busy: saving }}
              trackColor={{ false: "#d9d5d0", true: "#1d5c4d" }}
            />
          </View>
          {!!saveError && (
            <Text accessibilityRole="alert" style={styles.saveError}>
              {saveError}
            </Text>
          )}
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
          <View style={styles.awardsHeader}>
            <Text style={styles.sectionTitle}>Awards</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View more awards"
              onPress={() => router.push("/awards")}
            >
              <Text style={styles.linkText}>View more</Text>
            </Pressable>
          </View>
          <View accessible accessibilityLabel="Awards" style={styles.awardsRow}>
            {[...(account?.badges ?? [])]
              .sort(
                (left, right) =>
                  right.receivedCount - left.receivedCount || left.key.localeCompare(right.key),
              )
              .filter((badge) =>
                hasSavedShownBadges ? selectedBadgeKeys.includes(badge.key) : true,
              )
              .slice(0, 4)
              .map((badge) => {
                const progress = badge.isComplete
                  ? null
                  : getBadgeProgress(badge.receivedCount, badge.nextTierThreshold);

                return (
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
                    {progress && (
                      <>
                        <View
                          accessible
                          accessibilityLabel={`${badge.name} progress`}
                          style={styles.progressTrack}
                        >
                          <View
                            style={[
                              styles.progressFill,
                              { width: `${progress.percentage * 100}%` },
                            ]}
                          />
                        </View>
                        <Text style={styles.progressText}>
                          {badge.receivedCount}/{progress.target}
                        </Text>
                      </>
                    )}
                  </Pressable>
                );
              })}
          </View>
        </View>

        <View style={styles.tagSection}>
          <Text style={styles.sectionTitle}>Interested in</Text>
          <Text style={styles.tagGroupLabel}>PLAY FORMATS</Text>
          <InterestPills
            category="formats"
            options={interestFormats}
            selectedKeys={interestSelection.formats}
            saving={interestSaving}
            onToggle={toggleInterest}
          />
          <Text style={styles.tagGroupLabel}>POSITIONS</Text>
          <InterestPills
            category="positions"
            options={interestPositions}
            selectedKeys={interestSelection.positions}
            saving={interestSaving}
            onToggle={toggleInterest}
          />
          {!!interestError && (
            <Text accessibilityRole="alert" style={styles.saveError}>
              {interestError}
            </Text>
          )}
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
        visible={selectedBadge !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedBadge(null)}
      >
        <Pressable onPress={() => setSelectedBadge(null)} style={styles.modalBackdrop}>
          <Pressable onPress={(event) => event.stopPropagation()} style={styles.badgeDetails}>
            <Text style={styles.badgeDetailsTitle}>{selectedBadge?.name}</Text>
            <Text style={styles.badgeDetailsTier}>{selectedBadge?.tier} tier</Text>
            <Text style={styles.badgeDetailsDescription}>{selectedBadge?.description}</Text>
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

      <Modal
        visible={thoughtEditorVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setThoughtEditorVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setThoughtEditorVisible(false)}>
          <Pressable style={styles.thoughtEditor} onPress={(event) => event.stopPropagation()}>
            <View style={styles.thoughtEditorHeader}>
              <View style={styles.thoughtEditorIcon}>
                <Text style={styles.thoughtEditorIconText}>✦</Text>
              </View>
              <View style={styles.thoughtEditorHeading}>
                <Text style={styles.thoughtEditorTitle}>
                  {account?.thoughtText ? "Edit your thought" : "Share a thought"}
                </Text>
                <Text style={styles.thoughtEditorHint}>This appears publicly on your profile.</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close thought editor"
                onPress={() => setThoughtEditorVisible(false)}
                style={styles.thoughtEditorClose}
              >
                <Text style={styles.thoughtEditorCloseText}>×</Text>
              </Pressable>
            </View>
            <Text style={styles.thoughtFieldLabel}>MESSAGE</Text>
            <TextInput
              accessibilityLabel="Thought"
              maxLength={180}
              multiline
              onChangeText={setThoughtText}
              placeholder="Your thoughts go here..."
              placeholderTextColor="#8a9690"
              submitBehavior="newline"
              style={styles.thoughtInput}
              value={thoughtText}
            />
            <Text style={styles.thoughtCharacterCount}>{thoughtText.length}/180</Text>
            {!!thoughtError && (
              <Text accessibilityRole="alert" style={styles.saveError}>
                {thoughtError}
              </Text>
            )}
            <View style={styles.thoughtActions}>
              {account?.thoughtText && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Delete thought"
                  disabled={thoughtSaving}
                  onPress={deleteThought}
                  style={styles.deleteThoughtButton}
                >
                  <Text style={styles.deleteThoughtText}>Delete</Text>
                </Pressable>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Share thought"
                disabled={thoughtSaving}
                onPress={saveThought}
                style={styles.shareThoughtButton}
              >
                {thoughtSaving ? (
                  <ActivityIndicator color="#f7f4f1" />
                ) : (
                  <Text style={styles.shareThoughtText}>Share</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingBottom: 110, // room for the floating nav bar
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
  avatarWithThought: {
    alignItems: "center",
    position: "relative",
  },
  thoughtBubbleButton: {
    alignItems: "center",
    marginBottom: 3,
    transform: [{ translateX: 16 }],
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
  profilePictureEditBadge: {
    position: "absolute",
    right: -3,
    bottom: -1,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#1d5c4d",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#e8e4df",
  },
  profilePictureEditText: {
    color: "#f7f4f1",
    fontSize: 18,
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
  lookingCard: {
    backgroundColor: "#f2f0ed",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d9d5d0",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 20,
  },
  lookingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  lookingTextStack: {
    flex: 1,
    marginRight: 12,
  },
  lookingTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#12382d",
  },
  lookingHint: {
    fontSize: 12,
    color: "#536761",
    marginTop: 2,
  },
  lookingSpinner: {
    marginRight: 8,
  },
  saveError: {
    color: "#d15b57",
    fontSize: 13,
    marginTop: 8,
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
  awardsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#12382d",
  },
  awardsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginTop: 12,
    width: "100%",
  },
  awardBadge: {
    width: 72,
    alignItems: "center",
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
  progressTrack: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d9d5d0",
    marginTop: 7,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#b47a2a",
  },
  progressText: {
    color: "#536761",
    fontSize: 9,
    marginTop: 3,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(18, 56, 45, 0.52)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
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
  thoughtEditor: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#fbfaf8",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#071c15",
    shadowOpacity: 0.2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  thoughtEditorHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  thoughtEditorIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#dcebe4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  thoughtEditorIconText: {
    color: "#0b5544",
    fontSize: 18,
    fontWeight: "800",
  },
  thoughtEditorHeading: {
    flex: 1,
  },
  thoughtEditorClose: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#edf0ed",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  thoughtEditorCloseText: {
    color: "#536761",
    fontSize: 22,
    fontWeight: "400",
    lineHeight: 25,
  },
  thoughtEditorTitle: {
    color: "#12382d",
    fontSize: 21,
    fontWeight: "800",
  },
  thoughtEditorHint: {
    color: "#536761",
    fontSize: 12,
    lineHeight: 16,
    marginTop: 4,
  },
  thoughtFieldLabel: {
    color: "#789087",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  thoughtInput: {
    minHeight: 76,
    maxHeight: 92,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#d4dfd9",
    backgroundColor: "#ffffff",
    color: "#12382d",
    fontSize: 15,
    paddingHorizontal: 13,
    paddingVertical: 10,
    textAlignVertical: "top",
  },
  thoughtCharacterCount: {
    alignSelf: "flex-end",
    color: "#97a49e",
    fontSize: 11,
    marginTop: 4,
    marginBottom: 13,
  },
  thoughtActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
    marginTop: 0,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e7ebe8",
  },
  deleteThoughtButton: {
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  deleteThoughtText: {
    color: "#c24f4b",
    fontWeight: "700",
  },
  shareThoughtButton: {
    minWidth: 92,
    alignItems: "center",
    backgroundColor: "#12382d",
    borderRadius: 999,
    paddingHorizontal: 17,
    paddingVertical: 10,
    shadowColor: "#063e31",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  shareThoughtText: {
    color: "#f7f4f1",
    fontWeight: "700",
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
  tagGroupLabel: {
    color: "#789087",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginTop: 14,
  },
  tagPill: {
    backgroundColor: "#f2f0ed",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#d9d5d0",
  },
  tagPillSelected: {
    backgroundColor: "#dfe9e4",
    borderColor: "#1d5c4d",
  },
  tagText: {
    fontSize: 12,
    color: "#12382d",
    fontWeight: "600",
  },
  tagTextSelected: {
    color: "#12382d",
    fontWeight: "800",
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
});
