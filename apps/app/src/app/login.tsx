import { router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { AuthScreen, Button, Field, Footer, Social } from "@/components/auth";
import { auth } from "@/lib/firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = () => signInWithEmailAndPassword(auth, email, password).then(() => router.replace("/home"), (e) => alert(e.message));

  return (
    <AuthScreen kicker="Welcome back" title="Log in">
      <Field icon="mail" placeholder="E-mail address" keyboardType="email-address" autoCapitalize="none" onChangeText={setEmail} />
      <Field icon="lock" placeholder="Password" secureTextEntry onChangeText={setPassword} />
      <Button title="Log in" onPress={login} />
      <Social />
      <Footer text="New to Rally?" label="Sign up" href="/sign-up" />
    </AuthScreen>
  );
}
