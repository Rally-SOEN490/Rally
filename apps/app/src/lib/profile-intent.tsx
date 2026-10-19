// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { usePathname } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Linking } from "react-native";

type ProfileIntent = {
  requestedPlayerId?: string;
  clearProfileIntent: () => void;
};
const Context = createContext<ProfileIntent>({ clearProfileIntent: () => {} });

// Retain only an internal player ID, never an arbitrary redirect URL.
// This provider outlives auth guards and the account-setup flow.
export function ProfileIntentProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [requestedPlayerId, setRequestedPlayerId] = useState<
    string | undefined
  >(
    () =>
      /^\/players\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/.exec(
        pathname,
      )?.[1],
  );
  useEffect(() => {
    const subscription = Linking.addEventListener("url", ({ url }) => {
      try {
        const link = new URL(url);
        if (link.protocol !== "rally:") return;
        const id = /^\/players\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/.exec(
          link.hostname ? `/${link.hostname}${link.pathname}` : link.pathname,
        )?.[1];
        if (id) setRequestedPlayerId(id);
      } catch {
        // Malformed external links must not interrupt sign-in.
      }
    });
    return () => subscription.remove();
  }, []);
  const clearProfileIntent = useCallback(
    () => setRequestedPlayerId(undefined),
    [],
  );
  const value = useMemo(
    () => ({ requestedPlayerId, clearProfileIntent }),
    [requestedPlayerId, clearProfileIntent],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export const useProfileIntent = () => useContext(Context);
