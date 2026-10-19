// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import {
  act,
  render,
  screen,
  userEvent,
  waitFor,
} from "@testing-library/react-native";
import { router, useLocalSearchParams } from "expo-router";
import type { User } from "firebase/auth";
import { Linking } from "react-native";
import Player from "@/app/players/[id]";
import { ApiError } from "@/lib/api";
import { getPlayerProfile, type PlayerProfile } from "@/lib/profiles";
import { useSession } from "@/lib/session";
import { fakeSession } from "../fake-session";

jest.mock("expo-router", () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));
jest.mock("@/lib/session", () => ({ useSession: jest.fn() }));
jest.mock("@/lib/profiles", () => ({ getPlayerProfile: jest.fn() }));
const id = "00000000-0000-0000-0000-000000000001";
const user = { uid: "viewer" } as User;
const shared: PlayerProfile = {
  id,
  displayName: "Casey Lee",
  bio: "Weekend volleyball",
  statusMessage: "Sunday beach?",
  interests: ["Beach 2s"],
  memberSince: "2026-10-01T12:00:00Z",
};
beforeEach(() => {
  jest.mocked(useLocalSearchParams).mockReturnValue({ id });
  jest.mocked(useSession).mockReturnValue(fakeSession({ user }));
  jest.mocked(getPlayerProfile).mockResolvedValue(shared);
});
it("shows only the shared profile sections, with no made-up results or owner controls", async () => {
  await render(<Player />);
  expect(await screen.findByText("Casey Lee")).toBeOnTheScreen();
  expect(screen.getByText("Weekend volleyball")).toBeOnTheScreen();
  expect(screen.getByText("Sunday beach?")).toBeOnTheScreen();
  expect(screen.getByText("Beach 2s")).toBeOnTheScreen();
  expect(screen.queryByText("Sunbirds")).not.toBeOnTheScreen();
  expect(screen.queryByText("132")).not.toBeOnTheScreen();
  expect(screen.queryByText("Awards")).not.toBeOnTheScreen();
  expect(screen.queryByText("Manage profile privacy")).not.toBeOnTheScreen();
});
it("shows a neutral unavailable state for a private or missing profile", async () => {
  jest
    .mocked(getPlayerProfile)
    .mockRejectedValue(new ApiError(404, "This profile is unavailable."));
  await render(<Player />);
  expect(await screen.findByText("Profile unavailable")).toBeOnTheScreen();
  expect(screen.queryByText("Casey Lee")).not.toBeOnTheScreen();
  expect(screen.queryByText("Try again")).not.toBeOnTheScreen();
});
it("explains a temporary failure and retries", async () => {
  jest
    .mocked(getPlayerProfile)
    .mockRejectedValueOnce(new ApiError(0, "Can't reach the server."));
  await render(<Player />);
  expect(await screen.findByText("Can't reach the server.")).toBeOnTheScreen();
  await userEvent.press(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("Casey Lee")).toBeOnTheScreen();
});
it("does not display the previous player's data after the route changes", async () => {
  let finish!: (profile: PlayerProfile) => void;
  jest.mocked(getPlayerProfile).mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  const { rerender } = await render(<Player />);
  jest
    .mocked(useLocalSearchParams)
    .mockReturnValue({ id: "00000000-0000-0000-0000-000000000002" });
  jest
    .mocked(getPlayerProfile)
    .mockResolvedValue({ id: "other", displayName: "Alex" });
  await rerender(<Player />);
  expect(await screen.findByText("Alex")).toBeOnTheScreen();
  await act(async () => finish(shared));
  expect(screen.queryByText("Casey Lee")).not.toBeOnTheScreen();
});
it("shows a truthful empty state when only the player's name is shared", async () => {
  jest
    .mocked(getPlayerProfile)
    .mockResolvedValue({ id, displayName: "Casey Lee" });
  await render(<Player />);
  expect(
    await screen.findByText(/hasn’t shared additional details/),
  ).toBeOnTheScreen();
});
it("lets the owner manage privacy from their preview", async () => {
  jest
    .mocked(useSession)
    .mockReturnValue(
      fakeSession({
        user,
        account: {
          id,
          displayName: "Casey Lee",
          createdAt: "2026-10-01",
          badges: [],
        },
      }),
    );
  await render(<Player />);
  await userEvent.press(
    await screen.findByRole("button", { name: "Manage profile privacy" }),
  );
  expect(router.push).toHaveBeenCalledWith("/profile-privacy");
});
it("opens a shared social link and explains failures", async () => {
  const open = jest
    .spyOn(Linking, "openURL")
    .mockRejectedValueOnce(new Error("No handler"));
  jest
    .mocked(getPlayerProfile)
    .mockResolvedValue({
      ...shared,
      socialLinks: { facebook: "https://facebook.com/casey", instagram: null },
    });
  await render(<Player />);
  await userEvent.press(
    await screen.findByRole("button", { name: "Facebook" }),
  );
  expect(await screen.findByText(/couldn’t open this link/)).toBeOnTheScreen();
  expect(open).toHaveBeenCalledWith("https://facebook.com/casey");
  open.mockRestore();
});
it("shows the shared photo and an empty award section when permitted", async () => {
  jest
    .mocked(getPlayerProfile)
    .mockResolvedValue({
      ...shared,
      photoUrl: "https://images.example/casey.png",
      badges: [],
    });
  await render(<Player />);
  expect(await screen.findByLabelText("Casey Lee")).toBeOnTheScreen();
  expect(screen.getByText("No awards to show yet.")).toBeOnTheScreen();
});
it("returns to the owner's profile", async () => {
  await render(<Player />);
  await waitFor(() => expect(screen.getByText("Casey Lee")).toBeOnTheScreen());
  await userEvent.press(
    screen.getByRole("button", { name: "Back to my profile" }),
  );
  expect(router.replace).toHaveBeenCalledWith("/profile");
});
