// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { render, screen, userEvent, waitFor } from "@testing-library/react-native";
import type { User } from "firebase/auth";
import { TournamentResults } from "@/components/profile/TournamentResults";
import { getTournamentResults } from "@/lib/profile-tournaments";
import { ApiError } from "@/lib/api";
jest.mock("@/lib/profile-tournaments", () => ({ getTournamentResults: jest.fn() }));
const user = { uid: "alice" } as User;
const results = [1, 2, 3, 4, 5].map((id) => ({ id: String(id), eventName: `Event ${id}`, tournamentName: `Tournament ${id}`, teamName: `Historical team ${id}`, endedAt: "2026-05-01T18:00:00Z", placement: id }));
beforeEach(() => { jest.mocked(getTournamentResults).mockResolvedValue({ results }); });
it("previews three results, expands all and collapses again", async () => {
  await render(<TournamentResults user={user} />);
  expect(await screen.findByText("Tournament 1")).toBeOnTheScreen();
  expect(screen.getByText("Historical team 1")).toBeOnTheScreen();
  expect(screen.getByLabelText("Placement 1")).toBeOnTheScreen();
  expect(screen.queryByText("Tournament 4")).not.toBeOnTheScreen();
  await userEvent.press(screen.getByRole("button", { name: "See all results" }));
  expect(screen.getByText("Tournament 5")).toBeOnTheScreen();
  await userEvent.press(screen.getByRole("button", { name: "Show fewer results" }));
  expect(screen.queryByText("Tournament 4")).not.toBeOnTheScreen();
});
it("shows an honest empty state without fake history", async () => {
  jest.mocked(getTournamentResults).mockResolvedValue({ results: [] });
  await render(<TournamentResults user={user} />);
  expect(await screen.findByText("No tournament results to show yet.")).toBeOnTheScreen();
  expect(screen.queryByRole("button", { name: "See all results" })).not.toBeOnTheScreen();
});
it("retries failed reads", async () => {
  jest.mocked(getTournamentResults).mockRejectedValueOnce(new ApiError(503, "Try later"));
  await render(<TournamentResults user={user} />);
  await userEvent.press(await screen.findByRole("button", { name: "Try again" }));
  expect(await screen.findByText("Tournament 1")).toBeOnTheScreen();
});
it("isolates results when the signed-in account changes", async () => {
  let resolve!: (value: { results: typeof results }) => void;
  jest.mocked(getTournamentResults).mockReturnValueOnce(new Promise((done) => { resolve = done; }));
  const view = await render(<TournamentResults key="alice" user={user} />);
  jest.mocked(getTournamentResults).mockResolvedValue({ results: [] });
  await view.rerender(<TournamentResults key="bob" user={{ uid: "bob" } as User} />);
  expect(await screen.findByText("No tournament results to show yet.")).toBeOnTheScreen();
  resolve({ results });
  await waitFor(() => expect(screen.queryByText("Tournament 1")).not.toBeOnTheScreen());
});
