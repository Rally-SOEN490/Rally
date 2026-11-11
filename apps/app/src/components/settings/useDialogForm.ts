// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { useState } from "react";

// Every popup on this screen. Only one is shown at a time, inside a single
// Modal, so going from "Change e-mail" to "Verification email sent" never
// stacks two modals (which iOS doesn't handle well).
export type Dialog =
  "name" | "email" | "password" | "logout" | "delete" | "emailSent" | "passwordChanged";

// Popups that close when you tap outside them. The ones with text fields
// don't, so a stray tap can't throw away what you typed.
export const DISMISSABLE: Dialog[] = ["logout", "emailSent", "passwordChanged"];

// Which popup is open, what has been typed into it, and whether it's saving.
export function useDialogForm(displayName: string) {
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newValue, setNewValue] = useState("");
  const [confirmValue, setConfirmValue] = useState("");
  const [deleteEmail, setDeleteEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const resetFields = () => {
    setCurrentPassword("");
    setNewValue("");
    setConfirmValue("");
    setDeleteEmail("");
    setError("");
  };

  const open = (next: Dialog) => {
    resetFields();
    if (next === "name") setNewValue(displayName);
    setDialog(next);
  };

  const close = () => {
    if (busy) return;
    setDialog(null);
    resetFields();
  };

  return {
    dialog,
    setDialog,
    currentPassword,
    setCurrentPassword,
    newValue,
    setNewValue,
    confirmValue,
    setConfirmValue,
    deleteEmail,
    setDeleteEmail,
    busy,
    setBusy,
    error,
    setError,
    resetFields,
    open,
    close,
  };
}

export type DialogForm = ReturnType<typeof useDialogForm>;
