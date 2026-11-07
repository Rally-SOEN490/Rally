// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { useEffect, useState } from "react";
import { ApiError, apiErrorMessage } from "@/lib/api";
import {
  decideApplication,
  getApplicationForReview,
  type ApplicationForReview,
} from "@/lib/organizer-applications";

type Loaded =
  | { kind: "loading" }
  | { kind: "failed"; message: string }
  | { kind: "ready"; application: ApplicationForReview };

export type ReviewMode = "idle" | "confirmApprove" | "deny";

// The state behind the review page: the application, and approving or denying it.
export function useApplicationReview(token: string) {
  const [loaded, setLoaded] = useState<Loaded>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [mode, setMode] = useState<ReviewMode>("idle");
  const [reason, setReason] = useState("");
  const [deciding, setDeciding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;
    getApplicationForReview(token).then(
      (application) => isCurrent && setLoaded({ kind: "ready", application }),
      (failure) => isCurrent && setLoaded({ kind: "failed", message: apiErrorMessage(failure) }),
    );
    return () => {
      isCurrent = false;
    };
  }, [token, attempt]);

  const reload = () => {
    setLoaded({ kind: "loading" });
    setAttempt((count) => count + 1);
  };

  const decide = async (decision: "approve" | "deny") => {
    if (deciding) return;
    setDeciding(true);
    setError("");
    try {
      const application = await decideApplication(token, decision, reason.trim() || null);
      // Only the server's answer says the decision was saved.
      setLoaded({ kind: "ready", application });
      setMode("idle");
    } catch (failure) {
      setError(apiErrorMessage(failure));
      // Someone else decided first, or the link expired: show where it stands now.
      if (failure instanceof ApiError && (failure.status === 409 || failure.status === 410)) {
        setMode("idle");
        reload();
      }
    } finally {
      setDeciding(false);
    }
  };

  return { loaded, reload, mode, setMode, reason, setReason, deciding, error, decide };
}

export type ApplicationReview = ReturnType<typeof useApplicationReview>;
