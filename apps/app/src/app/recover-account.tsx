import { sendPasswordResetEmail } from "firebase/auth";
import { useState } from "react";
import { AuthScreen, Button, Field, Footer } from "@/components/auth";
import { authErrorMessage } from "@/lib/auth-errors";
import { auth } from "@/lib/firebase";

export default function RecoverAccount() {
  const [email, setEmail] = useState("");
  const reset = () =>
    sendPasswordResetEmail(auth, email)
      .then(() => alert("Check your e-mail for a reset link"))
      .catch((e) => alert(authErrorMessage(e)));

  return (
    <AuthScreen
      title="Recover your account"
      subtitle="Enter the e-mail you used to create your account"
    >
      <Field
        icon="mail"
        placeholder="E-mail address"
        keyboardType="email-address"
        autoCapitalize="none"
        onChangeText={setEmail}
      />
      <Button title="Reset Password" onPress={reset} />
      <Footer text="Back to" label="log in" href="/login" />
    </AuthScreen>
  );
}
