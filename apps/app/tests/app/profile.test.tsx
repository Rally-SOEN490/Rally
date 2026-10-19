// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { render, screen, userEvent } from "@testing-library/react-native";
import { router } from "expo-router";
import type { User } from "firebase/auth";
import Profile from "@/app/profile";
import { useSession } from "@/lib/session";
import { fakeSession } from "../fake-session";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), replace: jest.fn() } }));
jest.mock("@/lib/profile-tournaments", () => ({ getUpcomingTournaments: jest.fn().mockResolvedValue({ tournaments: [] }) }));
jest.mock("@/lib/profile-message", () => ({ getProfileMessage: jest.fn().mockResolvedValue({ message: "" }), saveProfileMessage: jest.fn() }));
jest.mock("@/lib/session", () => ({ useSession: jest.fn() }));

const user = { email: "sam@example.com", displayName: "Old Firebase name" } as User;
const account = {
  id: "1",
  displayName: "Sam Lee",
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
