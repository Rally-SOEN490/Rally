import { Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SymbolView } from "expo-symbols";
import type { ComponentProps, ReactNode } from "react";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import { styles, yellow } from "./styles";

const icons = {
  mail: { ios: "envelope", android: "mail", web: "mail" },
  lock: { ios: "lock", android: "lock", web: "lock" },
  person: { ios: "person", android: "person", web: "person" },
  check: { ios: "checkmark", android: "check", web: "check" },
  ball: {
    ios: "volleyball",
    android: "sports_volleyball",
    web: "sports_volleyball",
  },
} as const;

export const AuthScreen = ({
  greeting,
  title,
  subtitle,
  children,
}: {
  greeting?: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) => (
  <ImageBackground
    source={require("@/assets/images/auth-background.jpg")}
    style={styles.screen}
  >
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar style="light" />
      <View style={styles.logo}>
        <SymbolView
          name={icons.ball}
          size={30}
          tintColor={yellow}
          style={styles.center}
        />
      </View>
      <Text style={styles.hero}>It's time to</Text>
      <Text style={[styles.hero, styles.highlight]}>Rally Up</Text>
      <View style={styles.card}>
        {!!greeting && <Text style={styles.muted}>{greeting}</Text>}
        <Text style={styles.title}>{title}</Text>
        {!!subtitle && <Text style={styles.muted}>{subtitle}</Text>}
        {children}
      </View>
    </ScrollView>
  </ImageBackground>
);

export const Field = ({
  icon,
  right,
  ...props
}: TextInputProps & { icon: keyof typeof icons; right?: ReactNode }) => (
  <View style={styles.field}>
    <SymbolView
      name={icons[icon]}
      size={18}
      tintColor="#888"
      style={styles.center}
    />
    <TextInput style={styles.input} placeholderTextColor="#888" {...props} />
    {right}
  </View>
);

export const Button = ({
  title,
  onPress,
}: {
  title: string;
  onPress?: () => void;
}) => (
  <Pressable role="button" style={styles.button} onPress={onPress}>
    <Text style={styles.buttonText}>{title}</Text>
  </Pressable>
);

export const Checkbox = ({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) => (
  <Pressable
    style={styles.checkboxRow}
    onPress={() => onChange(!checked)}
    accessibilityRole="checkbox"
    accessibilityState={{ checked }}
  >
    <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
      {checked && (
        <SymbolView
          name={icons.check}
          size={14}
          tintColor={yellow}
          style={styles.center}
        />
      )}
    </View>
    <Text style={styles.checkboxLabel}>{label}</Text>
  </Pressable>
);

export const SocialLogin = () => (
  <>
    <Text style={styles.muted}>or continue with</Text>
    <Pressable style={styles.googleButton}>
      <Text style={styles.title}>G</Text>
    </Pressable>
  </>
);

export const Footer = ({
  text,
  label,
  href,
}: {
  text: string;
  label: string;
  href: ComponentProps<typeof Link>["href"];
}) => (
  <Text style={styles.muted}>
    {text}{" "}
    <Link dismissTo href={href} style={styles.link}>
      {label}
    </Link>
  </Text>
);
