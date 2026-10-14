import { signOut } from "firebase/auth";
import { Button, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "@/lib/firebase";
import { useSession } from "@/lib/session";

export default function Home() {
  const { user } = useSession();

  return (
    <SafeAreaView>
      <Text>Logged in as {user?.email}</Text>
      <Button title="Log out" onPress={() => signOut(auth)} />
    </SafeAreaView>
  );
}
