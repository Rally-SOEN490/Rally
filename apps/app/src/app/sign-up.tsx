// Copyright (c) 2026 Rally. All rights reserved.

import { Ionicons } from "@expo/vector-icons";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { AuthScreen, Button, Checkbox, Field, Footer, SocialLogin } from "@/components/auth";
import { clearAccountDeleted, wasAccountJustDeleted } from "@/lib/account-deleted";
import { NAME_MAX_LENGTH, saveNewUser } from "@/lib/api";
import { authErrorMessage } from "@/lib/auth-errors";
import { auth } from "@/lib/firebase";

// Why the form can't be sent yet, or undefined when it's ready.
const signUpProblem = (form: {
  name: string;
  password: string;
  confirmPassword: string;
  isOldEnough: boolean;
}) => {
  if (!form.name.trim()) return "Please enter your name.";
  if (form.password !== form.confirmPassword) return "Passwords don't match";
  if (!form.isOldEnough) return "You must be 14 or older to create a Rally account.";
};

// Creates the Firebase login, then sets the name, sends the verification
// e-mail and saves the account in Rally's database.
const createAccount = (name: string, email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password)
    .then(({ user }) =>
      Promise.all([
        updateProfile(user, { displayName: name }),
        sendEmailVerification(user),
        // Saves the account and the age confirmation in Rally's database. If
        // that fails, the "Finish setting up" screen asks again once the
        // email is verified, so there's no need to show an error here.
        saveNewUser(user, name).catch(() => {}),
      ]),
    )
    .catch((e) => alert(authErrorMessage(e)));

function SignUpFields({
  onChangeName,
  onChangeEmail,
  onChangePassword,
  onChangeConfirmPassword,
}: {
  onChangeName: (value: string) => void;
  onChangeEmail: (value: string) => void;
  onChangePassword: (value: string) => void;
  onChangeConfirmPassword: (value: string) => void;
}) {
  return (
    <>
      <Field
        icon="person"
        placeholder="Full Name"
        maxLength={NAME_MAX_LENGTH}
        onChangeText={onChangeName}
      />
      <Field
        icon="mail"
        placeholder="E-mail address"
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={onChangeEmail}
      />
      <Field
        icon="lock"
        testID="sign-up-password"
        placeholder="Password"
        secureTextEntry
        onChangeText={onChangePassword}
      />
      <Field
        icon="lock"
        testID="sign-up-confirm-password"
        placeholder="Confirm Password"
        secureTextEntry
        onChangeText={onChangeConfirmPassword}
      />
    </>
  );
}

// Shown when Settings sends someone here right after deleting their account.
function AccountDeletedModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Pressing OK or anywhere outside the popup closes it. */}
      <Pressable testID="account-deleted-backdrop" style={deletedStyles.backdrop} onPress={onClose}>
        <View onStartShouldSetResponder={() => true} style={deletedStyles.card}>
          <View style={deletedStyles.icon}>
            <Ionicons name="checkmark-circle-outline" size={26} color="#12382d" />
          </View>
          <Text style={deletedStyles.title}>Account deleted</Text>
          <Text style={deletedStyles.message}>
            Your account has been successfully deleted. We&apos;re sorry to see you go.
          </Text>
          <Pressable accessibilityRole="button" onPress={onClose} style={deletedStyles.ok}>
            <Text style={deletedStyles.okText}>OK</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isOldEnough, setIsOldEnough] = useState(false);
  // Settings sends people here right after deleting their account.
  const [showDeleted, setShowDeleted] = useState(wasAccountJustDeleted);

  const closeDeleted = () => {
    clearAccountDeleted();
    setShowDeleted(false);
  };

  // No navigation here: once the account exists, the guards in _layout.tsx
  // move you to the "verify your email" screen.
  const signUp = () => {
    const problem = signUpProblem({ name, password, confirmPassword, isOldEnough });
    if (problem) return alert(problem);
    createAccount(name, email, password);
  };

  return (
    <>
      <AuthScreen greeting="Welcome to Rally" title="Sign up">
        <SignUpFields
          onChangeName={setName}
          onChangeEmail={setEmail}
          onChangePassword={setPassword}
          onChangeConfirmPassword={setConfirmPassword}
        />
        <Checkbox
          checked={isOldEnough}
          onChange={setIsOldEnough}
          label="I confirm that I am 14 years of age or older"
          testID="sign-up-age-confirmation"
        />
        <Button title="Sign up" onPress={signUp} testID="sign-up-submit" />
        <SocialLogin />
        <Footer text="Already a member?" label="Log in" href="/login" />
      </AuthScreen>

      <AccountDeletedModal visible={showDeleted} onClose={closeDeleted} />
    </>
  );
}

// Matches the popups on the Settings screen.
const deletedStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#f7f5f2",
    borderRadius: 22,
    padding: 20,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#dfe5e0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#12382d",
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: "#4f5b55",
    lineHeight: 20,
  },
  ok: {
    alignSelf: "flex-end",
    backgroundColor: "#1f4535",
    borderRadius: 10,
    paddingHorizontal: 22,
    paddingVertical: 11,
    minWidth: 80,
    alignItems: "center",
    marginTop: 18,
  },
  okText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
