// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Ionicons } from "@expo/vector-icons";
import {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { formatDate, formatTime } from "@/lib/organizer-tournaments";
import { tournamentCopy } from "@/translations/tournaments.en";
import { IosPickerSheet } from "./iosPickerSheet";
import { GREEN, MUTED, styles } from "./styles";

export type DateTimeFieldProps = {
  mode: "date" | "time";
  // "YYYY-MM-DD" for a date, "HH:mm" for a time. Montreal time, so it is never
  // converted to the phone's time zone: only the numbers shown are used.
  value: string | null;
  onChange: (value: string | null) => void;
  accessibilityLabel: string;
};

const pad = (n: number) => String(n).padStart(2, "0");

// The picker works with the phone's local time; we only read back the numbers.
const toPickerDate = (mode: "date" | "time", value: string | null) => {
  const now = new Date();
  if (!value) return now;
  if (mode === "date") {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day, 12);
  }
  const [hours, minutes] = value.split(":").map(Number);
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
};

const fromPickerDate = (mode: "date" | "time", date: Date) =>
  mode === "date"
    ? `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    : `${pad(date.getHours())}:${pad(date.getMinutes())}`;

// A date or time field. Phones use their own picker: a dialog on Android, and
// on iOS a sheet from the bottom of the screen. The web version is dateTimeField.web.tsx.
export function DateTimeField({ mode, value, onChange, accessibilityLabel }: DateTimeFieldProps) {
  const [iosOpen, setIosOpen] = useState(false);
  const pick = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === "set" && date) onChange(fromPickerDate(mode, date));
  };
  const open = () =>
    Platform.OS === "android"
      ? DateTimePickerAndroid.open({ value: toPickerDate(mode, value), mode, onChange: pick })
      : setIosOpen(true);

  return (
    <View>
      <FieldButton
        mode={mode}
        value={value}
        label={accessibilityLabel}
        onPress={open}
        onClear={() => onChange(null)}
      />
      {iosOpen && (
        <IosPickerSheet
          mode={mode}
          initial={toPickerDate(mode, value)}
          label={accessibilityLabel}
          onDone={(date) => {
            setIosOpen(false);
            onChange(fromPickerDate(mode, date));
          }}
          onCancel={() => setIosOpen(false)}
        />
      )}
    </View>
  );
}

function FieldButton({
  mode,
  value,
  label,
  onPress,
  onClear,
}: {
  mode: "date" | "time";
  value: string | null;
  label: string;
  onPress: () => void;
  onClear: () => void;
}) {
  const copy = tournamentCopy.setup;
  const text = value
    ? mode === "date"
      ? formatDate(value)
      : formatTime(value)
    : mode === "date"
      ? copy.pickDate
      : copy.pickTime;
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text }}
        onPress={onPress}
        style={[styles.pickerButton, !!value && styles.pickerHasClear]}
      >
        <Ionicons
          name={mode === "date" ? "calendar-outline" : "time-outline"}
          size={18}
          color={value ? GREEN : MUTED}
        />
        <Text style={[styles.pickerText, !value && styles.placeholder]}>{text}</Text>
      </Pressable>
      {!!value && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.clearDateTime(label)}
          accessibilityHint={copy.clearDateTimeHint}
          onPress={onClear}
          style={styles.clearPickerButton}
        >
          <Ionicons name="close-circle" size={20} color={MUTED} />
        </Pressable>
      )}
    </View>
  );
}
