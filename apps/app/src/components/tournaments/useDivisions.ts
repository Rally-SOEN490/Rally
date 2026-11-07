// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { useState } from "react";
import { apiErrorMessage } from "@/lib/api";
import {
  addDivision,
  formatPrice,
  parsePrice,
  publishTournament,
  removeDivision,
  suggestDivisionName,
  updateDivision,
  type Division,
  type DivisionFields,
  type DivisionType,
  type Format,
  type Level,
  type OrganizerTournament,
} from "@/lib/organizer-tournaments";
import { useSession } from "@/lib/session";
import { tournamentCopy } from "@/translations/tournaments.en";

const copy = tournamentCopy.divisions;

// A division being added or edited. `nameEdited` stops the suggested name from
// replacing one the organizer typed.
export type DivisionDraft = {
  id: string | null;
  name: string;
  nameEdited: boolean;
  format: Format;
  type: DivisionType;
  levels: Level[];
  maxTeams: number;
  price: string;
};

const newDraft = (): DivisionDraft => ({
  id: null,
  name: "",
  nameEdited: false,
  format: "6v6",
  type: "coed",
  levels: [],
  maxTeams: 8,
  price: "",
});

const draftFrom = (division: Division): DivisionDraft => ({
  ...division,
  nameEdited: true,
  price: formatPrice(division.priceCents),
});

// Fills in the suggested name, unless the organizer typed their own.
export const withSuggestedName = (draft: DivisionDraft): DivisionDraft =>
  draft.nameEdited
    ? draft
    : { ...draft, name: suggestDivisionName(draft.format, draft.type, draft.levels, copy.types) };

const checkDraft = (draft: DivisionDraft): string | DivisionFields => {
  if (draft.levels.length === 0) return copy.needsLevel;
  if (!draft.name.trim()) return copy.needsName;
  const priceCents = parsePrice(draft.price || "0");
  if (priceCents === undefined) return copy.invalidPrice;
  const { format, type, levels, maxTeams } = draft;
  return { name: draft.name.trim(), format, type, levels, maxTeams, priceCents };
};

// The tournament as the server last sent it, and one request at a time to change it.
function useTournamentRequests(initial: OrganizerTournament) {
  const [tournament, setTournament] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Runs one request; on success shows the tournament the server sent back.
  // On failure, the error shows and whatever was typed stays.
  const run = async (send: () => Promise<OrganizerTournament>) => {
    if (busy) return false;
    setBusy(true);
    setError("");
    try {
      setTournament(await send());
      return true;
    } catch (failure) {
      setError(apiErrorMessage(failure));
      return false;
    } finally {
      setBusy(false);
    }
  };
  return { tournament, busy, error, setError, run };
}

// The divisions step's state: the list, the division being edited, and publishing.
export function useDivisions(initial: OrganizerTournament) {
  const { user } = useSession();
  const { tournament, busy, error, setError, run } = useTournamentRequests(initial);
  const [draft, setDraft] = useState<DivisionDraft | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const saveDraft = async () => {
    if (!draft || !user) return;
    const fields = checkDraft(draft);
    if (typeof fields === "string") return setError(fields);
    const saved = await run(() =>
      draft.id
        ? updateDivision(user, tournament.id, draft.id, fields)
        : addDivision(user, tournament.id, fields),
    );
    // A failed save keeps the draft open with everything typed.
    if (saved) setDraft(null);
  };

  return {
    tournament,
    draft,
    busy,
    error,
    removing,
    edit: (division?: Division) => {
      setError("");
      setDraft(division ? draftFrom(division) : withSuggestedName(newDraft()));
    },
    change: (changes: Partial<DivisionDraft>) =>
      setDraft((current) => current && withSuggestedName({ ...current, ...changes })),
    cancel: () => setDraft(null),
    saveDraft,
    askRemove: setRemoving,
    remove: async (divisionId: string) => {
      if (user && (await run(() => removeDivision(user, tournament.id, divisionId))))
        setRemoving(null);
    },
    // Resolves to true once the server has published the tournament.
    publish: async () => {
      if (draft) {
        setError(copy.finishEditing);
        return false;
      }
      return user ? run(() => publishTournament(user, tournament.id)) : false;
    },
    setError,
  };
}

export type DivisionsState = ReturnType<typeof useDivisions>;
