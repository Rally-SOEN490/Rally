// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { useState } from "react";
import { apiErrorMessage } from "@/lib/api";
import { deleteTournament, type OrganizerTournament } from "@/lib/organizer-tournaments";
import { useSession } from "@/lib/session";
import { tournamentCopy } from "@/translations/tournaments.en";
import { ConfirmDialog } from "./confirmDialog";

const copy = tournamentCopy.events;

// Asks before deleting a draft, then deletes it. `onDeleted` runs only once the
// server confirms, so the list never drops a draft that still exists.
export function useDeleteDraft(onDeleted: (id: string) => void) {
  const { user } = useSession();
  const [target, setTarget] = useState<OrganizerTournament | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    setTarget(null);
    setError("");
  };
  const confirm = async () => {
    if (!user || !target || busy) return;
    setBusy(true);
    setError("");
    try {
      await deleteTournament(user, target.id);
      onDeleted(target.id);
      close();
    } catch (failure) {
      setError(apiErrorMessage(failure));
    } finally {
      setBusy(false);
    }
  };

  const dialog = (
    <ConfirmDialog
      visible={target !== null}
      title={copy.deleteTitle(target?.name ?? "")}
      message={copy.deleteMessage}
      cancelLabel={copy.cancel}
      confirmLabel={busy ? copy.deleting : copy.delete}
      onCancel={close}
      onConfirm={confirm}
      danger
      busy={busy}
      error={error}
    />
  );
  return { ask: setTarget, dialog };
}
