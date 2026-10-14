// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { onAuthStateChanged, type User } from "firebase/auth";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { auth } from "@/lib/firebase";

type Session = {
  user: User | null;
  // True until Firebase tells us whether someone is already signed in.
  isLoading: boolean;
  // Re-fetches the user from Firebase, e.g. after they click the verification link.
  refresh: () => Promise<void>;
};

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ user: User | null; isLoading: boolean }>(
    { user: auth.currentUser, isLoading: true },
  );

  useEffect(
    () =>
      onAuthStateChanged(auth, (user) => setState({ user, isLoading: false })),
    [],
  );

  const refresh = async () => {
    await auth.currentUser?.reload();
    // reload() updates the same User object, so pass a new state object to re-render.
    setState({ user: auth.currentUser, isLoading: false });
  };

  return (
    <SessionContext.Provider value={{ ...state, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession must be used inside <SessionProvider>");
  return session;
}
