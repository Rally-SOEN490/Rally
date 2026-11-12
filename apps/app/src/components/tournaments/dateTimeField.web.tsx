// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { CSSProperties } from "react";
import type { DateTimeFieldProps } from "./dateTimeField";
import { MUTED } from "./styles";
import { tournamentCopy } from "@/translations/tournaments.en";

// The web version of DateTimeField: the browser's own date and time inputs,
// which every current browser supports, with its calendar and keyboard entry.
// They read and write "YYYY-MM-DD" and "HH:mm", the same format the app uses.
export function DateTimeField({ mode, value, onChange, accessibilityLabel }: DateTimeFieldProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <input
        type={mode}
        aria-label={accessibilityLabel}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
        style={inputStyle}
      />
      {!!value && (
        <button
          type="button"
          aria-label={tournamentCopy.setup.clearDateTime(accessibilityLabel)}
          title={tournamentCopy.setup.clearDateTimeHint}
          onClick={() => onChange(null)}
          style={{
            border: 0,
            background: "transparent",
            color: MUTED,
            minWidth: 44,
            minHeight: 44,
            cursor: "pointer",
            fontSize: 22,
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

const inputStyle: CSSProperties = {
  boxSizing: "border-box",
  width: "100%",
  minWidth: 0,
  backgroundColor: "#f2f2ed",
  border: "1px solid #e4e4de",
  borderRadius: 12,
  padding: "11px 12px",
  fontSize: 15,
  fontFamily: "inherit",
  color: "#101b15",
};
