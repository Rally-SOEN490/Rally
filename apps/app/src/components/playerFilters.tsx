// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Image } from "expo-image";
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ReactNode } from "react";
import type { PlayerFilters } from "@/lib/player-filters";
import { togglePlayerFilter } from "@/lib/player-filters";
import { PLAYER_INTEREST_OPTIONS, PLAYER_LEVELS, PLAYER_POSITIONS } from "@/lib/player-preferences";
import type { SearchFonts } from "@/lib/search-fonts";
import { playerFilterCopy as copy } from "@/translations/player-filters.en";
import { playerFiltersStyles as styles } from "./playerFilters.styles";

type Props = {
  visible: boolean;
  filters: PlayerFilters;
  onChange: (filters: PlayerFilters) => void;
  onClose: () => void;
  onApply: () => void;
  fonts: SearchFonts;
};

function Option({
  label,
  selected,
  onPress,
  fonts,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  fonts: SearchFonts;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      hitSlop={{ top: 5, bottom: 5 }}
      style={[styles.option, selected && styles.selected]}
    >
      <Text
        style={[styles.optionText, { fontFamily: fonts.medium }, selected && styles.selectedText]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function Section({
  title,
  children,
  fonts,
  divider = true,
}: {
  title: string;
  children: ReactNode;
  fonts: SearchFonts;
  divider?: boolean;
}) {
  return (
    <View>
      <View style={styles.section}>
        <Text accessibilityRole="header" style={[styles.sectionTitle, { fontFamily: fonts.bold }]}>
          {title}
        </Text>
        <View style={styles.options}>{children}</View>
      </View>
      {divider && (
        <Image
          source={require("@/assets/images/player-filters/section-divider.svg")}
          style={styles.divider}
          contentFit="fill"
        />
      )}
    </View>
  );
}

export function PlayerFiltersSheet({ visible, filters, onChange, onClose, onApply, fonts }: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={copy.close}
          style={{ position: "absolute", inset: 0 }}
        />
        <View
          style={[styles.sheet, { minHeight: Math.min(456, height * 0.85) }]}
          accessibilityViewIsModal
        >
          <View style={styles.header}>
            <Text style={[styles.title, { fontFamily: fonts.bold }]} accessibilityRole="header">
              {copy.title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.close}
              onPress={onClose}
              style={styles.close}
              hitSlop={4}
            >
              <Image
                source={require("@/assets/images/player-filters/close-background.svg")}
                style={styles.closeBackground}
                contentFit="contain"
              />
              <Image
                source={require("@/assets/images/player-filters/close.svg")}
                style={styles.closeIcon}
                contentFit="contain"
              />
            </Pressable>
          </View>
          <Image
            source={require("@/assets/images/player-filters/header-divider.svg")}
            style={styles.headerDivider}
            contentFit="fill"
          />
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <Section title={copy.level} fonts={fonts}>
              {PLAYER_LEVELS.map((value) => (
                <Option
                  key={value}
                  label={value}
                  fonts={fonts}
                  selected={filters.levels.includes(value)}
                  onPress={() =>
                    onChange({ ...filters, levels: togglePlayerFilter(filters.levels, value) })
                  }
                />
              ))}
            </Section>
            <Section title={copy.position} fonts={fonts}>
              {PLAYER_POSITIONS.map(({ key, label }) => (
                <Option
                  key={key}
                  label={label}
                  fonts={fonts}
                  selected={filters.positions.includes(key)}
                  onPress={() =>
                    onChange({ ...filters, positions: togglePlayerFilter(filters.positions, key) })
                  }
                />
              ))}
            </Section>
            <Section title={copy.interestedIn} fonts={fonts} divider={false}>
              {PLAYER_INTEREST_OPTIONS.map(({ key, label }) => (
                <Option
                  key={key}
                  label={label}
                  fonts={fonts}
                  selected={filters.interests.includes(key)}
                  onPress={() =>
                    onChange({ ...filters, interests: togglePlayerFilter(filters.interests, key) })
                  }
                />
              ))}
            </Section>
          </ScrollView>
          <View style={[styles.footer, { paddingBottom: Math.max(24, insets.bottom) }]}>
            <Pressable
              accessibilityRole="button"
              onPress={onApply}
              style={styles.apply}
              hitSlop={5}
            >
              <Text style={[styles.applyText, { fontFamily: fonts.bold }]}>{copy.apply}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
