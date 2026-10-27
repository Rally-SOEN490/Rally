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
  expect(screen.getByText("Position not set")).toBeOnTheScreen();
  expect(screen.getByText("Preferences not set")).toBeOnTheScreen();
  expect(screen.getByLabelText("Matches: Not available yet")).toBeOnTheScreen();
  expect(screen.queryByText("C+")).not.toBeOnTheScreen();
});

it("keeps unavailable actions disabled rather than pretending they succeeded", async () => {
  await render(<PlayerCard player={player} />);
  expect(
    screen.getByRole("button", { name: "View profile: John Smith" }),
  ).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Invite: John Smith" }),
  ).toBeDisabled();
});

it("passes the selected stable player ID to supported actions", async () => {
  const view = jest.fn();
  const invite = jest.fn();
  await render(
    <PlayerCard player={player} onViewProfile={view} onInvite={invite} />,
  );
  await userEvent.press(
    screen.getByRole("button", { name: "View profile: John Smith" }),
  );
  await userEvent.press(
    screen.getByRole("button", { name: "Invite: John Smith" }),
  );
  expect(view).toHaveBeenCalledWith("player-1");
  expect(invite).toHaveBeenCalledWith("player-1");
});

it("shows supplied preferences and distinguishes zero statistics from unknown", async () => {
  await render(
    <PlayerCard
      player={{
        ...player,
        level: "C+",
        positions: ["Setter", "Outside"],
        stats: { matches: 0, wins: 2 },
      }}
    />,
  );
  expect(screen.getByText("Setter / Outside")).toBeOnTheScreen();
  expect(screen.getByText("C+")).toBeOnTheScreen();
  expect(screen.getByLabelText("Matches: 0")).toBeOnTheScreen();
  expect(screen.getByLabelText("Wins: 2")).toBeOnTheScreen();
  expect(screen.getByLabelText("Events: Not available yet")).toBeOnTheScreen();
});

it("reveals overflow preferences and closes the accessible dialog", async () => {
  const formats = ["Grass 4s", "Beach", "Indoors 6s", "Nine-man", "Co-ed"];
  await render(<PlayerCard player={{ ...player, formats }} />);
  expect(screen.getByText("+2")).toBeOnTheScreen();
  expect(screen.queryByText("Nine-man")).not.toBeOnTheScreen();
  await userEvent.press(
    screen.getByRole("button", { name: "Show all playing preferences" }),
  );
  expect(screen.getByText("Nine-man")).toBeOnTheScreen();
  await userEvent.press(screen.getByRole("button", { name: "Close" }));
  expect(screen.queryByText("Nine-man")).not.toBeOnTheScreen();
});

it("handles whitespace, a single Unicode name, and the availability flag", async () => {
  await render(
    <PlayerCard
      player={{ ...player, displayName: "  Élodie  ", lookingForTeam: true }}
    />,
  );
  expect(screen.getByText("É")).toBeOnTheScreen();
  expect(screen.getByText("Élodie")).toBeOnTheScreen();
  expect(screen.getByText("Looking for a team")).toBeOnTheScreen();
});
