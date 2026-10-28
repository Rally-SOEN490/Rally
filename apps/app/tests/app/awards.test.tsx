/*
AI declaration:
50% or more AI-generated
*/

// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { render, screen, userEvent } from "@testing-library/react-native";
import { router } from "expo-router";
import Awards from "@/app/awards";
import { useSession } from "@/lib/session";
import { fakeSession } from "../fake-session";

jest.mock("expo-router", () => ({ router: { back: jest.fn() } }));
jest.mock("@/lib/session", () => ({ useSession: jest.fn() }));

const badges = Array.from({ length: 5 }, (_, index) => ({
  key: `badge-${index}`,
  name: `Badge ${index}`,
  tier: "Gold",
  description: "Test badge",
  imageUrl: null,
  image: "badge-gold-placeholder",
  receivedCount: 25 - index,
  awardedAt: "2026-10-17T12:00:00.000Z",
}));

const toggleBadgeSelection = jest.fn();

beforeEach(() => {
  toggleBadgeSelection.mockReset();
  jest.mocked(useSession).mockReturnValue(
    fakeSession({
      account: {
        id: "1",
        displayName: "Sam Lee",
        profilePhotoUrl: null,
        lookingForTeam: false,
        createdAt: "2026-10-17T12:00:00.000Z",
        badges,
      },
      selectedBadgeKeys: ["badge-0", "badge-1", "badge-2", "badge-3"],
      toggleBadgeSelection,
    }),
  );
});

it("shows selected badges with checkmarks and locked awards", async () => {
  await render(<Awards />);

  expect(screen.getByText(/4 of 4 selected/)).toBeOnTheScreen();
  expect(screen.getAllByText("✓")).toHaveLength(4);
  expect(screen.getAllByText("✦")).toHaveLength(20);
  expect(screen.getByText("Locked Awards (6)")).toBeOnTheScreen();
  expect(screen.getByLabelText("10 streak locked award image")).toBeOnTheScreen();
});

it("toggles badges and leaves the four-selection limit to the selection state", async () => {
  await render(<Awards />);

  await userEvent.press(screen.getByRole("button", { name: "Badge 0 award" }));
  expect(toggleBadgeSelection).toHaveBeenCalledWith("badge-0");

  await userEvent.press(screen.getByRole("button", { name: "Badge 4 award" }));
  expect(toggleBadgeSelection).toHaveBeenCalledWith("badge-4");
});

it("returns to the profile with the top-left button", async () => {
  await render(<Awards />);
  await userEvent.press(screen.getByRole("button", { name: "Back to profile" }));

  expect(router.back).toHaveBeenCalled();
});

it("hides progress for a completed single-tier award", async () => {
  jest.mocked(useSession).mockReturnValue(
    fakeSession({
      account: {
        id: "1",
        displayName: "Sam Lee",
        profilePhotoUrl: null,
        lookingForTeam: false,
        createdAt: "2026-10-17T12:00:00.000Z",
        badges: [{ ...badges[0], isComplete: true, availableTiers: ["Bronze"] }],
      },
      selectedBadgeKeys: ["badge-0"],
      toggleBadgeSelection,
    }),
  );

  await render(<Awards />);

  expect(screen.queryByText("25/30")).not.toBeOnTheScreen();
});
