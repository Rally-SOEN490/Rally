// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import {
  act,
  fireEvent,
  render,
  screen,
  userEvent,
  waitFor,
} from "@testing-library/react-native";
import type { User } from "firebase/auth";
import Privacy from "@/app/profile-privacy";
import {
  getProfilePrivacy,
  saveProfilePrivacy,
  type ProfilePrivacy,
} from "@/lib/profiles";
import { useSession } from "@/lib/session";
import { ApiError } from "@/lib/api";
import { fakeSession } from "../fake-session";

jest.mock("expo-router", () => ({ router: { replace: jest.fn() } }));
jest.mock("@/lib/session", () => ({ useSession: jest.fn() }));
jest.mock("@/lib/profiles", () => ({
  getProfilePrivacy: jest.fn(),
  saveProfilePrivacy: jest.fn(),
}));
const user = { uid: "alice" } as User;
const defaults: ProfilePrivacy = {
  profileVisible: false,
  showPhoto: false,
  showBio: false,
  showStatus: false,
  showInterests: false,
  showSocialLinks: false,
  showBadges: false,
  showMemberSince: false,
};
beforeEach(() => {
  jest.mocked(useSession).mockReturnValue(fakeSession({ user }));
  jest.mocked(getProfilePrivacy).mockResolvedValue(defaults);
  jest
    .mocked(saveProfilePrivacy)
    .mockImplementation(async (_user, settings) => settings);
});
const toggle = (label: string, value: boolean) =>
  fireEvent(screen.getByRole("switch", { name: label }), "valueChange", value);

it("loads saved choices and keeps Save disabled until something changes", async () => {
  await render(<Privacy />);
  expect(await screen.findByText(/saving with viewing off/)).toBeOnTheScreen();
  expect(screen.getByRole("switch", { name: "Awards" }).props.value).toBe(
    false,
  );
  expect(
    screen.getByRole("button", { name: "Save preferences" }),
  ).toBeDisabled();
});
it("only reports success after the server has saved the preferences", async () => {
  let finish!: (value: ProfilePrivacy) => void;
  jest.mocked(saveProfilePrivacy).mockReturnValue(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  await render(<Privacy />);
  await screen.findByText(/saving with viewing off/);
  await toggle("Let players view my profile", true);
  await toggle("Awards", true);
  await userEvent.press(
    screen.getByRole("button", { name: "Save preferences" }),
  );
  expect(
    screen.queryByText(/preferences have been saved/),
  ).not.toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Saving…" })).toBeDisabled();
  await act(async () =>
    finish({ ...defaults, profileVisible: true, showBadges: true }),
  );
  expect(
    await screen.findByText(/preferences have been saved/),
  ).toBeOnTheScreen();
  expect(saveProfilePrivacy).toHaveBeenCalledWith(user, {
    ...defaults,
    profileVisible: true,
    showBadges: true,
  });
});
it("preserves the draft after a save failure and lets the owner retry", async () => {
  jest
    .mocked(saveProfilePrivacy)
    .mockRejectedValueOnce(new ApiError(0, "Offline. Please retry."));
  await render(<Privacy />);
  await screen.findByText(/saving with viewing off/);
  await toggle("Awards", true);
  await userEvent.press(
    screen.getByRole("button", { name: "Save preferences" }),
  );
  expect(await screen.findByText("Offline. Please retry.")).toBeOnTheScreen();
  expect(screen.getByRole("switch", { name: "Awards" }).props.value).toBe(true);
  await userEvent.press(
    screen.getByRole("button", { name: "Save preferences" }),
  );
  expect(
    await screen.findByText(/preferences have been saved/),
  ).toBeOnTheScreen();
});
it("explains a loading failure and retries", async () => {
  jest.mocked(getProfilePrivacy).mockRejectedValueOnce(new Error("offline"));
  await render(<Privacy />);
  await userEvent.press(
    await screen.findByRole("button", { name: "Try again" }),
  );
  expect(await screen.findByText(/saving with viewing off/)).toBeOnTheScreen();
});
it("discards the previous owner's choices when the session changes", async () => {
  jest
    .mocked(getProfilePrivacy)
    .mockResolvedValueOnce({ ...defaults, showBadges: true });
  const { rerender } = await render(<Privacy />);
  await waitFor(() =>
    expect(screen.getByRole("switch", { name: "Awards" }).props.value).toBe(
      true,
    ),
  );
  jest
    .mocked(useSession)
    .mockReturnValue(fakeSession({ user: { uid: "bob" } as User }));
  await rerender(<Privacy />);
  await waitFor(() =>
    expect(screen.getByRole("switch", { name: "Awards" }).props.value).toBe(
      false,
    ),
  );
});
