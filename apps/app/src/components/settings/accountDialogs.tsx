// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Modal, Pressable, Text, TextInput, View } from "react-native";
import { NAME_MAX_LENGTH } from "@/lib/api";
import { DialogActions, DialogCard } from "./dialogParts";
import { GREEN, RED, styles } from "./styles";
import { type Dialog, type DialogForm, DISMISSABLE } from "./useDialogForm";

// What each confirm button does. Settings passes these in so the popups only
// handle what is shown and typed.
export type DialogHandlers = {
  saveName: () => void;
  saveEmail: () => void;
  savePassword: () => void;
  logOut: () => void;
  deleteAccount: () => void;
};

type DialogProps = { form: DialogForm; handlers: DialogHandlers };

const saveLabel = (form: DialogForm) => (form.busy ? "Saving…" : "Save");

function ErrorText({ form }: { form: DialogForm }) {
  return form.error ? <Text style={styles.modalError}>{form.error}</Text> : null;
}

// A password field that also has autoCapitalize turned off.
function PasswordInput({
  value,
  onChangeText,
  placeholder,
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      secureTextEntry
      autoCapitalize="none"
      placeholder={placeholder}
      style={styles.modalInput}
    />
  );
}

function NameDialog({ form, handlers }: DialogProps) {
  return (
    <DialogCard
      icon={<Ionicons name="person-outline" size={24} color={GREEN} />}
      title="Change name"
      message="This is the name other players see on your profile."
    >
      <TextInput
        value={form.newValue}
        onChangeText={form.setNewValue}
        maxLength={NAME_MAX_LENGTH}
        placeholder="Full name"
        selectTextOnFocus
        style={styles.modalInput}
      />
      <ErrorText form={form} />
      <DialogActions
        onCancel={form.close}
        confirmLabel={saveLabel(form)}
        onConfirm={handlers.saveName}
        disabled={form.busy || !form.newValue.trim()}
      />
    </DialogCard>
  );
}

function EmailDialog({ form, handlers }: DialogProps) {
  return (
    <DialogCard
      icon={<Ionicons name="mail" size={22} color={GREEN} />}
      title="Change e-mail"
      message="Enter your current password and your new e-mail. We'll send a verification link to the new address."
    >
      <PasswordInput
        value={form.currentPassword}
        onChangeText={form.setCurrentPassword}
        placeholder="Current password"
      />
      <TextInput
        value={form.newValue}
        onChangeText={form.setNewValue}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="New e-mail address"
        style={styles.modalInput}
      />
      <ErrorText form={form} />
      <DialogActions
        onCancel={form.close}
        confirmLabel={saveLabel(form)}
        onConfirm={handlers.saveEmail}
        disabled={form.busy || !form.currentPassword || !form.newValue.trim()}
      />
    </DialogCard>
  );
}

function PasswordDialog({ form, handlers }: DialogProps) {
  return (
    <DialogCard
      icon={<Ionicons name="lock-closed" size={22} color={GREEN} />}
      title="Change password"
      message="Enter your current password, then choose a new one."
    >
      <PasswordInput
        value={form.currentPassword}
        onChangeText={form.setCurrentPassword}
        placeholder="Current password"
      />
      <PasswordInput
        value={form.newValue}
        onChangeText={form.setNewValue}
        placeholder="New password"
      />
      <PasswordInput
        value={form.confirmValue}
        onChangeText={form.setConfirmValue}
        placeholder="Confirm new password"
      />
      <ErrorText form={form} />
      <DialogActions
        onCancel={form.close}
        confirmLabel={saveLabel(form)}
        onConfirm={handlers.savePassword}
        disabled={form.busy || !form.currentPassword || !form.newValue || !form.confirmValue}
      />
    </DialogCard>
  );
}

function EmailSentDialog({ form }: DialogProps) {
  return (
    <DialogCard
      icon={<MaterialCommunityIcons name="email-check" size={24} color={GREEN} />}
      title="Verification email sent"
      message="We sent a verification link to your new e-mail address. Once you accept it, your e-mail will change."
    >
      <DialogActions confirmLabel="OK" onConfirm={form.close} />
    </DialogCard>
  );
}

function PasswordChangedDialog({ form }: DialogProps) {
  return (
    <DialogCard
      icon={<Ionicons name="lock-closed" size={22} color={GREEN} />}
      title="Password changed"
      message="Your password has successfully been changed."
    >
      <DialogActions confirmLabel="OK" onConfirm={form.close} />
    </DialogCard>
  );
}

function LogoutDialog({ form, handlers }: DialogProps) {
  return (
    <DialogCard
      icon={<Ionicons name="log-out-outline" size={24} color={GREEN} />}
      title="Log out?"
      message="Are you sure you want to log out? You'll need to sign in again to see your teams and tournaments."
    >
      <ErrorText form={form} />
      <DialogActions
        onCancel={form.close}
        confirmLabel={form.busy ? "Logging out…" : "Log out"}
        onConfirm={handlers.logOut}
        disabled={form.busy}
      />
    </DialogCard>
  );
}

function DeleteDialog({ form, handlers }: DialogProps) {
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
        value={form.deleteEmail}
        onChangeText={form.setDeleteEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        placeholder="E-mail address"
        style={styles.modalInput}
      />
      <PasswordInput
        value={form.currentPassword}
        onChangeText={form.setCurrentPassword}
        placeholder="Password"
      />
      <ErrorText form={form} />
      <DialogActions
        onCancel={form.close}
        confirmLabel={form.busy ? "Deleting…" : "Delete account"}
        onConfirm={handlers.deleteAccount}
        disabled={form.busy || !form.deleteEmail.trim() || !form.currentPassword}
        danger
      />
    </DialogCard>
  );
}

const dialogs: Record<Dialog, (props: DialogProps) => React.JSX.Element> = {
  name: NameDialog,
  email: EmailDialog,
  password: PasswordDialog,
  emailSent: EmailSentDialog,
  passwordChanged: PasswordChangedDialog,
  logout: LogoutDialog,
  delete: DeleteDialog,
};

// The one Modal that shows whichever popup is open.
export function AccountDialogModal({ form, handlers }: DialogProps) {
  const Content = form.dialog ? dialogs[form.dialog] : null;
  return (
    <Modal
      visible={form.dialog !== null}
      transparent
      animationType="fade"
      onRequestClose={form.close}
    >
      <Pressable
        testID="dialog-backdrop"
        style={styles.modalBackdrop}
        onPress={form.dialog && DISMISSABLE.includes(form.dialog) ? form.close : undefined}
      >
        {/* Catches taps on the card so they don't reach the backdrop. */}
        <View testID="dialog" onStartShouldSetResponder={() => true} style={styles.modalCard}>
          {Content && <Content form={form} handlers={handlers} />}
        </View>
      </Pressable>
    </Modal>
  );
}
