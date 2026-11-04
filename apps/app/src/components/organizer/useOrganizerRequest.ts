// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { User } from "firebase/auth";
import { useEffect, useState } from "react";
import { apiErrorMessage } from "@/lib/api";
import {
  applyToBeOrganizer,
  getMyOrganizerApplication,
  normalizeLink,
  type OrganizerApplication,
} from "@/lib/organizer-applications";
import { useSession } from "@/lib/session";
import { organizerCopy } from "@/translations/organizer.en";
import type { ApplicationDraft } from "./applicationForm";

type Loaded =
  | { kind: "loading" }
  | { kind: "failed"; message: string }
  | { kind: "ready"; application: OrganizerApplication | null };

const emptyDraft: ApplicationDraft = { description: "", link: "" };

// Loads the person's latest request, and loads it again on retry.
function useLatestApplication(user: User | null) {
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!user) return;
    let isCurrent = true;
    getMyOrganizerApplication(user).then(
      (application) => isCurrent && setLoaded({ kind: "ready", application }),
      (failure) => isCurrent && setLoaded({ kind: "failed", message: apiErrorMessage(failure) }),
    );
    return () => {
      isCurrent = false;
    };
  }, [user, attempt]);

  const retry = () => {
    setLoaded({ kind: "loading" });
    setAttempt((count) => count + 1);
  };
  return { loaded, setLoaded, retry };
}

// The state behind the request sheet: the latest request, the form, and sending it.
export function useOrganizerRequest() {
  const { user } = useSession();
  const { loaded, setLoaded, retry } = useLatestApplication(user);
  const [draft, setDraft] = useState(emptyDraft);
  const [editing, setEditing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!user || sending) return;
    const link = normalizeLink(draft.link);
    if (link === undefined) return setError(organizerCopy.sheet.invalidLink);
    setSending(true);
    setError("");
    try {
      const description = draft.description.trim();
      const application = await applyToBeOrganizer(user, { description, link });
      // Only now, with the server's answer, does the sheet say the request was sent.
      setLoaded({ kind: "ready", application });
      setEditing(false);
      setDraft(emptyDraft);
    } catch (failure) {
      // The text stays in the form so the person can try again.
      setError(apiErrorMessage(failure));
    } finally {
      setSending(false);
    }
  };

  // Starts a new request from the previous one, so a denied player only changes what's needed.
  const startOver = (previous: OrganizerApplication) => {
    setDraft({ description: previous.description, link: previous.link ?? "" });
    setError("");
    setEditing(true);
  };

  return { loaded, retry, draft, setDraft, editing, startOver, sending, error, submit };
}
