// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
  signOut,
  updatePassword,
  updateProfile,
  verifyBeforeUpdateEmail,
  type User,
} from "firebase/auth";
import { type ReactNode, useEffect, useState } from "react";
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
  apiErrorMessage,
  deleteMyAccount,
  getMyGender,
  NAME_MAX_LENGTH,
  saveMyGender,
  updateMyAccount,
  type ColorTheme,
  type Gender,
  type Language,
  type ProfileChanges,
} from "@/lib/api";
import { authErrorMessage } from "@/lib/auth-errors";
import { auth } from "@/lib/firebase";
import { useSession } from "@/lib/session";

const GREEN = "#12382d";
const MUTED = "#687872";
const RED = "#c62828";

const COLOR_THEMES: { key: ColorTheme; color: string; label: string }[] = [
  { key: "green", color: "#1d4d3b", label: "Green" },
  { key: "blue", color: "#2f6ca3", label: "Blue" },
  { key: "pink", color: "#d4679b", label: "Pink" },
];

type Preferences = {
  notificationsEnabled: boolean;
  language: Language;
  colorTheme: ColorTheme;
  colorBlindMode: boolean;
  darkMode: boolean;
};

// Every popup on this screen. Only one is shown at a time, inside a single
// Modal, so going from "Change e-mail" to "Verification email sent" never
// stacks two modals (which iOS doesn't handle well).
type Dialog =
  "name" | "email" | "password" | "logout" | "delete" | "emailSent" | "passwordChanged" | "deleted";

// Popups that close when you tap outside them. The ones with text fields
// don't, so a stray tap can't throw away what you typed.
const DISMISSABLE: Dialog[] = ["logout", "emailSent", "passwordChanged", "deleted"];

const notify = (title: string, message: string) => {
  if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
};

const reauthenticate = (user: User, password: string) =>
  reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email ?? "", password));

export default function Settings() {
  const { user, account, setAccount } = useSession();
  const displayName = account?.displayName ?? user?.displayName ?? "";

  // Preferences are saved to Rally's database as soon as they change.
  const [prefs, setPrefs] = useState<Preferences>({
    notificationsEnabled: account?.notificationsEnabled ?? true,
    language: account?.language ?? "EN",
    colorTheme: account?.colorTheme ?? "green",
    colorBlindMode: account?.colorBlindMode ?? false,
    darkMode: account?.darkMode ?? false,
  });

  const [gender, setGender] = useState<Gender | null>(null);
  const [genderLoading, setGenderLoading] = useState(true);
  const [genderSaving, setGenderSaving] = useState(false);
  const [instagramUrl, setInstagramUrl] = useState(account?.instagramUrl ?? "");
  const [instagramSaving, setInstagramSaving] = useState(false);
  const [facebookUrl, setFacebookUrl] = useState(account?.facebookUrl ?? "");
  const [facebookSaving, setFacebookSaving] = useState(false);

  // Popup state.
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newValue, setNewValue] = useState("");
  const [confirmValue, setConfirmValue] = useState("");
  const [deleteEmail, setDeleteEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState("");

  useEffect(() => {
    if (!user) return;
    getMyGender(user)
      .then(({ gender: savedGender }) => setGender(savedGender))
      .catch((error) => notify("Unable to load gender", apiErrorMessage(error)))
      .finally(() => setGenderLoading(false));
  }, [user]);

  // ---------- Preferences ----------

  const savePreference = async <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    if (!user) return;
    const previous = prefs[key];
    setPrefs((current) => ({ ...current, [key]: value }));
    try {
      // `key` is always one of the five settings and `value` matches it, so this
      // is one of the shapes ProfileChanges allows, like { darkMode: true }.
      // TypeScript can't work that out from a computed key, hence the cast.
      const changes = { [key]: value } as unknown as ProfileChanges;
      setAccount(await updateMyAccount(user, changes));
    } catch (error) {
      setPrefs((current) => ({ ...current, [key]: previous }));
      notify("Unable to save setting", apiErrorMessage(error));
    }
  };

  const updateGender = async (value: Gender | null) => {
    if (!user || genderSaving) return;
    const previous = gender;
    setGender(value);
    setGenderSaving(true);
    try {
      await saveMyGender(user, value);
    } catch (error) {
      setGender(previous);
      notify("Unable to save gender", apiErrorMessage(error));
    } finally {
      setGenderSaving(false);
    }
  };

  const saveInstagram = async () => {
    if (!user || instagramSaving) return;
    const value = instagramUrl.trim();
    if (value && !/^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._-]+\/?(?:[?#].*)?$/.test(value)) {
      notify("Invalid Instagram link", "Use a link like https://instagram.com/yourusername.");
      return;
    }

    setInstagramSaving(true);
    try {
      setAccount(await updateMyAccount(user, { instagramUrl: value || null }));
      notify(
        "Social media saved",
        value
          ? "Your Instagram link is now shown on your profile."
          : "Your Instagram link was removed.",
      );
    } catch (error) {
      notify("Unable to save Instagram", apiErrorMessage(error));
    } finally {
      setInstagramSaving(false);
    }
  };

  const saveFacebook = async () => {
    if (!user || facebookSaving) return;
    const value = facebookUrl.trim();
    if (value && !/^https:\/\/(www\.)?facebook\.com\/[A-Za-z0-9._-]+\/?(?:[?#].*)?$/.test(value)) {
      notify("Invalid Facebook link", "Use a link like https://facebook.com/yourusername.");
      return;
    }

    setFacebookSaving(true);
    try {
      setAccount(await updateMyAccount(user, { facebookUrl: value || null }));
      notify(
        "Social media saved",
        value
          ? "Your Facebook link is now shown on your profile."
          : "Your Facebook link was removed.",
      );
    } catch (error) {
      notify("Unable to save Facebook", apiErrorMessage(error));
    } finally {
      setFacebookSaving(false);
    }
  };

  // ---------- Popups ----------

  const resetFields = () => {
    setCurrentPassword("");
    setNewValue("");
    setConfirmValue("");
    setDeleteEmail("");
    setDialogError("");
  };

  const openDialog = (next: Dialog) => {
    resetFields();
    if (next === "name") setNewValue(displayName);
    setDialog(next);
  };

  const closeDialog = () => {
    if (busy) return;
    setDialog(null);
    resetFields();
  };

  const saveName = async () => {
    const current = auth.currentUser;
    const name = newValue.trim();
    if (!current || !name) return;
    if (name === displayName) return closeDialog();

    setBusy(true);
    setDialogError("");
    try {
      const updated = await updateMyAccount(current, { displayName: name });
      // Keep Firebase's copy in step too. Rally's database is what other
      // screens read, so a failure here isn't worth an error.
      await updateProfile(current, { displayName: name }).catch(() => {});
      setAccount(updated);
      setDialog(null);
      resetFields();
    } catch (e) {
      setDialogError(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const saveEmail = async () => {
    const current = auth.currentUser;
    if (!current?.email) return;
    const value = newValue.trim();
    if (value.toLowerCase() === current.email.toLowerCase()) {
      setDialogError("That's already your e-mail.");
      return;
    }

    setBusy(true);
    setDialogError("");
    try {
      await reauthenticate(current, currentPassword);
      await verifyBeforeUpdateEmail(current, value);
      resetFields();
      setDialog("emailSent");
    } catch (e) {
      setDialogError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async () => {
    const current = auth.currentUser;
    if (!current?.email) return;
    if (newValue !== confirmValue) {
      setDialogError("Passwords don't match.");
      return;
    }

    setBusy(true);
    setDialogError("");
    try {
      await reauthenticate(current, currentPassword);
      await updatePassword(current, newValue);
      resetFields();
      setDialog("passwordChanged");
    } catch (e) {
      setDialogError(authErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const logOut = async () => {
    setBusy(true);
    try {
      await signOut(auth);
      router.replace("/login");
    } catch {
      setBusy(false);
      setDialogError("Unable to log out. Please try again in a moment.");
    }
  };

  // Step 1: check the e-mail and password, then delete from Rally's database
  // and show "Account deleted".
  const deleteAccount = async () => {
    const current = auth.currentUser;
    if (!current?.email) return;
    if (deleteEmail.trim().toLowerCase() !== current.email.toLowerCase()) {
      setDialogError("That e-mail doesn't match your account.");
      return;
    }

    setBusy(true);
    setDialogError("");
    try {
      // Firebase only deletes logins that signed in recently, so check the
      // password first. This way the deletion can't be refused halfway.
      await reauthenticate(current, currentPassword);
    } catch (e) {
      setDialogError(authErrorMessage(e));
      setBusy(false);
      return;
    }

    try {
      await deleteMyAccount(current);
      resetFields();
      setDialog("deleted");
    } catch (e) {
      setDialogError(apiErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  // Step 2, when they press OK or tap outside "Account deleted": delete the
  // Firebase login and go to Sign up. This waits until now because deleting
  // the login logs them out, and the guards in _layout.tsx would then close
  // this screen (and the popup with it) before they could read it. If the app
  // is closed before this runs, they can still log in, land on "Finish
  // setting up", and delete again from here.
  const finishDeletion = async () => {
    if (busy) return;
    const current = auth.currentUser;
    setBusy(true);
    try {
      if (current) await deleteUser(current); // also logs them out
      // Sign up is only reachable once the session has noticed the log-out,
      // so navigate on the next tick.
      setTimeout(() => router.replace("/sign-up"), 0);
    } catch (e) {
      setBusy(false);
      setDialog(null);
      notify("Unable to finish deleting your account", authErrorMessage(e));
    }
  };

    const dismissDialog = () => {
    if (dialog === "deleted") void finishDeletion();
    else closeDialog();
  };

  const errorText = !!dialogError && <Text style={styles.modalError}>{dialogError}</Text>;

  const renderDialog = () => {
    switch (dialog) {
      case "name":
        return (
          <DialogCard
            icon={<Ionicons name="person-outline" size={24} color={GREEN} />}
            title="Change name"
            message="This is the name other players see on your profile."
          >
            <TextInput
              value={newValue}
              onChangeText={setNewValue}
              maxLength={NAME_MAX_LENGTH}
              placeholder="Full name"
              style={styles.modalInput}
            />
            {errorText}
            <DialogActions
              onCancel={closeDialog}
              confirmLabel={busy ? "Saving…" : "Save"}
              onConfirm={saveName}
              disabled={busy || !newValue.trim()}
            />
          </DialogCard>
        );

      case "email":
        return (
          <DialogCard
            icon={<Ionicons name="mail" size={22} color={GREEN} />}
            title="Change e-mail"
            message="Enter your current password and your new e-mail. We'll send a verification link to the new address."
          >
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
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="New e-mail address"
              style={styles.modalInput}
            />
            {errorText}
            <DialogActions
              onCancel={closeDialog}
              confirmLabel={busy ? "Saving…" : "Save"}
              onConfirm={saveEmail}
              disabled={busy || !currentPassword || !newValue.trim()}
            />
          </DialogCard>
        );

      case "password":
        return (
          <DialogCard
            icon={<Ionicons name="lock-closed" size={22} color={GREEN} />}
            title="Change password"
            message="Enter your current password, then choose a new one."
          >
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
              secureTextEntry
              autoCapitalize="none"
              placeholder="New password"
              style={styles.modalInput}
            />
            <TextInput
              value={confirmValue}
              onChangeText={setConfirmValue}
              secureTextEntry
              autoCapitalize="none"
              placeholder="Confirm new password"
              style={styles.modalInput}
            />
            {errorText}
            <DialogActions
              onCancel={closeDialog}
              confirmLabel={busy ? "Saving…" : "Save"}
              onConfirm={savePassword}
              disabled={busy || !currentPassword || !newValue || !confirmValue}
            />
          </DialogCard>
        );

      case "emailSent":
        return (
          <DialogCard
            icon={<MaterialCommunityIcons name="email-check" size={24} color={GREEN} />}
            title="Verification email sent"
            message="We sent a verification link to your new e-mail address. Once you accept it, your e-mail will change."
          >
            <DialogActions confirmLabel="OK" onConfirm={closeDialog} />
          </DialogCard>
        );

      case "passwordChanged":
        return (
          <DialogCard
            icon={<Ionicons name="lock-closed" size={22} color={GREEN} />}
            title="Password changed"
            message="Your password has successfully been changed."
          >
            <DialogActions confirmLabel="OK" onConfirm={closeDialog} />
          </DialogCard>
        );

      case "logout":
        return (
          <DialogCard
            icon={<Ionicons name="log-out-outline" size={24} color={GREEN} />}
            title="Log out?"
            message="Are you sure you want to log out? You'll need to sign in again to see your teams and tournaments."
          >
            {errorText}
            <DialogActions
              onCancel={closeDialog}
              confirmLabel={busy ? "Logging out…" : "Log out"}
              onConfirm={logOut}
              disabled={busy}
            />
          </DialogCard>
        );

      case "delete":
        return (
          <DialogCard
            icon={<Ionicons name="trash-outline" size={22} color={RED} />}
            danger
            title="Delete account?"
            message={
              "Are you sure you want to delete your account? This permanently removes your profile, teams and tournament history, and can't be undone.\n\nTo confirm, enter your e-mail and password."
            }
          >
            <TextInput
              value={deleteEmail}
              onChangeText={setDeleteEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="E-mail address"
              style={styles.modalInput}
            />
            <TextInput
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder="Password"
              style={styles.modalInput}
            />
            {errorText}
            <DialogActions
              onCancel={closeDialog}
              confirmLabel={busy ? "Deleting…" : "Delete account"}
              onConfirm={deleteAccount}
              disabled={busy || !deleteEmail.trim() || !currentPassword}
              danger
            />
          </DialogCard>
        );

      case "deleted":
        return (
          <DialogCard
            icon={<Ionicons name="checkmark-circle-outline" size={26} color={GREEN} />}
            title="Account deleted"
            message="Your account has been successfully deleted. We're sorry to see you go."
          >
            <DialogActions confirmLabel="OK" onConfirm={finishDeletion} disabled={busy} />
          </DialogCard>
        );

      default:
        return null;
    }
  };

  // ---------- Screen ----------

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          // After a reload, Settings can be the only screen, with nothing to go back to.
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/profile"))}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={22} color={GREEN} />
        </Pressable>
        <Text style={styles.heading}>Settings</Text>

        <Section title="Account & login">
          <Row
            icon={<MaterialCommunityIcons name="account-edit-outline" size={22} color={GREEN} />}
            label="Name"
            value={displayName}
            onPress={() => openDialog("name")}
          />
          <Row
            icon={<Ionicons name="mail" size={20} color={GREEN} />}
            label="E-mail"
            value={user?.email ?? ""}
            onPress={() => openDialog("email")}
          />
          <Row
            icon={<Ionicons name="lock-closed" size={20} color={GREEN} />}
            label="Password"
            value="••••••••"
            onPress={() => openDialog("password")}
            last
          />
        </Section>

        <Section title="Co-ed roster information">
          <Text style={styles.note}>Optional. This is private and not shown on your profile.</Text>
          <View style={styles.genderOptions}>
            {(["male", "female"] as const).map((option) => (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{
                  checked: gender === option,
                  disabled: genderLoading || genderSaving,
                }}
                accessibilityLabel={option === "male" ? "Male" : "Female"}
                disabled={genderLoading || genderSaving}
                onPress={() => updateGender(option)}
                style={[styles.genderOption, gender === option && styles.genderOptionActive]}
              >
                <Text
                  style={[
                    styles.genderOptionText,
                    gender === option && styles.genderOptionTextActive,
                  ]}
                >
                  {option === "male" ? "Male" : "Female"}
                </Text>
              </Pressable>
            ))}
          </View>
          {gender !== null && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear gender"
              disabled={genderSaving}
              onPress={() => updateGender(null)}
              style={styles.clearGender}
            >
              <Text style={styles.clearGenderText}>Prefer not to say</Text>
            </Pressable>
          )}
        </Section>

        <Section title="Social media">
          <Text style={styles.note}>Optional links shown on your public profile.</Text>
          <View style={styles.socialInputRow}>
            <Ionicons name="logo-instagram" size={20} color="#c13584" />
            <TextInput
              accessibilityLabel="Instagram link"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              onChangeText={setInstagramUrl}
              placeholder="https://www.instagram.com/yourusername"
              placeholderTextColor="#9aa39d"
              style={styles.socialInput}
              value={instagramUrl}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save Instagram link"
              disabled={instagramSaving}
              onPress={saveInstagram}
              style={[styles.socialSaveButton, instagramSaving && styles.disabled]}
            >
              <Text style={styles.socialSaveText}>{instagramSaving ? "Saving…" : "Save link"}</Text>
            </Pressable>
          </View>
          <View style={[styles.socialInputRow, styles.socialInputRowSpaced]}>
            <Ionicons name="logo-facebook" size={20} color="#1877f2" />
            <TextInput
              accessibilityLabel="Facebook link"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              onChangeText={setFacebookUrl}
              placeholder="https://www.facebook.com/yourusername"
              placeholderTextColor="#9aa39d"
              style={styles.socialInput}
              value={facebookUrl}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save Facebook link"
              disabled={facebookSaving}
              onPress={saveFacebook}
              style={[styles.socialSaveButton, facebookSaving && styles.disabled]}
            >
              <Text style={styles.socialSaveText}>{facebookSaving ? "Saving…" : "Save link"}</Text>
            </Pressable>
          </View>
        </Section>

        <Section title="Notifications">
          <Row
            icon={<Ionicons name="notifications" size={20} color="#c99a06" />}
            iconBackground="#fbe7a1"
            label="Notifications"
            value="Tournament and team alerts"
            right={
              <Switch
                value={prefs.notificationsEnabled}
                onValueChange={(value) => savePreference("notificationsEnabled", value)}
                trackColor={{ false: "#d9d5d0", true: "#1d5c4d" }}
              />
            }
            last
          />
        </Section>

        <Section title="App preferences">
          <Row
            icon={<Ionicons name="language" size={20} color="#3b6ea5" />}
            iconBackground="#dbe8f5"
            label="Language"
            right={
              <View style={styles.languageToggle}>
                {(["EN", "FR"] as const).map((option) => (
                  <Pressable
                    key={option}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: prefs.language === option }}
                    onPress={() => savePreference("language", option)}
                    style={[
                      styles.languageOption,
                      prefs.language === option && styles.languageOptionActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.languageText,
                        prefs.language === option && styles.languageTextActive,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                ))}
              </View>
            }
          />
          <Row
            icon={<Ionicons name="color-palette" size={20} color="#c2557f" />}
            iconBackground="#f8dce8"
            label="Color theme"
            right={
              <View style={styles.colorOptions}>
                {COLOR_THEMES.map(({ key, color, label }) => {
                  const selected = prefs.colorTheme === key;
                  return (
                    <Pressable
                      key={key}
                      accessibilityRole="radio"
                      accessibilityLabel={label}
                      accessibilityState={{ checked: selected }}
                      onPress={() => savePreference("colorTheme", key)}
                      hitSlop={6}
                      style={[
                        styles.colorDot,
                        selected && styles.colorDotSelected,
                        { backgroundColor: color },
                      ]}
                    />
                  );
                })}
              </View>
            }
          />
          <Row
            icon={<Ionicons name="eye-outline" size={20} color="#6f5cc2" />}
            iconBackground="#e6e0f7"
            label="Color blind mode"
            value="Swaps colour-only cues for patterns and labels"
            right={
              <Switch
                value={prefs.colorBlindMode}
                onValueChange={(value) => savePreference("colorBlindMode", value)}
                trackColor={{ false: "#d9d5d0", true: "#1d5c4d" }}
              />
            }
          />
          <Row
            icon={<Ionicons name="moon" size={18} color="#5b63b7" />}
            iconBackground="#e3e5f7"
            label="Dark mode"
            value="Switch between light and dark"
            right={
              <Switch
                value={prefs.darkMode}
                onValueChange={(value) => savePreference("darkMode", value)}
                trackColor={{ false: "#d9d5d0", true: "#1d5c4d" }}
              />
            }
            last
          />
        </Section>

        <Section title="Support">
          <Row
            icon={<Ionicons name="help-circle" size={22} color="#5a675f" />}
            label="Help & support"
            value="FAQ, contact us, report a problem"
            onPress={() => {}}
            last
          />
        </Section>

        <View style={[styles.card, styles.standaloneCard]}>
          <Row
            icon={<MaterialCommunityIcons name="volleyball" size={22} color={GREEN} />}
            label="Request Organiser account"
            value="Request account to Host and Manage tournaments"
            onPress={() => {}}
            last
          />
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log out"
          onPress={() => openDialog("logout")}
          style={styles.logoutButton}
        >
          <Ionicons name="log-out-outline" size={20} color={GREEN} />
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete account"
          onPress={() => openDialog("delete")}
          style={styles.deleteButton}
        >
          <Ionicons name="trash" size={20} color={RED} />
          <Text style={styles.deleteText}>Delete account</Text>
        </Pressable>
      </ScrollView>

      <Modal
        visible={dialog !== null}
        transparent
        animationType="fade"
        onRequestClose={dismissDialog}
      >
        <Pressable
          testID="dialog-backdrop"
          style={styles.modalBackdrop}
          onPress={dialog && DISMISSABLE.includes(dialog) ? dismissDialog : undefined}
        >
          {/* Catches taps on the card so they don't reach the backdrop. */}
          <View testID="dialog" onStartShouldSetResponder={() => true} style={styles.modalCard}>
            {renderDialog()}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ---------- Building blocks ----------

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({
  icon,
  iconBackground = "#e2e8e3",
  label,
  value,
  right,
  onPress,
  last,
}: {
  icon: ReactNode;
  iconBackground?: string;
  label: string;
  value?: string;
  right?: ReactNode;
  onPress?: () => void;
  last?: boolean;
}) {
  const content = (
    <>
      <View style={[styles.iconBadge, { backgroundColor: iconBackground }]}>{icon}</View>
      <View style={styles.rowTextStack}>
        <Text style={styles.rowLabel}>{label}</Text>
        {!!value && (
          <Text style={styles.rowValue} numberOfLines={2}>
            {value}
          </Text>
        )}
      </View>
      {right ?? (onPress && <Ionicons name="chevron-forward" size={20} color={GREEN} />)}
    </>
  );
  const style = [styles.row, !last && styles.rowDivider];
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={style}
    >
      {content}
    </Pressable>
  ) : (
    <View style={style}>{content}</View>
  );
}

function DialogCard({
  icon,
  title,
  message,
  danger,
  children,
}: {
  icon: ReactNode;
  title: string;
  message: string;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <View style={[styles.modalIcon, danger && styles.modalIconDanger]}>{icon}</View>
      <Text style={styles.modalTitle}>{title}</Text>
      <Text style={styles.modalMessage}>{message}</Text>
      {children}
    </>
  );
}

function DialogActions({
  onCancel,
  confirmLabel,
  onConfirm,
  disabled,
  danger,
}: {
  onCancel?: () => void;
  confirmLabel: string;
  onConfirm: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <View style={styles.modalActions}>
      {onCancel && (
        <Pressable accessibilityRole="button" onPress={onCancel} style={styles.modalCancel}>
          <Text style={styles.modalCancelText}>Cancel</Text>
        </Pressable>
      )}
      <Pressable
        accessibilityRole="button"
        onPress={onConfirm}
        disabled={disabled}
        style={[
          styles.modalConfirm,
          danger && styles.modalConfirmDanger,
          disabled && styles.disabled,
        ]}
      >
        <Text style={styles.modalConfirmText}>{confirmLabel}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#e8e4df",
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 42,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  heading: {
    fontSize: 34,
    fontWeight: "800",
    color: GREEN,
    marginTop: 10,
  },
  section: {
    marginTop: 18,
  },
  sectionTitle: {
    fontSize: 14,
    color: "#5a675f",
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  card: {
    backgroundColor: "#f7f5f2",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#d9d5d0",
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  standaloneCard: {
    marginTop: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#cfcac4",
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTextStack: {
    flex: 1,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: GREEN,
  },
  rowValue: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  note: {
    fontSize: 12,
    color: MUTED,
    marginTop: 8,
    marginBottom: 10,
  },
  genderOptions: {
    flexDirection: "row",
    gap: 10,
  },
  genderOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d9d5d0",
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  genderOptionActive: {
    borderColor: GREEN,
    backgroundColor: "#dfe9e4",
  },
  genderOptionText: {
    color: "#5a675f",
    fontWeight: "700",
  },
  genderOptionTextActive: {
    color: GREEN,
  },
  clearGender: {
    alignSelf: "flex-start",
    marginTop: 10,
    marginBottom: 8,
  },
  clearGenderText: {
    color: MUTED,
    fontSize: 12,
    textDecorationLine: "underline",
  },
  socialInputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#dfe5df",
    borderRadius: 12,
    paddingLeft: 10,
    paddingRight: 5,
    paddingVertical: 5,
    gap: 4,
  },
  socialInputRowSpaced: {
    marginTop: 8,
    marginBottom: 10,
  },
  socialInput: {
    flex: 1,
    minWidth: 0,
    color: GREEN,
    paddingHorizontal: 6,
    paddingVertical: 6,
    fontSize: 12,
  },
  socialSaveButton: {
    backgroundColor: GREEN,
    borderRadius: 8,
    minWidth: 70,
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  socialSaveText: {
    color: "#f5f3ef",
    fontSize: 12,
    fontWeight: "700",
  },
  disabled: {
    opacity: 0.5,
  },
  languageToggle: {
    flexDirection: "row",
    backgroundColor: "#e5e1dc",
    borderRadius: 8,
    padding: 2,
  },
  languageOption: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 30,
    alignItems: "center",
  },
  languageOptionActive: {
    backgroundColor: "#fff",
  },
  languageText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8a948e",
  },
  languageTextActive: {
    color: GREEN,
  },
  colorOptions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  colorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  colorDotSelected: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  logoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f7f5f2",
    borderWidth: 1,
    borderColor: GREEN,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 24,
  },
  logoutText: {
    color: GREEN,
    fontSize: 18,
    fontWeight: "700",
  },
  deleteButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    marginTop: 6,
  },
  deleteText: {
    color: RED,
    fontSize: 18,
    fontWeight: "700",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#f7f5f2",
    borderRadius: 22,
    padding: 20,
  },
  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#dfe5e0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  modalIconDanger: {
    backgroundColor: "#f6dcdc",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: GREEN,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    color: "#4f5b55",
    lineHeight: 20,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: "#d9d5d0",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginTop: 12,
    backgroundColor: "#fff",
  },
  modalError: {
    color: RED,
    marginTop: 8,
    fontSize: 13,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 18,
  },
  modalCancel: {
    backgroundColor: "#dfe3df",
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 11,
  },
  modalCancelText: {
    color: GREEN,
    fontWeight: "600",
    fontSize: 15,
  },
  modalConfirm: {
    backgroundColor: "#1f4535",
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 11,
    minWidth: 80,
    alignItems: "center",
  },
  modalConfirmDanger: {
    backgroundColor: RED,
  },
  modalConfirmText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
