// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { render, screen, userEvent, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import type { User } from "firebase/auth";
import Profile from "@/app/profile";
import { updateMyProfile } from "@/lib/api";
import { useSession } from "@/lib/session";
import { fakeSession } from "../fake-session";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), replace: jest.fn() } }));
jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: null }),
}));
jest.mock("@/lib/session", () => ({ useSession: jest.fn() }));
jest.mock("@/lib/api", () => ({ ...jest.requireActual("@/lib/api"), updateMyProfile: jest.fn() }));

const user = { email: "sam@example.com", displayName: "Old Firebase name" } as User;
const account = {
  id: "1",
  displayName: "Sam Lee",
  bio: "Beach volleyball player",
  profilePhotoUrl: null,
  createdAt: "2026-10-17T12:00:00.000Z",
  badges: [
    {
      key: "champion",
      name: "Champion",
      tier: "Gold",
      description: "Placeholder championship badge",
      imageUrl: null,
      image: "badge-gold-placeholder",
      receivedCount: 25,
      awardedAt: "2026-10-17T12:00:00.000Z",
    },
    {
      key: "winner",
      name: "Winner",
      tier: "Gold",
      description: "Placeholder first-place badge",
      imageUrl: null,
      image: "badge-gold-placeholder",
      receivedCount: 22,
      awardedAt: "2026-10-17T12:00:00.000Z",
    },
    {
      key: "podium",
      name: "Podium",
      tier: "Gold",
      description: "Placeholder podium badge",
      imageUrl: null,
      image: "badge-gold-placeholder",
      receivedCount: 20,
      awardedAt: "2026-10-17T12:00:00.000Z",
    },
    {
      key: "competitor",
      name: "Competitor",
      tier: "Bronze",
      description: "Placeholder participation badge",
      imageUrl: null,
      image: "badge-gold-placeholder",
      receivedCount: 17,
      awardedAt: "2026-10-17T12:00:00.000Z",
    },
  ],
};

beforeEach(() => {
  jest.mocked(useSession).mockReturnValue(fakeSession({ user, account }));
  jest.mocked(updateMyProfile).mockResolvedValue(account);
});

it("shows the name saved in Rally's database, like Home does", async () => {
  await render(<Profile />);

  expect(screen.getByText("Sam Lee")).toBeOnTheScreen();
  expect(screen.queryByText("Old Firebase name")).not.toBeOnTheScreen();
});

it("opens settings from the gear button", async () => {
  await render(<Profile />);
  await userEvent.press(screen.getByRole("button", { name: "Open settings" }));

  expect(router.push).toHaveBeenCalledWith("/settings");
});

it("shows the saved bio below the player's position and team", async () => {
  await render(<Profile />);

  expect(screen.getByText("Outside hitter • Sunbirds")).toBeOnTheScreen();
  expect(screen.getByText("Beach volleyball player")).toBeOnTheScreen();
});

it("edits and saves the display name and bio on the profile", async () => {
  const updatedAccount = { ...account, displayName: "Sammy Lee", bio: "Competitive beach player" };
  const setAccount = jest.fn();
  jest.mocked(useSession).mockReturnValue(fakeSession({ user, account, setAccount }));
  jest.mocked(updateMyProfile).mockResolvedValue(updatedAccount);
  await render(<Profile />);

  await userEvent.press(screen.getByRole("button", { name: "Edit profile" }));
  const nameInput = screen.getByLabelText("Display name");
  const bioInput = screen.getByLabelText("Bio");
  expect(nameInput).toHaveProp("maxLength", 100);
  expect(bioInput).toHaveProp("maxLength", 300);
  await userEvent.clear(nameInput);
  await userEvent.type(nameInput, "Sammy Lee");
  await userEvent.clear(bioInput);
  await userEvent.type(bioInput, "Competitive beach player");
  expect(screen.getByText("24/300")).toBeOnTheScreen();
  await userEvent.press(screen.getByRole("button", { name: "Save profile" }));

  expect(updateMyProfile).toHaveBeenCalledWith(user, "Sammy Lee", "Competitive beach player");
  expect(setAccount).toHaveBeenCalledWith(updatedAccount);
  await waitFor(() => expect(screen.queryByLabelText("Bio")).not.toBeOnTheScreen());
});

it("offers a profile photo picker in the editor", async () => {
  await render(<Profile />);

  await userEvent.press(screen.getByRole("button", { name: "Edit profile" }));

  expect(screen.getByRole("button", { name: "Change profile photo" })).toBeOnTheScreen();
});

it("shows badges saved on the Rally account", async () => {
  await render(<Profile />);

  expect(screen.getByLabelText("Champion badge")).toBeOnTheScreen();
  expect(screen.getByLabelText("Winner badge")).toBeOnTheScreen();
  expect(screen.getByLabelText("Podium badge")).toBeOnTheScreen();
  expect(screen.getByLabelText("Competitor badge")).toBeOnTheScreen();
  expect(screen.getByText("Champion")).toBeOnTheScreen();
  expect(screen.getByText("Winner")).toBeOnTheScreen();
  expect(screen.getByText("Podium")).toBeOnTheScreen();
  expect(screen.getByText("Competitor")).toBeOnTheScreen();
});

it("places badges in a horizontal scroll area", async () => {
  await render(<Profile />);

  expect(screen.getByLabelText("Scrollable awards")).toBeOnTheScreen();
});

it("uses the badge tier color for each image border", async () => {
  await render(<Profile />);

  expect(screen.getByLabelText("Champion badge image").props.style).toEqual(
    expect.arrayContaining([expect.objectContaining({ borderColor: "#d4a72c" })]),
  );
  expect(screen.getByLabelText("Podium badge image").props.style).toEqual(
    expect.arrayContaining([expect.objectContaining({ borderColor: "#d4a72c" })]),
  );
  expect(screen.getByLabelText("Competitor badge image").props.style).toEqual(
    expect.arrayContaining([expect.objectContaining({ borderColor: "#8c5a3c" })]),
  );
});

it("shows stars around gold badges only", async () => {
  await render(<Profile />);

  expect(screen.getAllByText("✦")).toHaveLength(12);
});

it("shows Gold styling for badges with more than twenty receipts", async () => {
  await render(<Profile />);

  expect(screen.getByLabelText("Champion badge image").props.style).toEqual(
    expect.arrayContaining([expect.objectContaining({ borderColor: "#d4a72c" })]),
  );
  expect(screen.getByLabelText("Winner badge image").props.style).toEqual(
    expect.arrayContaining([expect.objectContaining({ borderColor: "#d4a72c" })]),
  );
  expect(screen.getByLabelText("Podium badge image").props.style).toEqual(
    expect.arrayContaining([expect.objectContaining({ borderColor: "#d4a72c" })]),
  );
});

it("shows badge details when a badge is pressed", async () => {
  await render(<Profile />);
  await userEvent.press(screen.getByRole("button", { name: "Champion badge" }));

  expect(screen.getByText("Placeholder championship badge")).toBeOnTheScreen();
  expect(screen.getByText(/gold tier/i)).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Close badge details" })).toBeOnTheScreen();

  await userEvent.press(screen.getByRole("button", { name: "Close badge details" }));
  expect(screen.queryByText("Placeholder championship badge")).not.toBeOnTheScreen();
});

it("goes back Home from the Home tab", async () => {
  await render(<Profile />);
  await userEvent.press(screen.getByRole("button", { name: "Home" }));

  expect(router.replace).toHaveBeenCalledWith("/home");
});

it("ignores the tabs that aren't built yet", async () => {
  await render(<Profile />);
  await userEvent.press(screen.getByRole("button", { name: "Events" }));

  expect(router.replace).not.toHaveBeenCalled();
  expect(router.push).not.toHaveBeenCalled();
});
