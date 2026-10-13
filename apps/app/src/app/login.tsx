import { Link, router } from "expo-router";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import {
  AuthScreen,
  Button,
  Field,
  Footer,
  SocialLogin,
} from "@/components/auth";
import { styles } from "@/components/auth/styles";
import { auth } from "@/lib/firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = () =>
    signInWithEmailAndPassword(auth, email, password)
      .then(() => router.replace("/home"))
      .catch((e) => alert(e.message));

  return (
    <AuthScreen greeting="Welcome back" title="Log in">
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
        right={
          <Link href="/recover-account" style={styles.link}>
            Forgot?
          </Link>
        }
      />
      <Button title="Log in" onPress={login} />
      <SocialLogin />
      <Footer text="New to Rally?" label="Sign up" href="/sign-up" />
    </AuthScreen>
  );
}
