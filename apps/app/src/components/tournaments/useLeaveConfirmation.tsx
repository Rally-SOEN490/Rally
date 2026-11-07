// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { useNavigation } from "expo-router";
import { usePreventRemove, type NavigationAction } from "expo-router/react-navigation";
import { useEffect, useRef, useState } from "react";
import { tournamentCopy } from "@/translations/tournaments.en";
import { ConfirmDialog } from "./confirmDialog";

const copy = tournamentCopy.steps;

// Asks before a screen with unsaved changes is closed, however it is closed:
// the on-screen back arrow, Android's back button, or the iOS swipe back
// (the native stack blocks the swipe while removal is prevented). On the web,
// the browser's own back button and closing the tab can't be stopped this way.
// Render `dialog` somewhere on the screen.
export function useLeaveConfirmation(hasUnsavedChanges: boolean, message: string) {
  const navigation = useNavigation();
  const [pending, setPending] = useState<NavigationAction | null>(null);
  // Set just before leaving on purpose after a save. The "saved" state may not
  // have re-rendered yet, so without it the question would show by mistake.
  const leavingOnPurpose = useRef(false);
  // The navigation that the flag was set for happens straight away, before the
  // next render; clearing it after every render stops it covering a later one.
  useEffect(() => {
    leavingOnPurpose.current = false;
  });

  usePreventRemove(hasUnsavedChanges, ({ data }) => {
    if (leavingOnPurpose.current) {
      leavingOnPurpose.current = false;
      navigation.dispatch(data.action);
    } else setPending(data.action);
  });

  const dialog = (
    <ConfirmDialog
      visible={pending !== null}
      title={copy.leaveTitle}
      message={message}
      cancelLabel={copy.keepEditing}
      confirmLabel={copy.leave}
      onCancel={() => setPending(null)}
      onConfirm={() => {
        const action = pending;
        setPending(null);
        if (action) navigation.dispatch(action);
      }}
      danger
    />
  );

  // Leaves without asking, e.g. right after "Save draft" succeeded.
  const leaveWithoutAsking = (go: () => void) => {
    leavingOnPurpose.current = true;
    go();
  };

  return { dialog, leaveWithoutAsking };
}
