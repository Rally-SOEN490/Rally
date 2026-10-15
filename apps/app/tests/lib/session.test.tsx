// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { act, renderHook } from "@testing-library/react-native";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { SessionProvider, useSession } from "@/lib/session";

jest.mock("firebase/auth", () => ({ onAuthStateChanged: jest.fn() }));
jest.mock("@/lib/firebase", () => ({ auth: { currentUser: null } }));

const unsubscribe = jest.fn();
let reportUser: (user: User | null) => void;

beforeEach(() => {
  Object.assign(auth, { currentUser: null });
  jest.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
    reportUser = callback as typeof reportUser;
    return unsubscribe;
  });
});

const renderSession = () =>
  renderHook(() => useSession(), { wrapper: SessionProvider });

it("is loading until Firebase reports who is signed in", async () => {
  const { result } = await renderSession();
  expect(result.current).toMatchObject({ user: null, isLoading: true });

  const user = { email: "sam@example.com" } as User;
  await act(async () => reportUser(user));
  expect(result.current).toMatchObject({ user, isLoading: false });
});

it("reports a signed-out user", async () => {
  const { result } = await renderSession();
  await act(async () => reportUser(null));
  expect(result.current).toMatchObject({ user: null, isLoading: false });
});

it("refresh() reloads the user from Firebase", async () => {
  const user = { emailVerified: false, reload: jest.fn() } as unknown as User;
  jest.mocked(user.reload).mockImplementation(async () => {
    Object.assign(user, { emailVerified: true });
  });
  Object.assign(auth, { currentUser: user });

  const { result } = await renderSession();
  await act(() => result.current.refresh());

  expect(user.reload).toHaveBeenCalled();
  expect(result.current.user?.emailVerified).toBe(true);
  expect(result.current.isLoading).toBe(false);
});

it("refresh() does nothing harmful when nobody is signed in", async () => {
  const { result } = await renderSession();
  await act(() => result.current.refresh());
  expect(result.current).toMatchObject({ user: null, isLoading: false });
});

it("stops listening to Firebase when unmounted", async () => {
  const { unmount } = await renderSession();
  await unmount();
  expect(unsubscribe).toHaveBeenCalled();
});

it("throws a clear error when used outside <SessionProvider>", async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  await expect(renderHook(() => useSession())).rejects.toThrow(
    "useSession must be used inside <SessionProvider>",
  );
});
