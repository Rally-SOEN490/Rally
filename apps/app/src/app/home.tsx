import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { Button, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "@/lib/firebase";

export default function Home() {
  return (
    <SafeAreaView>
      <Text>Logged in as {auth.currentUser?.email}</Text>
      <Button title="Log out" onPress={() => signOut(auth).then(() => router.replace("/login"))} />
    </SafeAreaView>
  );
}
