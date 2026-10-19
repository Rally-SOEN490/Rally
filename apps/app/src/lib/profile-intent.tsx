// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { usePathname } from "expo-router";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

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
