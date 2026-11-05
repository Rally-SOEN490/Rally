// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { formatDate, formatTime } from "@/lib/organizer-tournaments";
import { tournamentCopy } from "@/translations/tournaments.en";
import { GREEN, MUTED, styles } from "./styles";

export type DateTimeFieldProps = {
  mode: "date" | "time";
  // "YYYY-MM-DD" for a date, "HH:mm" for a time. Montreal time, so it is never
  // converted to the phone's time zone: only the numbers shown are used.
  value: string | null;
  onChange: (value: string) => void;
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
// on iOS a picker that opens under the field. The web version is dateTimeField.web.tsx.
export function DateTimeField({ mode, value, onChange, accessibilityLabel }: DateTimeFieldProps) {
  const [iosOpen, setIosOpen] = useState(false);
  const pick = (event: DateTimePickerEvent, date?: Date) => {
    if (event.type === "set" && date) onChange(fromPickerDate(mode, date));
  };
  const open = () =>
    Platform.OS === "android"
      ? DateTimePickerAndroid.open({ value: toPickerDate(mode, value), mode, onChange: pick })
      : setIosOpen((isOpen) => !isOpen);

  return (
    <View>
      <FieldButton mode={mode} value={value} label={accessibilityLabel} onPress={open} />
      {iosOpen && (
        <DateTimePicker
          testID={`${accessibilityLabel} picker`}
          value={toPickerDate(mode, value)}
          mode={mode}
          display={mode === "date" ? "inline" : "spinner"}
          onChange={(event, date) => date && onChange(fromPickerDate(mode, date))}
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
}: {
  mode: "date" | "time";
  value: string | null;
  label: string;
  onPress: () => void;
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
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityValue={{ text }}
      onPress={onPress}
      style={styles.pickerButton}
    >
      <Ionicons
        name={mode === "date" ? "calendar-outline" : "time-outline"}
        size={18}
        color={value ? GREEN : MUTED}
      />
      <Text style={[styles.pickerText, !value && styles.placeholder]}>{text}</Text>
    </Pressable>
  );
}
