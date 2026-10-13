import { router } from "expo-router";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useState } from "react";
import { AuthScreen, Button, Field, Social } from "@/components/auth";
import { auth } from "@/lib/firebase";

export default function SignUp() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const signUp = () =>
    createUserWithEmailAndPassword(auth, email, password)
      .then(({ user }) => updateProfile(user, { displayName: name }))
      .then(() => router.replace("/home"), (e) => alert(e.message));

  return (
    <AuthScreen kicker="Welcome to Rally" title="Sign up">
      <Field icon="person" placeholder="Full Name" onChangeText={setName} />
      <Field icon="mail" placeholder="E-mail address" keyboardType="email-address" autoCapitalize="none" onChangeText={setEmail} />
      <Field icon="lock" placeholder="Password" secureTextEntry onChangeText={setPassword} />
      <Field icon="lock" placeholder="Confirm Password" secureTextEntry />
      <Button title="Sign up" onPress={signUp} />
      <Social />
    </AuthScreen>
  );
}
