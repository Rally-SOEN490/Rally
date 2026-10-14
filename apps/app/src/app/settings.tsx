// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { router } from "expo-router";
import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "@/lib/firebase";

export default function Settings() {
  const [tournamentAnnouncements, setTournamentAnnouncements] = useState(true);
  const [joinRequests, setJoinRequests] = useState(true);
  const [colorBlindMode, setColorBlindMode] = useState(false);

  const [reauthVisible, setReauthVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  const performDelete = async () => {
    const user = auth.currentUser;
    if (!user) {
      router.replace("/login");
      return;
    }

    setDeleting(true);
    try {
      // TODO: delete/anonymize the user's profile data here (e.g. Firestore doc)
      // BEFORE deleteUser, since security rules need an authenticated user.
      await deleteUser(user);
      router.replace("/login");
    } catch (error: any) {
      if (error?.code === "auth/requires-recent-login") {
        setReauthVisible(true);
      } else {
        Alert.alert(
          "Could not delete account",
          error?.message || "Please try again later.",
        );
      }
    } finally {
      setDeleting(false);
    }
  };

  const confirmReauthAndDelete = async () => {
    const user = auth.currentUser;
    if (!user?.email || !password) return;

    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      setReauthVisible(false);
      setPassword("");
      await performDelete();
    } catch (error: any) {
      Alert.alert(
        "Couldn't verify password",
        "Please check your password and try again.",
      );
    }
  };

  const handleDeleteAccount = () => {
    const title = "Are you sure you want to delete your account?";
    const message =
      'This removes your personal profile data. Your past results will remain on team history as "Deleted player" so other teams\' tournament records stay intact.';

    if (Platform.OS === "web") {
      // Alert.alert is a no-op on web
      if (window.confirm(`${title}\n\n${message}`)) performDelete();
      return;
    }

    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Yes, delete my account",
        style: "destructive",
        onPress: performDelete,
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Pressable style={styles.iconButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>
          <Text style={styles.headerTitle}>Maya Tremblay</Text>
        </View>

        <Text style={styles.screenTitle}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT & LOGIN</Text>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>✉</Text>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowTitle}>E-mail</Text>
                <Text style={styles.rowValue}>maya.tremblay@gmail.com</Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </View>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>🔒</Text>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowTitle}>Password</Text>
                <Text style={styles.rowValue}>Last changed Mar 2026</Text>
              </View>
            </View>
            <Pressable style={styles.inlineButton}>
              <Text style={styles.inlineButtonText}>Change</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>

          <View style={styles.toggleRow}>
            <View style={styles.toggleLabelWrap}>
              <Text style={styles.rowIcon}>📣</Text>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowTitle}>Tournament announcements</Text>
                <Text style={styles.rowValue}>New events and registration openings</Text>
              </View>
            </View>
            <Switch
              value={tournamentAnnouncements}
              onValueChange={setTournamentAnnouncements}
              trackColor={{ false: "#d9d5d1", true: "#2d6858" }}
              thumbColor="#f4f4f4"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleLabelWrap}>
              <Text style={styles.rowIcon}>👥</Text>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowTitle}>Join-request alerts</Text>
                <Text style={styles.rowValue}>When a player asks to join your team</Text>
              </View>
            </View>
            <Switch
              value={joinRequests}
              onValueChange={setJoinRequests}
              trackColor={{ false: "#d9d5d1", true: "#2d6858" }}
              thumbColor="#f4f4f4"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>APP PREFERENCES</Text>

          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>Language</Text>
            <View style={styles.languageToggle}>
              <Text style={styles.languageValue}>EN</Text>
              <Text style={styles.languageMuted}>FR</Text>
            </View>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleLabelWrap}>
              <Text style={styles.rowIcon}>◉</Text>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowTitle}>Color blind mode</Text>
                <Text style={styles.rowValue}>Swaps colour-only cues for patterns and labels</Text>
              </View>
            </View>
            <Switch
              value={colorBlindMode}
              onValueChange={setColorBlindMode}
              trackColor={{ false: "#d9d5d1", true: "#2d6858" }}
              thumbColor="#f4f4f4"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SUPPORT</Text>

          <Pressable style={styles.row}>
            <View style={styles.rowLeft}>
              <Text style={styles.rowIcon}>?</Text>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowTitle}>Help & support</Text>
                <Text style={styles.rowValue}>FAQ, contact us, report a problem</Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        <Pressable style={styles.logoutButton} onPress={() => router.replace("/login")}>
          <Text style={styles.logoutButtonText}>↪ Log out</Text>
        </Pressable>

        <Pressable
          style={[styles.deleteButton, deleting && { opacity: 0.5 }]}
          onPress={handleDeleteAccount}
          disabled={deleting}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Delete account"
        >
          <Text style={styles.deleteButtonText}>🗑 Delete account</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={reauthVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setReauthVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm your password</Text>
            <Text style={styles.rowValue}>
              For security, please re-enter your password to delete your account.
            </Text>
            <TextInput
              style={styles.modalInput}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder="Password"
            />
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setReauthVisible(false);
                  setPassword("");
                }}
              >
                <Text style={styles.inlineButtonText}>Cancel</Text>
              </Pressable>
              <Pressable onPress={confirmReauthAndDelete}>
                <Text style={[styles.inlineButtonText, { color: "#c4493d" }]}>Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f3f1ee",
  },
  container: {
    paddingHorizontal: 18,
    paddingBottom: 22,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e7e1db",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 28,
    color: "#172d29",
    marginTop: -3,
  },
  headerTitle: {
    marginLeft: 14,
    fontSize: 18,
    color: "#22332f",
    fontWeight: "700",
  },
  screenTitle: {
    fontSize: 48,
    color: "#1d2d2a",
    fontWeight: "800",
    marginTop: 0,
    marginBottom: 18,
  },
  section: {
    backgroundColor: "#f2efe9",
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#d7d1c9",
  },
  sectionLabel: {
    color: "#4d5753",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 8,
    marginLeft: 10,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f5f2",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rowIcon: {
    width: 28,
    fontSize: 18,
    textAlign: "center",
  },
  rowTextWrap: {
    marginLeft: 10,
    flex: 1,
  },
  rowTitle: {
    color: "#1d2d2a",
    fontSize: 18,
    fontWeight: "600",
  },
  rowValue: {
    color: "#586563",
    fontSize: 12,
    marginTop: 2,
  },
  chevron: {
    color: "#475752",
    fontSize: 28,
    fontWeight: "400",
  },
  inlineButton: {
    backgroundColor: "#dfe8e3",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineButtonText: {
    fontSize: 12,
    color: "#1d2d2a",
    fontWeight: "700",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f5f2",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  toggleLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f5f2",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  optionLabel: {
    color: "#1d2d2a",
    fontSize: 18,
    fontWeight: "600",
  },
  languageToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  languageValue: {
    backgroundColor: "#dfe9e1",
    color: "#1d2d2a",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontWeight: "700",
  },
  languageMuted: {
    color: "#586563",
    fontWeight: "700",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  logoutButton: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#c7d2cd",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#f5f2ef",
  },
  logoutButtonText: {
    color: "#1d2d2a",
    fontSize: 20,
    fontWeight: "700",
  },
  deleteButton: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#d4b2b2",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#f6eeed",
  },
  deleteButtonText: {
    color: "#c4493d",
    fontSize: 18,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#f8f5f2",
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1d2d2a",
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#d7d1c9",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 20,
  },
});
