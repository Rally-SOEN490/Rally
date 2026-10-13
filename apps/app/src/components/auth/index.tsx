import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import type { ReactNode } from "react";
import { ImageBackground, Pressable, ScrollView, Text, TextInput, View, type TextInputProps } from "react-native";
import { s, yellow } from "./styles";

const icons = {
  mail: { ios: "envelope", android: "mail", web: "mail" },
  lock: { ios: "lock", android: "lock", web: "lock" },
  person: { ios: "person", android: "person", web: "person" },
  ball: { ios: "volleyball", android: "sports_volleyball", web: "sports_volleyball" },
} as const;

export function AuthScreen({ kicker, title, subtitle, children }: { kicker?: string; title: string; subtitle?: string; children: ReactNode }) {
  return (
    <ImageBackground source={require("@/assets/images/auth-background.jpg")} style={s.screen}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <StatusBar style="light" />
        <View style={s.logo}>
          <SymbolView name={icons.ball} size={30} tintColor={yellow} style={s.center} />
        </View>
        <Text style={s.hero}>It's time to</Text>
        <Text style={[s.hero, s.rally]}>Rally Up</Text>
        <View style={s.card}>
          {!!kicker && <Text style={s.muted}>{kicker}</Text>}
          <Text style={s.title}>{title}</Text>
          {!!subtitle && <Text style={s.muted}>{subtitle}</Text>}
          {children}
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

export const Field = ({ icon, ...props }: TextInputProps & { icon: keyof typeof icons }) => (
  <View style={s.field}>
    <SymbolView name={icons[icon]} size={18} tintColor="#888" style={s.center} />
    <TextInput style={s.input} placeholderTextColor="#888" {...props} />
  </View>
);

export const Button = ({ title, onPress }: { title: string; onPress?: () => void }) => (
  <Pressable style={s.button} onPress={onPress}>
    <Text style={s.buttonText}>{title}</Text>
  </Pressable>
);

export const Social = () => (
  <>
    <Text style={s.muted}>or continue with</Text>
    <Pressable style={s.google}>
      <Text style={s.title}>G</Text>
    </Pressable>
  </>
);
