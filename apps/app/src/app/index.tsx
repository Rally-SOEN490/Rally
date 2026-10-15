import { Redirect } from "expo-router";
import { ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "@/lib/session";

export default function Index() {
  const { user, isLoading } = useSession();

  if (isLoading)
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  if (!user) return <Redirect href={"/login" as any} />;
  if (!user.emailVerified) return <Redirect href={"/verify-email" as any} />;
  return <Redirect href={"/home" as any} />;
}
