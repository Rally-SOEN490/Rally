// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { render, screen, userEvent } from "@testing-library/react-native";
import type { User } from "firebase/auth";
import { UpcomingTeamBanner } from "@/components/profile/UpcomingTeamBanner";
import { getUpcomingTournaments } from "@/lib/profile-tournaments";
import { ApiError } from "@/lib/api";
jest.mock("@/lib/profile-tournaments", () => ({ getUpcomingTournaments: jest.fn() }));
const user = { uid: "alice" } as User;
const entries = [1, 2, 3].map((id) => ({ id: String(id), eventName: `Event ${id}`, tournamentName: `Tournament ${id}`, teamName: `Team ${id}`, startsAt: "2030-07-01T12:00:00Z", format: "Indoor 6s" }));
beforeEach(() => { jest.mocked(getUpcomingTournaments).mockResolvedValue({ tournaments: entries }); });
it("shows the nearest team and expands the +N bubble into all tournaments", async () => {
  await render(<UpcomingTeamBanner user={user} />);
  expect(await screen.findByText("Team 1")).toBeOnTheScreen();
  expect(screen.getByText("+2")).toBeOnTheScreen();
  await userEvent.press(screen.getByRole("button", { name: "Show all upcoming tournaments (3)" }));
  expect(screen.getByText("Tournament 3")).toBeOnTheScreen();
  await userEvent.press(screen.getByRole("button", { name: "Close upcoming tournaments" }));
  expect(screen.queryByText("Tournament 3")).not.toBeOnTheScreen();
});
it("shows an empty state without a fake team or expansion button", async () => {
  jest.mocked(getUpcomingTournaments).mockResolvedValue({ tournaments: [] });
  await render(<UpcomingTeamBanner user={user} />);
  expect(await screen.findByText("No upcoming team")).toBeOnTheScreen();
  expect(screen.queryByText("Sunbirds")).not.toBeOnTheScreen();
  expect(screen.queryByRole("button", { name: /Show all/ })).not.toBeOnTheScreen();
});
it("opens the full event and date details for a single tournament", async () => {
  jest.mocked(getUpcomingTournaments).mockResolvedValue({ tournaments: entries.slice(0, 1) });
  await render(<UpcomingTeamBanner user={user} />);
  expect(await screen.findByText("Team 1")).toBeOnTheScreen();
  await userEvent.press(screen.getByRole("button", { name: "Show all upcoming tournaments (1)" }));
  expect(screen.getByText("Event 1")).toBeOnTheScreen();
  expect(screen.getByText("Tournament 1")).toBeOnTheScreen();
  await userEvent.press(screen.getByRole("button", { name: "Close upcoming tournaments" }));
  expect(screen.queryByText("Event 1")).not.toBeOnTheScreen();
});
it("retries a failed load", async () => {
  jest.mocked(getUpcomingTournaments).mockRejectedValueOnce(new ApiError(503, "Unavailable"));
  await render(<UpcomingTeamBanner user={user} />);
  await userEvent.press(await screen.findByRole("button", { name: "Try again" }));
  expect(await screen.findByText("Team 1")).toBeOnTheScreen();
});
