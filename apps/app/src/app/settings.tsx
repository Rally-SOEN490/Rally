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
  updatePassword,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { apiErrorMessage, deleteMyAccount } from "@/lib/api";
import { authErrorMessage } from "@/lib/auth-errors";
import { apiErrorMessage, deleteMyAccount } from "@/lib/api";
import { authErrorMessage } from "@/lib/auth-errors";
import { auth } from "@/lib/firebase";
import { useSession } from "@/lib/session";
import { useSession } from "@/lib/session";

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
  const { user } = useSession();
  const { user } = useSession();
  const [announcementToggles, setAnnouncementToggles] = useState({
    tournamentAnnouncements: true,
    joinRequests: true,
  });
  const [language, setLanguage] = useState<"EN" | "FR">("EN");
  const [colorBlindMode, setColorBlindMode] = useState(false);

  const [deleting, setDeleting] = useState(false);
  const [passwordPromptVisible, setPasswordPromptVisible] = useState(false);
  const [passwordPromptVisible, setPasswordPromptVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Change e-mail / change password (one modal, two modes).
  const [editing, setEditing] = useState<null | "email" | "password">(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newValue, setNewValue] = useState("");
  const [confirmValue, setConfirmValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");

  const closeEdit = () => {
    setEditing(null);
    setCurrentPassword("");
    setNewValue("");
    setConfirmValue("");
    setEditError("");
  };

  const handleSaveEdit = async () => {
    const current = auth.currentUser;
    if (!current?.email || !editing) return;
    const value = newValue.trim();

    if (editing === "email" && value.toLowerCase() === current.email.toLowerCase()) {
      setEditError("That's already your e-mail.");
      return;
    }
    if (editing === "password" && value !== confirmValue) {
      setEditError("Passwords don't match.");
      return;
    }

    setSaving(true);
    setEditError("");
    try {
      await reauthenticateWithCredential(
        current,
        EmailAuthProvider.credential(current.email, currentPassword),
      );
      if (editing === "email") {
        await verifyBeforeUpdateEmail(current, value);
        closeEdit();
        notify(
          "Check your new inbox",
          `We sent a verification link to ${value}. Your e-mail will change once you click it.`,
        );
      } else {
        await updatePassword(current, newValue);
        closeEdit();
        notify("Password updated", "Your password has been changed.");
      }
    } catch (e) {
      setEditError(authErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch {
      notify("Unable to log out", "Please try again in a moment.");
    }
  };

  const closePasswordPrompt = () => {
    setPasswordPromptVisible(false);
    setPassword("");
    setPasswordError("");
  const closePasswordPrompt = () => {
    setPasswordPromptVisible(false);
    setPassword("");
    setPasswordError("");
  };

  const handleDeleteAccount = async () => {
    const confirmed = await confirmAsync(
      "Delete account",
      "Are you sure you want to delete your account? This can't be undone.",
      "Yes, delete my account",
    );
    if (confirmed) setPasswordPromptVisible(true);
    if (confirmed) setPasswordPromptVisible(true);
  };

  // Deletes the account from Rally's database first, then from Firebase.
  const deleteAccount = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser?.email) return;
    setDeleting(true);
    setPasswordError("");

    try {
      // Firebase only deletes logins that signed in recently, so check the
      // password first. This way the deletion below can't be refused halfway.
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);
    } catch (e) {
      setPasswordError(authErrorMessage(e));
      setDeleting(false);
      return;
    }

    try {
      // If the second step fails, the person can still log in and try again,
      // and deleting from Rally's database again is safe.
      await deleteMyAccount(currentUser);
      await deleteUser(currentUser); // also logs them out
      router.replace("/login");
    } catch (e) {
      notify("Unable to delete account", apiErrorMessage(e));
      setDeleting(false);
  // Deletes the account from Rally's database first, then from Firebase.
  const deleteAccount = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser?.email) return;
    setDeleting(true);
    setPasswordError("");

    try {
      // Firebase only deletes logins that signed in recently, so check the
      // password first. This way the deletion below can't be refused halfway.
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);
    } catch (e) {
      setPasswordError(authErrorMessage(e));
      setDeleting(false);
      return;
    }

    try {
      // If the second step fails, the person can still log in and try again,
      // and deleting from Rally's database again is safe.
      await deleteMyAccount(currentUser);
      await deleteUser(currentUser); // also logs them out
      router.replace("/login");
    } catch (e) {
      notify("Unable to delete account", apiErrorMessage(e));
      setDeleting(false);
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

          <Pressable
            style={styles.rowItem}
            accessibilityRole="button"
            onPress={() => setEditing("email")}
          >
            <View style={styles.rowLeft}>
              <View style={styles.iconBadge}>
                <Text style={styles.iconText}>✉️</Text>
              </View>
              <View style={styles.rowTextStack}>
                <Text style={styles.rowLabel}>E-mail</Text>
                <Text style={styles.rowValue}>{user?.email}</Text>
                <Text style={styles.rowValue}>{user?.email}</Text>
              </View>
            </View>
            <Text style={styles.rowChevron}>›</Text>
          </Pressable>

          <View style={styles.rowItem}>
            <View style={styles.rowLeft}>
              <View style={styles.iconBadge}>
                <Text style={styles.iconText}>🔒</Text>
              </View>
              <View style={styles.rowTextStack}>
                <Text style={styles.rowLabel}>Password</Text>
                <Text style={styles.rowValue}>••••••••</Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              style={styles.inlineAction}
              onPress={() => setEditing("password")}
            >
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
        visible={passwordPromptVisible}
        visible={passwordPromptVisible}
        transparent
        animationType="fade"
        onRequestClose={closePasswordPrompt}
        onRequestClose={closePasswordPrompt}
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
            {!!passwordError && <Text style={styles.modalError}>{passwordError}</Text>}
            {!!passwordError && <Text style={styles.modalError}>{passwordError}</Text>}
            <View style={styles.modalActions}>
              <Pressable
                accessibilityRole="button"
                onPress={closePasswordPrompt}
                accessibilityRole="button"
                onPress={closePasswordPrompt}
                style={styles.inlineAction}
              >
                <Text style={styles.inlineActionText}>Cancel</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete my account"
                onPress={deleteAccount}
                disabled={!password || deleting}
                style={[styles.modalDelete, (!password || deleting) && { opacity: 0.5 }]}
                accessibilityRole="button"
                accessibilityLabel="Delete my account"
                onPress={deleteAccount}
                disabled={!password || deleting}
                style={[styles.modalDelete, (!password || deleting) && { opacity: 0.5 }]}
              >
                <Text style={styles.modalDeleteText}>{deleting ? "Deleting…" : "Delete account"}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={editing !== null}
        transparent
        animationType="fade"
        onRequestClose={closeEdit}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editing === "email" ? "Change e-mail" : "Change password"}
            </Text>
            <Text style={styles.rowValue}>
              {editing === "email"
                ? "Enter your current password and your new e-mail. We'll send a verification link to the new address."
                : "Enter your current password, then choose a new one."}
            </Text>
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder="Current password"
              style={styles.modalInput}
            />
            <TextInput
              value={newValue}
              onChangeText={setNewValue}
              secureTextEntry={editing === "password"}
              autoCapitalize="none"
              keyboardType={editing === "email" ? "email-address" : "default"}
              placeholder={editing === "email" ? "New e-mail address" : "New password"}
              style={styles.modalInput}
            />
            {editing === "password" && (
              <TextInput
                value={confirmValue}
                onChangeText={setConfirmValue}
                secureTextEntry
                autoCapitalize="none"
                placeholder="Confirm new password"
                style={styles.modalInput}
              />
            )}
            {!!editError && <Text style={styles.modalError}>{editError}</Text>}
            <View style={styles.modalActions}>
              <Pressable onPress={closeEdit} style={styles.inlineAction}>
                <Text style={styles.inlineActionText}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveEdit}
                disabled={
                  saving ||
                  !currentPassword ||
                  !newValue ||
                  (editing === "password" && !confirmValue)
                }
                style={[
                  styles.modalSave,
                  (saving ||
                    !currentPassword ||
                    !newValue ||
                    (editing === "password" && !confirmValue)) && { opacity: 0.5 },
                ]}
              >
                <Text style={styles.modalSaveText}>{saving ? "Saving…" : "Save"}</Text>
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
  modalSave: {
    backgroundColor: "#12382d",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalSaveText: {
    color: "#f5f3ef",
    fontWeight: "700",
  },
});