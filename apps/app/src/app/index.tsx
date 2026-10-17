import { Redirect } from "expo-router";
import { signOut } from "firebase/auth";
import { ActivityIndicator, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthScreen, Button } from "@/components/auth";
import { styles } from "@/components/auth/styles";
import { auth } from "@/lib/firebase";
import { useSession } from "@/lib/session";

export default function Index() {
  const { user, isLoading, account, accountError, reloadAccount } = useSession();

  if (!isLoading && !user) return <Redirect href="/login" />;
  if (user && !user.emailVerified) return <Redirect href="/verify-email" />;
  if (accountError)
    return (
      <AuthScreen title="We can't load your account" subtitle={accountError}>
        <Button title="Try again" onPress={reloadAccount} />
        <Text style={styles.muted}>
          Wrong account?{" "}
          <Text style={styles.link} onPress={() => signOut(auth)}>
            Log out
          </Text>
        </Text>
      </AuthScreen>
    );
  if (account === null) return <Redirect href="/finish-setup" />;
  if (account) return <Redirect href="/home" />;

  // Still waiting for Firebase or for the Rally account.
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: "center" }}>
      <ActivityIndicator />
    </SafeAreaView>
  );
}
