import { router } from "expo-router";
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
import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

// Alert.alert with buttons does nothing on web, so use window.confirm there.
const confirmAsync = (title: string, message: string, confirmText: string) =>
  new Promise<boolean>((resolve) => {
    if (Platform.OS === "web") {
      resolve(window.confirm(`${title}\n\n${message}`));
      return;
    }
    Alert.alert(
      title,
      message,
      [
        { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
        { text: confirmText, style: "destructive", onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });

const notify = (title: string, message: string) => {
  if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
};

export default function Settings() {
  const [announcementToggles, setAnnouncementToggles] = useState({
    tournamentAnnouncements: true,
    joinRequests: true,
  });
  const [language, setLanguage] = useState<"EN" | "FR">("EN");
  const [colorBlindMode, setColorBlindMode] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [reauthVisible, setReauthVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [reauthError, setReauthError] = useState("");

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login" as any);
    } catch {
      notify("Unable to log out", "Please try again in a moment.");
    }
  };

  const performDelete = async () => {
    const user = auth.currentUser;
    if (!user) {
      router.replace("/login" as any);
      return;
    }

    setDeleting(true);
    try {
      // If you store user data in Firestore/Storage, delete it here BEFORE deleteUser,
      // since you lose permission once the auth user is gone.
      await deleteUser(user); // also signs the user out
      router.replace("/login" as any);
    } catch (e: any) {
      if (e?.code === "auth/requires-recent-login") {
        setReauthError("");
        setReauthVisible(true);
      } else {
        notify("Unable to delete account", "Please try again in a moment.");
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await confirmAsync(
      "Delete account",
      "Are you sure you want to delete your account? This can't be undone.",
      "Yes, delete my account",
    );
    if (confirmed) await performDelete();
  };

  const handleReauthConfirm = async () => {
    const user = auth.currentUser;
    if (!user?.email) return;
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      setReauthVisible(false);
      setPassword("");
      await performDelete();
    } catch {
      setReauthError("Incorrect password. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.heading}>Settings</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account & login</Text>

          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <View style={styles.iconBadge}>
                <Text style={styles.iconText}>✉️</Text>
              </View>
              <View style={styles.rowTextStack}>
                <Text style={styles.rowLabel}>E-mail</Text>
                <Text style={styles.rowValue}>maya.tremblay@gmail.com</Text>
              </View>
            </View>
            <Text style={styles.rowChevron}>›</Text>
          </View>

          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <View style={styles.iconBadge}>
                <Text style={styles.iconText}>🔒</Text>
              </View>
              <View style={styles.rowTextStack}>
                <Text style={styles.rowLabel}>Password</Text>
                <Text style={styles.rowValue}>Last changed Mar 2026</Text>
              </View>
            </View>
            <Pressable accessibilityRole="button" style={styles.inlineAction}>
              <Text style={styles.inlineActionText}>Change</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>

          <View style={styles.toggleRow}>
            <View style={styles.rowLeft}>
              <View style={styles.iconBadge}>
                <Text style={styles.iconText}>📣</Text>
              </View>
              <View style={styles.rowTextStack}>
                <Text style={styles.rowLabel}>Tournament announcements</Text>
                <Text style={styles.rowValue}>New events and registration openings</Text>
              </View>
            </View>
            <Switch
              value={announcementToggles.tournamentAnnouncements}
              onValueChange={(value) =>
                setAnnouncementToggles((current) => ({ ...current, tournamentAnnouncements: value }))
              }
              trackColor={{ false: "#d9d5d0", true: "#1d5c4d" }}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.rowLeft}>
              <View style={styles.iconBadge}>
                <Text style={styles.iconText}>👥</Text>
              </View>
              <View style={styles.rowTextStack}>
                <Text style={styles.rowLabel}>Join-request alerts</Text>
                <Text style={styles.rowValue}>When a player asks to join your team</Text>
              </View>
            </View>
            <Switch
              value={announcementToggles.joinRequests}
              onValueChange={(value) =>
                setAnnouncementToggles((current) => ({ ...current, joinRequests: value }))
              }
              trackColor={{ false: "#d9d5d0", true: "#1d5c4d" }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App preferences</Text>

          <View style={styles.languageRow}>
            <View style={styles.rowLeft}>
              <View style={styles.iconBadge}>
                <Text style={styles.iconText}>🌐</Text>
              </View>
              <Text style={styles.rowLabel}>Language</Text>
            </View>
            <View style={styles.languageToggle}>
              <Pressable
                onPress={() => setLanguage("EN")}
                style={[styles.languageOption, language === "EN" && styles.languageOptionActive]}
              >
                <Text style={[styles.languageText, language === "EN" && styles.languageTextActive]}>EN</Text>
              </Pressable>
              <Pressable
                onPress={() => setLanguage("FR")}
                style={[styles.languageOption, language === "FR" && styles.languageOptionActive]}
              >
                <Text style={[styles.languageText, language === "FR" && styles.languageTextActive]}>FR</Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.rowLeft}>
              <View style={styles.iconBadge}>
                <Text style={styles.iconText}>🎯</Text>
              </View>
              <View style={styles.rowTextStack}>
                <Text style={styles.rowLabel}>Color blind mode</Text>
                <Text style={styles.rowValue}>Swaps colour-only cues for patterns and labels</Text>
              </View>
            </View>
            <Switch
              value={colorBlindMode}
              onValueChange={setColorBlindMode}
              trackColor={{ false: "#d9d5d0", true: "#1d5c4d" }}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <Pressable style={styles.rowItem} accessibilityRole="button">
            <View style={styles.rowLeft}>
              <View style={styles.iconBadge}>
                <Text style={styles.iconText}>❔</Text>
              </View>
              <View style={styles.rowTextStack}>
                <Text style={styles.rowLabel}>Help & support</Text>
                <Text style={styles.rowValue}>FAQ, contact us, report a problem</Text>
              </View>
            </View>
            <Text style={styles.rowChevron}>›</Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log out"
          onPress={handleLogout}
          style={styles.primaryButton}
        >
          <Text style={styles.primaryText}>↩ Log out</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete account"
          onPress={handleDeleteAccount}
          disabled={deleting}
          style={[styles.deleteButton, deleting && { opacity: 0.5 }]}
        >
          <Text style={styles.deleteText}>{deleting ? "Deleting…" : "🗑 Delete account"}</Text>
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
              For security, please enter your password to finish deleting your account.
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder="Password"
              style={styles.modalInput}
            />
            {!!reauthError && <Text style={styles.modalError}>{reauthError}</Text>}
            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setReauthVisible(false);
                  setPassword("");
                }}
                style={styles.inlineAction}
              >
                <Text style={styles.inlineActionText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleReauthConfirm}
                disabled={!password}
                style={[styles.modalDelete, !password && { opacity: 0.5 }]}
              >
                <Text style={styles.modalDeleteText}>Delete account</Text>
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
    backgroundColor: "#e8e4df",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 42,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f4f1ee",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  backText: {
    fontSize: 30,
    color: "#12382d",
    lineHeight: 30,
  },
  heading: {
    fontSize: 44,
    fontWeight: "800",
    color: "#12382d",
    flex: 1,
  },
  section: {
    backgroundColor: "#f3f0ed",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#d9d5d0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 15,
    color: "#5a675f",
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f7f5f2",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f7f5f2",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  languageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f7f5f2",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#e6e8e4",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconText: {
    fontSize: 16,
  },
  rowTextStack: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: "#12382d",
  },
  rowValue: {
    fontSize: 12,
    color: "#687872",
    marginTop: 2,
  },
  rowChevron: {
    fontSize: 26,
    color: "#12382d",
  },
  inlineAction: {
    backgroundColor: "#dfe9e4",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  inlineActionText: {
    color: "#12382d",
    fontWeight: "700",
  },
  languageToggle: {
    flexDirection: "row",
    backgroundColor: "#e5e1dc",
    borderRadius: 10,
    padding: 3,
  },
  languageOption: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 42,
    alignItems: "center",
  },
  languageOptionActive: {
    backgroundColor: "#f7f5f2",
  },
  languageText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5a675f",
  },
  languageTextActive: {
    color: "#12382d",
  },
  primaryButton: {
    backgroundColor: "#f2f0ed",
    borderWidth: 1,
    borderColor: "#12382d",
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 24,
    alignItems: "center",
  },
  primaryText: {
    color: "#12382d",
    fontSize: 18,
    fontWeight: "700",
  },
  deleteButton: {
    marginTop: 16,
    backgroundColor: "#f2f0ed",
    borderWidth: 1,
    borderColor: "#d15b57",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  deleteText: {
    color: "#d15b57",
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
    maxWidth: 420,
    backgroundColor: "#f7f5f2",
    borderRadius: 18,
    padding: 18,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#12382d",
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#d9d5d0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 14,
    backgroundColor: "#fff",
  },
  modalError: {
    color: "#d15b57",
    marginTop: 8,
    fontSize: 13,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 16,
  },
  modalDelete: {
    backgroundColor: "#d15b57",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalDeleteText: {
    color: "#fff",
    fontWeight: "700",
  },
});
