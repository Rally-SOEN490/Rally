// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { useState } from "react";
import { apiErrorMessage } from "@/lib/api";
import {
  createTournament,
  joinDateTime,
  splitDateTime,
  updateTournament,
  type OrganizerTournament,
  type SetupFields,
} from "@/lib/organizer-tournaments";
import { useSession } from "@/lib/session";
import { tournamentCopy } from "@/translations/tournaments.en";

const copy = tournamentCopy.setup;

export const MOMENTS = [
  "startsAt",
  "endsAt",
  "registrationOpensAt",
  "registrationClosesAt",
] as const;
export type Moment = (typeof MOMENTS)[number];
type DateTime = { date: string | null; time: string | null };

export type SetupForm = {
  name: string;
  location: string;
  courts: number | null;
  description: string;
} & Record<Moment, DateTime>;

const momentLabels: Record<Moment, string> = {
  startsAt: copy.starts,
  endsAt: copy.ends,
  registrationOpensAt: `${copy.registration.toLowerCase()} ${copy.opens.toLowerCase()}`,
  registrationClosesAt: `${copy.registration.toLowerCase()} ${copy.closes.toLowerCase()}`,
};

export const formFrom = (tournament?: OrganizerTournament): SetupForm => {
  const moment = (key: Moment) => splitDateTime(tournament ? tournament[key] : null);
  return {
    name: tournament?.name ?? "",
    location: tournament?.location ?? "",
    courts: tournament?.courts ?? null,
    description: tournament?.description ?? "",
    startsAt: moment("startsAt"),
    endsAt: moment("endsAt"),
    registrationOpensAt: moment("registrationOpensAt"),
    registrationClosesAt: moment("registrationClosesAt"),
  };
};

// True when either time is missing: a draft is only checked on what it has.
const isBefore = (first: string | null, second: string | null) =>
  !first || !second || first < second;
const isNotAfter = (first: string | null, second: string | null) =>
  !first || !second || first <= second;

// The first date problem, if any. Registration may open and close up to the
// moment the tournament starts.
const dateProblem = (
  startsAt: string | null,
  endsAt: string | null,
  opensAt: string | null,
  closesAt: string | null,
) => {
  if (!isBefore(startsAt, endsAt)) return copy.endBeforeStart;
  if (!isBefore(opensAt, closesAt)) return copy.registrationOrder;
  if (!isNotAfter(opensAt, startsAt)) return copy.registrationOpensAfterStart;
  if (!isNotAfter(closesAt, startsAt)) return copy.registrationClosesAfterStart;
  return null;
};

// The same checks as the server, so mistakes show before anything is sent.
// Times are "YYYY-MM-DDTHH:mm", so comparing the text compares the times.
export const checkSetup = (form: SetupForm): string | SetupFields => {
  if (!form.name.trim()) return copy.nameRequired;
  const half = MOMENTS.find((moment) => !form[moment].date !== !form[moment].time);
  if (half) return copy.halfDateTime(momentLabels[half]);
  const at = (moment: Moment) => joinDateTime(form[moment].date, form[moment].time);
  const [startsAt, endsAt, opensAt, closesAt] = MOMENTS.map(at);
  const problem = dateProblem(startsAt, endsAt, opensAt, closesAt);
  if (problem) return problem;
  return {
    name: form.name.trim(),
    location: form.location.trim() || null,
    courts: form.courts,
    description: form.description.trim() ? form.description : null,
    startsAt,
    endsAt,
    registrationOpensAt: opensAt,
    registrationClosesAt: closesAt,
  };
};

// The setup step's state, and saving it as a new draft or over an existing one.
export function useSetupForm(tournament?: OrganizerTournament) {
  const { user } = useSession();
  const [form, setForm] = useState(() => formFrom(tournament));
  // The form as last saved, to tell whether leaving would lose changes.
  const [savedForm, setSavedForm] = useState(form);
  const [id, setId] = useState(tournament?.id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Resolves to the tournament's ID once the server has saved it, or null.
  const save = async (): Promise<string | null> => {
    if (!user || saving) return null;
    const fields = checkSetup(form);
    if (typeof fields === "string") {
      setError(fields);
      return null;
    }
    setSaving(true);
    setError("");
    try {
      const saved = id
        ? await updateTournament(user, id, fields)
        : await createTournament(user, fields);
      setId(saved.id);
      setSavedForm(form);
      return saved.id;
    } catch (failure) {
      // The form keeps everything typed, so the organizer can try again.
      setError(apiErrorMessage(failure));
      return null;
    } finally {
      setSaving(false);
    }
  };

  const change = <K extends keyof SetupForm>(field: K, value: SetupForm[K]) =>
    setForm((current) => ({ ...current, [field]: value }));

  const hasUnsavedChanges = JSON.stringify(form) !== JSON.stringify(savedForm);

  return { form, change, saving, error, save, hasUnsavedChanges };
}

export type SetupFormState = ReturnType<typeof useSetupForm>;
