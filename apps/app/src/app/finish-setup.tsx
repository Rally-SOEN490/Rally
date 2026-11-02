// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { signOut } from "firebase/auth";
import { useState } from "react";
import { Text } from "react-native";
import { AuthScreen, Button, Checkbox, Field } from "@/components/auth";
import { styles } from "@/components/auth/styles";
import { apiErrorMessage, NAME_MAX_LENGTH, saveNewUser } from "@/lib/api";
import { auth } from "@/lib/firebase";
import { useSession } from "@/lib/session";

// Shown to someone who is logged in but has no Rally account yet, for example
// because saving it failed during sign-up. Once it's saved, the guards in
// _layout.tsx take them Home.
export default function FinishSetup() {
  const { user, setAccount } = useSession();
  const [name, setName] = useState((user?.displayName ?? "").slice(0, NAME_MAX_LENGTH));
  const [isOldEnough, setIsOldEnough] = useState(false);

  const save = () => {
    if (!user) return;
    if (!name.trim()) return alert("Please enter your name.");
    if (!isOldEnough) return alert("You must be 14 or older to create a Rally account.");
    saveNewUser(user, name)
      .then(setAccount)
      .catch((e) => alert(apiErrorMessage(e)));
  };

  return (
    <AuthScreen
      title="Finish setting up"
      subtitle="We need a couple of details before you can use Rally."
    >
      <Field
        icon="person"
        placeholder="Full Name"
        maxLength={NAME_MAX_LENGTH}
        value={name}
        onChangeText={setName}
      />
      <Checkbox
        checked={isOldEnough}
        onChange={setIsOldEnough}
        label="I confirm that I am 14 years of age or older"
      />
      <Button title="Continue" onPress={save} />
      <Text style={styles.muted}>
        Wrong account?{" "}
        <Text style={styles.link} onPress={() => signOut(auth)}>
          Log out
        </Text>
      </Text>
    </AuthScreen>
  );
}
