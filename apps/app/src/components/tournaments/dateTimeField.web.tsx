// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { CSSProperties } from "react";
import type { DateTimeFieldProps } from "./dateTimeField";

// The web version of DateTimeField: the browser's own date and time inputs,
// which every current browser supports, with its calendar and keyboard entry.
// They read and write "YYYY-MM-DD" and "HH:mm", the same format the app uses.
export function DateTimeField({ mode, value, onChange, accessibilityLabel }: DateTimeFieldProps) {
  return (
    <input
      type={mode}
      aria-label={accessibilityLabel}
      value={value ?? ""}
      // Clearing the field gives "", which isn't a value: keep the last one instead.
      onChange={(event) => event.target.value && onChange(event.target.value)}
      style={inputStyle}
    />
  );
}

const inputStyle: CSSProperties = {
  boxSizing: "border-box",
  width: "100%",
  backgroundColor: "#f2f2ed",
  border: "1px solid #e4e4de",
  borderRadius: 12,
  padding: "11px 12px",
  fontSize: 15,
  fontFamily: "inherit",
  color: "#101b15",
};
