// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { onAuthStateChanged, type User } from "firebase/auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { apiErrorMessage, getMyAccount, updateMyAccount, type RallyUser } from "@/lib/api";
import { auth } from "@/lib/firebase";

export type Session = {
  user: User | null;
  // True until Firebase tells us whether someone is already signed in.
  isLoading: boolean;
  // Re-fetches the user from Firebase, e.g. after they click the verification link.
  refresh: () => Promise<void>;
  // The person's Rally account, loaded once their email is verified. undefined
  // while loading, null if Rally's database has no account for them.
  account: RallyUser | null | undefined;
  // Why the account couldn't be loaded, e.g. the API can't be reached.
  accountError: string | undefined;
  // Tries loading the account again after an error.
  reloadAccount: () => void;
  // Stores the account once the app has created it.
  setAccount: (account: RallyUser) => void;
  selectedBadgeKeys: string[];
  toggleBadgeSelection: (key: string) => Promise<void>;
};

// An account (or error) together with the user and attempt it was loaded for,
// so we never show one person's account to the next person who logs in.
type LoadedAccount = { key: string; account?: RallyUser | null; error?: string };

const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ user: User | null; isLoading: boolean }>({
    user: auth.currentUser,
    isLoading: true,
  });
  const [loaded, setLoaded] = useState<LoadedAccount>();
  const [attempt, setAttempt] = useState(0);
  const [selectedBadgeKeys, setSelectedBadgeKeys] = useState<string[]>([]);

  useEffect(() => onAuthStateChanged(auth, (user) => setState({ user, isLoading: false })), []);

  const { user } = state;
  // Only look for the Rally account once the email is verified. Sign-up is still
  // saving it before that, and asking too early would wrongly find nothing.
  const key = user?.emailVerified ? `${user.uid}/${attempt}` : undefined;

  useEffect(() => {
    if (!user || !key) return;
    let isCurrent = true;
    getMyAccount(user)
      .then((account) => {
        if (isCurrent) setLoaded({ key, account });
      })
      .catch((error) => {
        if (isCurrent) setLoaded({ key, error: apiErrorMessage(error) });
      });
    // Ignore the answer if the user logged out or changed while we waited.
    return () => {
      isCurrent = false;
    };
  }, [user, key]);

  const current = loaded?.key === key ? loaded : undefined;

  useEffect(() => {
    const account = current?.account;
    if (!account) return;
    // Reconcile editable badge choices after the asynchronous account refresh;
    // deriving them on every render would overwrite the user's optimistic selection.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedBadgeKeys((keys) => {
      const availableKeys = new Set(account.badges.map((badge) => badge.key));
      if (account.shownBadgeKeys && account.shownBadgeKeys.length > 0) {
        return account.shownBadgeKeys.filter((badgeKey) => availableKeys.has(badgeKey)).slice(0, 4);
      }
      const validKeys = keys.filter((badgeKey) => availableKeys.has(badgeKey));
      if (validKeys.length > 0) return validKeys.slice(0, 4);
      return account.badges
        .slice()
        .sort(
          (left, right) =>
            right.receivedCount - left.receivedCount || left.key.localeCompare(right.key),
        )
        .slice(0, 4)
        .map((badge) => badge.key);
    });
  }, [current?.account]);

  const refresh = async () => {
    await auth.currentUser?.reload();
    // reload() updates the same User object, so pass a new state object to re-render.
    setState({ user: auth.currentUser, isLoading: false });
  };

  const setAccount = (account: RallyUser) => {
    if (key) setLoaded({ key, account });
  };

  const toggleBadgeSelection = async (badgeKey: string) => {
    if (!user || !current?.account) return;
    const nextKeys = selectedBadgeKeys.includes(badgeKey)
      ? selectedBadgeKeys.filter((key) => key !== badgeKey)
      : selectedBadgeKeys.length >= 4
        ? selectedBadgeKeys
        : [...selectedBadgeKeys, badgeKey];
    if (nextKeys === selectedBadgeKeys) return;

    setSelectedBadgeKeys(nextKeys);
    try {
      setAccount(await updateMyAccount(user, { shownBadgeKeys: nextKeys }));
    } catch (error) {
      setSelectedBadgeKeys(() => selectedBadgeKeys);
      throw error;
    }
  };

  return (
    <SessionContext.Provider
      value={{
        ...state,
        refresh,
        account: current?.account,
        accountError: current?.error,
        reloadAccount: () => setAttempt((count) => count + 1),
        setAccount,
        selectedBadgeKeys,
        toggleBadgeSelection,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("useSession must be used inside <SessionProvider>");
  return session;
}
