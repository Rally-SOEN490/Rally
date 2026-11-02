// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { render, screen, userEvent } from "@testing-library/react-native";
import { PlayerCard, type PlayerCardData } from "@/components/playerCard";

const player: PlayerCardData = {
  id: "player-1",
  displayName: "John Smith",
  lookingForTeam: false,
};

it("renders real identity and unknown metadata without fabricated statistics", async () => {
  await render(<PlayerCard player={player} />);
  expect(screen.getByText("John Smith")).toBeOnTheScreen();
  expect(screen.getByText("JS")).toBeOnTheScreen();
  expect(screen.getByText("Interested In")).toBeOnTheScreen();
  expect(screen.queryByText("Position not set")).not.toBeOnTheScreen();
  expect(screen.getByText("Preferences not available yet")).toBeOnTheScreen();
  expect(screen.getByLabelText("Matches: Not available yet")).toBeOnTheScreen();
  expect(screen.queryByText("C+")).not.toBeOnTheScreen();
});

it("keeps unavailable actions disabled rather than pretending they succeeded", async () => {
  await render(<PlayerCard player={player} />);
  expect(screen.getByRole("button", { name: "View profile: John Smith" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Message: John Smith" })).toBeDisabled();
});

it("passes the selected stable player ID to supported actions", async () => {
  const view = jest.fn();
  const message = jest.fn();
  await render(<PlayerCard player={player} onViewProfile={view} onMessage={message} />);
  await userEvent.press(screen.getByRole("button", { name: "View profile: John Smith" }));
  await userEvent.press(screen.getByRole("button", { name: "Message: John Smith" }));
  expect(view).toHaveBeenCalledWith("player-1");
  expect(message).toHaveBeenCalledWith("player-1");
});

it("shows supplied preferences and distinguishes zero statistics from unknown", async () => {
  await render(
    <PlayerCard
      player={{
        ...player,
        level: "C+",
        positions: ["Setter", "Outside"],
        stats: { matches: 0, wins: 2, topFour: 0 },
      }}
    />,
  );
  expect(screen.getByText("Setter")).toBeOnTheScreen();
  expect(screen.getByText("C+")).toBeOnTheScreen();
  expect(screen.getByLabelText("Matches: 0")).toBeOnTheScreen();
  expect(screen.getByLabelText("Wins: 2")).toBeOnTheScreen();
  expect(screen.getByLabelText("Top 4: 0")).toBeOnTheScreen();
  expect(screen.getByLabelText("Events: Not available yet")).toBeOnTheScreen();
});

it("reveals overflow preferences and closes the accessible dialog", async () => {
  const formats = ["Grass 4s", "Beach", "Indoors 6s", "Nine-man", "Co-ed"];
  await render(<PlayerCard player={{ ...player, formats }} />);
  expect(screen.getByText("+1 more")).toBeOnTheScreen();
  expect(screen.queryByText("Co-ed")).not.toBeOnTheScreen();
  await userEvent.press(screen.getByRole("button", { name: "Show all interests" }));
  expect(screen.getByText("Co-ed")).toBeOnTheScreen();
  await userEvent.press(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByText("Co-ed")).not.toBeOnTheScreen();
});

it("handles whitespace, a single Unicode name, and the availability flag", async () => {
  await render(
    <PlayerCard player={{ ...player, displayName: "  Élodie  ", lookingForTeam: true }} />,
  );
  expect(screen.getByText("É")).toBeOnTheScreen();
  expect(screen.getByText("Élodie")).toBeOnTheScreen();
  expect(screen.getByText("Looking for a team")).toBeOnTheScreen();
});

it("includes positions and level in interest overflow without dropping data", async () => {
  await render(
    <PlayerCard
      player={{
        ...player,
        formats: ["Grass 4s", "Co-ed", "Beach"],
        positions: ["Setter"],
        level: "C+",
      }}
    />,
  );
  expect(screen.getByText("Grass 4s")).toBeOnTheScreen();
  expect(screen.getByText("Setter")).toBeOnTheScreen();
  expect(screen.getByText("C+")).toBeOnTheScreen();
  expect(screen.getByText("Co-ed")).toBeOnTheScreen();
  expect(screen.queryByText("Beach")).not.toBeOnTheScreen();
  await userEvent.press(screen.getByRole("button", { name: "Show all interests" }));
  expect(screen.getByText("Beach")).toBeOnTheScreen();
});

it("treats invalid and missing metric values as unknown", async () => {
  await render(
    <PlayerCard player={{ ...player, stats: { matches: -1, wins: 1.5, topFour: NaN } }} />,
  );
  for (const metric of ["Matches", "Wins", "Top 4", "Events"]) {
    expect(screen.getByLabelText(`${metric}: Not available yet`)).toBeOnTheScreen();
  }
});
