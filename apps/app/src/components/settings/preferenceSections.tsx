// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import {
  apiErrorMessage,
  updateMyAccount,
  type ColorTheme,
  type Language,
  type ProfileChanges,
} from "@/lib/api";
import type { Session } from "@/lib/session";
import { notify } from "./notify";
import { Row, Section } from "./rows";
import { styles } from "./styles";

const COLOR_THEMES: { key: ColorTheme; color: string; label: string }[] = [
  { key: "green", color: "#1d4d3b", label: "Green" },
  { key: "blue", color: "#2f6ca3", label: "Blue" },
  { key: "pink", color: "#d4679b", label: "Pink" },
];

type Preferences = {
  notificationsEnabled: boolean;
  language: Language;
  colorTheme: ColorTheme;
  colorBlindMode: boolean;
  darkMode: boolean;
};

type SavePreference = <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;

// Preferences are saved to Rally's database as soon as they change, and put
// back if the save fails.
function usePreferences({ user, account, setAccount }: Session) {
  const [prefs, setPrefs] = useState<Preferences>({
    notificationsEnabled: account?.notificationsEnabled ?? true,
    language: account?.language ?? "EN",
    colorTheme: account?.colorTheme ?? "green",
    colorBlindMode: account?.colorBlindMode ?? false,
    darkMode: account?.darkMode ?? false,
  });

  const save = async <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    if (!user) return;
    const previous = prefs[key];
    setPrefs((current) => ({ ...current, [key]: value }));
    try {
      // `key` is always one of the five settings and `value` matches it, so this
      // is one of the shapes ProfileChanges allows, like { darkMode: true }.
      // TypeScript can't work that out from a computed key, hence the cast.
      const changes = { [key]: value } as unknown as ProfileChanges;
      setAccount(await updateMyAccount(user, changes));
    } catch (error) {
      setPrefs((current) => ({ ...current, [key]: previous }));
      notify("Unable to save setting", apiErrorMessage(error));
    }
  };

  // The switches and buttons ignore the result; save shows its own errors.
  const savePreference: SavePreference = (key, value) => void save(key, value);

  return { prefs, save: savePreference };
}

function PreferenceSwitch({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{ false: "#d9d5d0", true: "#1d5c4d" }}
    />
  );
}

function LanguageToggle({ language, save }: { language: Language; save: SavePreference }) {
  return (
    <View style={styles.languageToggle}>
      {(["EN", "FR"] as const).map((option) => (
        <Pressable
          key={option}
          accessibilityRole="radio"
          accessibilityState={{ checked: language === option }}
          onPress={() => save("language", option)}
          style={[styles.languageOption, language === option && styles.languageOptionActive]}
        >
          <Text style={[styles.languageText, language === option && styles.languageTextActive]}>
            {option}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function ColorThemePicker({ colorTheme, save }: { colorTheme: ColorTheme; save: SavePreference }) {
  return (
    <View style={styles.colorOptions}>
      {COLOR_THEMES.map(({ key, color, label }) => {
        const selected = colorTheme === key;
        return (
          <Pressable
            key={key}
            accessibilityRole="radio"
            accessibilityLabel={label}
            accessibilityState={{ checked: selected }}
            onPress={() => save("colorTheme", key)}
            hitSlop={6}
            style={[
              styles.colorDot,
              selected && styles.colorDotSelected,
              { backgroundColor: color },
            ]}
          />
        );
      })}
    </View>
  );
}

function AppPreferencesSection({ prefs, save }: { prefs: Preferences; save: SavePreference }) {
  return (
    <Section title="App preferences">
      <Row
        icon={<Ionicons name="language" size={20} color="#3b6ea5" />}
        iconBackground="#dbe8f5"
        label="Language"
        right={<LanguageToggle language={prefs.language} save={save} />}
      />
      <Row
        icon={<Ionicons name="color-palette" size={20} color="#c2557f" />}
        iconBackground="#f8dce8"
        label="Color theme"
        right={<ColorThemePicker colorTheme={prefs.colorTheme} save={save} />}
      />
      <Row
        icon={<Ionicons name="eye-outline" size={20} color="#6f5cc2" />}
        iconBackground="#e6e0f7"
        label="Color blind mode"
        value="Swaps colour-only cues for patterns and labels"
        right={
          <PreferenceSwitch
            value={prefs.colorBlindMode}
            onChange={(value) => save("colorBlindMode", value)}
          />
        }
      />
      <Row
        icon={<Ionicons name="moon" size={18} color="#5b63b7" />}
        iconBackground="#e3e5f7"
        label="Dark mode"
        value="Switch between light and dark"
        right={
          <PreferenceSwitch value={prefs.darkMode} onChange={(value) => save("darkMode", value)} />
        }
        last
      />
    </Section>
  );
}

// The Notifications and App preferences sections.
export function PreferenceSections({ session }: { session: Session }) {
  const { prefs, save } = usePreferences(session);
  return (
    <>
      <Section title="Notifications">
        <Row
          icon={<Ionicons name="notifications" size={20} color="#c99a06" />}
          iconBackground="#fbe7a1"
          label="Notifications"
          value="Tournament and team alerts"
          right={
            <PreferenceSwitch
              value={prefs.notificationsEnabled}
              onChange={(value) => save("notificationsEnabled", value)}
            />
          }
          last
        />
      </Section>
      <AppPreferencesSection prefs={prefs} save={save} />
    </>
  );
}
