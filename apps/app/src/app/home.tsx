import { signOut } from "firebase/auth";
import { useEffect, useState } from "react";
import { Button, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ApiError, getMyAccount, type RallyUser } from "@/lib/api";
import { auth } from "@/lib/firebase";
import { useSession } from "@/lib/session";

export default function Home() {
  const { user } = useSession();
  // undefined while loading, null if the API has no account for this login.
  const [account, setAccount] = useState<RallyUser | null>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!user) return;
    getMyAccount(user)
      .then(setAccount)
      .catch((e) =>
        setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again."),
      );
  }, [user]);

  return (
    <SafeAreaView>
      <Text>Logged in as {user?.email}</Text>
      {error ? (
        <Text>{error}</Text>
      ) : account === undefined ? (
        <Text>Loading your Rally account…</Text>
      ) : account === null ? (
        <Text>{"We couldn't find your Rally account."}</Text>
      ) : (
        <Text>
          Welcome, {account.displayName}! Member since{" "}
          {new Date(account.createdAt).toLocaleDateString()}.
        </Text>
      )}
      <Button title="Log out" onPress={() => signOut(auth)} />
    </SafeAreaView>
  );
}
