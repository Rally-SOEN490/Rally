// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { sendEmailVerification, signOut } from "firebase/auth";
import { Text } from "react-native";
import { AuthScreen, Button } from "@/components/auth";
import { styles } from "@/components/auth/styles";
import { authErrorMessage } from "@/lib/auth-errors";
import { auth } from "@/lib/firebase";
import { useSession } from "@/lib/session";

export default function VerifyEmail() {
  const { user, refresh } = useSession();

  // If the link was clicked, refresh() updates emailVerified and the guards in
  // _layout.tsx take you to Home.
  const checkVerified = () =>
    refresh()
      .then(() => {
        if (!auth.currentUser?.emailVerified)
          alert("Your email isn't verified yet. Click the link in the email we sent you.");
      })
      .catch((e) => alert(authErrorMessage(e)));

  const resend = () => {
    if (!user) return;
    sendEmailVerification(user)
      .then(() => alert("We sent you a new verification email."))
      .catch((e) => alert(authErrorMessage(e)));
  };

  return (
    <AuthScreen
      title="Verify your email"
      subtitle={`We sent a link to ${user?.email}. Click it, then come back here.`}
    >
      <Button title="I've verified my email" onPress={checkVerified} />
      <Button title="Resend email" onPress={resend} />
      <Text style={styles.muted}>
        Wrong account?{" "}
        <Text style={styles.link} onPress={() => signOut(auth)}>
          Log out
        </Text>
      </Text>
    </AuthScreen>
  );
}
