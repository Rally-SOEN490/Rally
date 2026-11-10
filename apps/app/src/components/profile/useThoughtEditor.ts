// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { useState } from "react";
import { apiErrorMessage, updateMyAccount } from "@/lib/api";
import type { Session } from "@/lib/session";

// The editor for the short public "thought" shown above the profile photo.
export function useThoughtEditor({ user, account, setAccount }: Session) {
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState(account?.thoughtText ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const open = () => {
    setText(account?.thoughtText ?? "");
    setError("");
    setVisible(true);
  };

  const close = () => setVisible(false);

  // Saves the thought (or null to delete it) and closes the editor.
  const persist = async (thoughtText: string | null) => {
    if (!user) return;
    setSaving(true);
    setError("");
    try {
      setAccount(await updateMyAccount(user, { thoughtText }));
      setVisible(false);
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  const save = async () => {
    if (!user) return;
    const trimmed = text.trim();
    if (!trimmed) return setError("Write a thought before sharing.");
    await persist(trimmed);
  };

  const remove = () => persist(null);

  return { visible, open, close, text, setText, saving, error, save, remove };
}
