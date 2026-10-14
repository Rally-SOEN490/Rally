import { router } from "expo-router";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { useState } from "react";
import {
  AuthScreen,
  Button,
  Field,
  Footer,
  SocialLogin,
} from "@/components/auth";
import { auth } from "@/lib/firebase";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const signUp = () => {
    if (password !== confirmPassword) return alert("Passwords don't match");
    createUserWithEmailAndPassword(auth, email, password)
      .then(({ user }) =>
        Promise.all([
          updateProfile(user, { displayName: name }),
          sendEmailVerification(user),
        ]).finally(() => router.replace("/home")),
      )
      .catch((e) => alert(e.message));
  };

  return (
    <AuthScreen greeting="Welcome to Rally" title="Sign up">
      <Field icon="person" placeholder="Full Name" onChangeText={setName} />
      <Field
        icon="mail"
        placeholder="E-mail address"
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={setEmail}
      />
      <Field
        icon="lock"
        placeholder="Password"
        secureTextEntry
        onChangeText={setPassword}
      />
      <Field
        icon="lock"
        placeholder="Confirm Password"
        secureTextEntry
        onChangeText={setConfirmPassword}
      />
      <Button title="Sign up" onPress={signUp} />
      <SocialLogin />
      <Footer text="Already a member?" label="Log in" href="/login" />
    </AuthScreen>
  );
}
