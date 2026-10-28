// Copyright (c) 2026 Rally. All rights reserved.

import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { useState } from "react";
import { AuthScreen, Button, Checkbox, Field, Footer, SocialLogin } from "@/components/auth";
import { NAME_MAX_LENGTH, saveNewUser } from "@/lib/api";
import { authErrorMessage } from "@/lib/auth-errors";
import { auth } from "@/lib/firebase";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isOldEnough, setIsOldEnough] = useState(false);
  // No navigation here: once the account exists, the guards in _layout.tsx
  // move you to the "verify your email" screen.
  const signUp = () => {
    if (!name.trim()) return alert("Please enter your name.");
    if (password !== confirmPassword) return alert("Passwords don't match");
    if (!isOldEnough) return alert("You must be 14 or older to create a Rally account.");
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
  };

  return (
    <AuthScreen greeting="Welcome to Rally" title="Sign up">
      <Field
        icon="person"
        placeholder="Full Name"
        maxLength={NAME_MAX_LENGTH}
        onChangeText={setName}
      />
      <Field
        icon="mail"
        placeholder="E-mail address"
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={setEmail}
      />
      <Field icon="lock" placeholder="Password" secureTextEntry onChangeText={setPassword} />
      <Field
        icon="lock"
        placeholder="Confirm Password"
        secureTextEntry
        onChangeText={setConfirmPassword}
      />
      <Checkbox
        checked={isOldEnough}
        onChange={setIsOldEnough}
        label="I confirm that I am 14 years of age or older"
      />
      <Button title="Sign up" onPress={signUp} />
      <SocialLogin />
      <Footer text="Already a member?" label="Log in" href="/login" />
    </AuthScreen>
  );
}
