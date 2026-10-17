// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { act, renderHook } from "@testing-library/react-native";
import { onAuthStateChanged, type User } from "firebase/auth";
import { ApiError, getMyAccount, type RallyUser } from "@/lib/api";
import { auth } from "@/lib/firebase";
import { SessionProvider, useSession } from "@/lib/session";

jest.mock("firebase/auth", () => ({ onAuthStateChanged: jest.fn() }));
jest.mock("@/lib/firebase", () => ({ auth: { currentUser: null } }));
jest.mock("@/lib/api", () => ({ ...jest.requireActual("@/lib/api"), getMyAccount: jest.fn() }));

const account = { id: "1", displayName: "Sam Lee", createdAt: "2026-10-17T12:00:00.000Z" };
const verified = { uid: "sam", email: "sam@example.com", emailVerified: true } as User;

const unsubscribe = jest.fn();
let reportUser: (user: User | null) => void;

beforeEach(() => {
  Object.assign(auth, { currentUser: null });
  jest.mocked(onAuthStateChanged).mockImplementation((_auth, callback) => {
    reportUser = callback as typeof reportUser;
    return unsubscribe;
  });
  jest.mocked(getMyAccount).mockResolvedValue(account);
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

describe("the Rally account", () => {
  it("isn't looked up before the email is verified", async () => {
    const { result } = await renderSession();
    await act(async () => reportUser({ uid: "sam", emailVerified: false } as User));

    expect(getMyAccount).not.toHaveBeenCalled();
    expect(result.current.account).toBeUndefined();
  });

  it("is loaded once the email is verified", async () => {
    const { result } = await renderSession();
    await act(async () => reportUser(verified));

    expect(getMyAccount).toHaveBeenCalledWith(verified);
    expect(result.current.account).toEqual(account);
    expect(result.current.accountError).toBeUndefined();
  });

  it("is loaded right after refresh() sees the email is now verified", async () => {
    const user = { uid: "sam", emailVerified: false, reload: jest.fn() } as unknown as User;
    jest.mocked(user.reload).mockImplementation(async () => {
      Object.assign(user, { emailVerified: true });
    });
    Object.assign(auth, { currentUser: user });

    const { result } = await renderSession();
    await act(async () => reportUser(user));
    expect(result.current.account).toBeUndefined();

    await act(() => result.current.refresh());
    expect(result.current.account).toEqual(account);
  });

  it("is null when Rally's database has no account for this login", async () => {
    jest.mocked(getMyAccount).mockResolvedValue(null);
    const { result } = await renderSession();
    await act(async () => reportUser(verified));

    expect(result.current.account).toBeNull();
  });

  it("reports why it couldn't be loaded, and can try again", async () => {
    jest.mocked(getMyAccount).mockRejectedValueOnce(new ApiError(0, "Can't reach the Rally server."));
    const { result } = await renderSession();
    await act(async () => reportUser(verified));

    expect(result.current.account).toBeUndefined();
    expect(result.current.accountError).toBe("Can't reach the Rally server.");

    await act(async () => result.current.reloadAccount());
    expect(getMyAccount).toHaveBeenCalledTimes(2);
    expect(result.current.account).toEqual(account);
    expect(result.current.accountError).toBeUndefined();
  });

  it("never shows a previous user's account", async () => {
    let answerFirstRequest: (account: RallyUser) => void = () => {};
    jest.mocked(getMyAccount).mockReturnValueOnce(
      new Promise((resolve) => {
        answerFirstRequest = resolve;
      }),
    );
    const { result } = await renderSession();
    await act(async () => reportUser(verified));
    await act(async () => reportUser(null));

    // The answer for the first user arrives after they logged out.
    await act(async () => answerFirstRequest(account));
    expect(result.current.account).toBeUndefined();
  });

  it("ignores an error that arrives after the user logged out", async () => {
    let failFirstRequest: (error: Error) => void = () => {};
    jest.mocked(getMyAccount).mockReturnValueOnce(
      new Promise((_resolve, reject) => {
        failFirstRequest = reject;
      }),
    );
    const { result } = await renderSession();
    await act(async () => reportUser(verified));
    await act(async () => reportUser(null));

    await act(async () => failFirstRequest(new ApiError(0, "Can't reach the Rally server.")));
    expect(result.current.accountError).toBeUndefined();
  });

  it("can be set once the app creates it", async () => {
    jest.mocked(getMyAccount).mockResolvedValue(null);
    const { result } = await renderSession();
    await act(async () => reportUser(verified));

    await act(async () => result.current.setAccount(account));
    expect(result.current.account).toEqual(account);
  });

  it("can't be set for someone who isn't verified", async () => {
    const { result } = await renderSession();
    await act(async () => reportUser(null));

    await act(async () => result.current.setAccount(account));
    expect(result.current.account).toBeUndefined();
  });
});
