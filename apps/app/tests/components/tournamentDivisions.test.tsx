// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { act, render, screen, userEvent } from "@testing-library/react-native";
import { router } from "expo-router";
import type { User } from "firebase/auth";
import { DivisionsScreen } from "@/components/tournaments/divisionsScreen";
import { ApiError } from "@/lib/api";
import {
  addDivision,
  getTournament,
  publishTournament,
  removeDivision,
  updateDivision,
  type Division,
  type OrganizerTournament,
} from "@/lib/organizer-tournaments";
import { useSession } from "@/lib/session";
import { fakeSession } from "../fake-session";

jest.setTimeout(20_000);

const mockNavigation = { dispatch: jest.fn() };
jest.mock("expo-router", () => ({
  router: { replace: jest.fn() },
  useNavigation: () => mockNavigation,
}));
// See tournamentSetup.test.tsx: `tryToLeave` acts like the navigator.
const mockPreventRemove = { blocked: false, onBlocked: (_: { data: { action: object } }) => {} };
jest.mock("expo-router/react-navigation", () => ({
  usePreventRemove: (blocked: boolean, onBlocked: typeof mockPreventRemove.onBlocked) => {
    mockPreventRemove.blocked = blocked;
    mockPreventRemove.onBlocked = onBlocked;
  },
}));
const tryToLeave = (action: object = { type: "GO_BACK" }) =>
  act(() =>
    mockPreventRemove.blocked
      ? mockPreventRemove.onBlocked({ data: { action } })
      : mockNavigation.dispatch(action),
  );
jest.mock("@/lib/session", () => ({ useSession: jest.fn() }));
jest.mock("@/lib/organizer-tournaments", () => ({
  ...jest.requireActual("@/lib/organizer-tournaments"),
  addDivision: jest.fn(),
  getTournament: jest.fn(),
  publishTournament: jest.fn(),
  removeDivision: jest.fn(),
  updateDivision: jest.fn(),
}));

const user = { email: "org@example.com" } as User;
const division: Division = {
  id: "d1",
  name: "6v6 Co-ed B / B+",
  format: "6v6",
  type: "coed",
  levels: ["B", "B+"],
  maxTeams: 15,
  priceCents: 24000,
};
const tournament = (divisions: Division[] = []) =>
  ({ id: "t1", name: "Verdun Winter Cup", status: "DRAFT", divisions }) as OrganizerTournament;

beforeEach(() => {
  jest.mocked(useSession).mockReturnValue(fakeSession({ user }));
  jest.mocked(getTournament).mockResolvedValue(tournament());
});

const open = async () => {
  await render(<DivisionsScreen id="t1" />);
  await screen.findByText("Divisions");
};
const press = (name: string) => userEvent.press(screen.getByRole("button", { name }));
const createButton = () => screen.getByRole("button", { name: "Create tournament" });

it("can't create the tournament until it has a division", async () => {
  await open();

  expect(screen.getByText(/No divisions yet/)).toBeOnTheScreen();
  expect(createButton()).toBeDisabled();
});

it("suggests a name from the choices and adds the division", async () => {
  jest.mocked(addDivision).mockResolvedValue(tournament([division]));
  await open();
  await press("Add division");

  await userEvent.press(screen.getByRole("radio", { name: "Co-ed" }));
  await userEvent.press(screen.getByRole("checkbox", { name: "B+" }));
  await userEvent.press(screen.getByRole("checkbox", { name: "B" }));
  expect(screen.getByLabelText("Division name")).toHaveDisplayValue("6v6 Co-ed B / B+");
  await press("More teams");
  await userEvent.type(screen.getByLabelText("Price"), "240");
  await press("Save division");

  expect(addDivision).toHaveBeenCalledWith(user, "t1", {
    name: "6v6 Co-ed B / B+",
    format: "6v6",
    type: "coed",
    levels: ["B+", "B"],
    maxTeams: 9,
    priceCents: 24000,
  });
  expect(await screen.findByText("6v6 · Co-ed · B, B+ · 15 teams · $240")).toBeOnTheScreen();
  expect(createButton()).toBeEnabled();
});

it("keeps a name the organizer typed when the choices change", async () => {
  await open();
  await press("Add division");
  await userEvent.clear(screen.getByLabelText("Division name"));
  await userEvent.type(screen.getByLabelText("Division name"), "Saturday Social");

  await userEvent.press(screen.getByRole("radio", { name: "4v4" }));

  expect(screen.getByLabelText("Division name")).toHaveDisplayValue("Saturday Social");
});

it.each([
  ["no level is picked", [], "Pick at least one level."],
  ["the price isn't a number", ["B"], "Enter a price like 240 or 12.50."],
])("explains when %s", async (_, levels, message) => {
  await open();
  await press("Add division");
  for (const level of levels) await userEvent.press(screen.getByRole("checkbox", { name: level }));
  await userEvent.type(screen.getByLabelText("Price"), "free");

  await press("Save division");

  expect(screen.getByText(message)).toBeOnTheScreen();
  expect(addDivision).not.toHaveBeenCalled();
});

it("keeps the division open with its values when saving fails", async () => {
  jest
    .mocked(addDivision)
    .mockRejectedValue(new ApiError(409, "This tournament already has a division with that name."));
  await open();
  await press("Add division");
  await userEvent.press(screen.getByRole("checkbox", { name: "A" }));

  await press("Save division");

  expect(await screen.findByText(/already has a division with that name/)).toBeOnTheScreen();
  expect(screen.getByLabelText("Division name")).toHaveDisplayValue("6v6 Co-ed A");
});

it("edits a division", async () => {
  jest.mocked(getTournament).mockResolvedValue(tournament([division]));
  jest.mocked(updateDivision).mockResolvedValue(tournament([{ ...division, maxTeams: 14 }]));
  await open();

  await press("Edit");
  await press("Fewer teams");
  await press("Save division");

  expect(updateDivision).toHaveBeenCalledWith(
    user,
    "t1",
    "d1",
    expect.objectContaining({ maxTeams: 14 }),
  );
  expect(await screen.findByText(/14 teams/)).toBeOnTheScreen();
});

it("asks before removing a division", async () => {
  jest.mocked(getTournament).mockResolvedValue(tournament([division]));
  jest.mocked(removeDivision).mockResolvedValue(tournament());
  await open();

  await press("Remove");
  expect(screen.getByText("Remove 6v6 Co-ed B / B+?")).toBeOnTheScreen();
  expect(removeDivision).not.toHaveBeenCalled();
  await press("Remove");

  expect(removeDivision).toHaveBeenCalledWith(user, "t1", "d1");
  expect(await screen.findByText(/No divisions yet/)).toBeOnTheScreen();
});

it("publishes, then returns to Events only once the server confirms", async () => {
  jest.mocked(getTournament).mockResolvedValue(tournament([division]));
  jest
    .mocked(publishTournament)
    .mockResolvedValue({ ...tournament([division]), status: "PUBLISHED" });
  await open();

  await userEvent.press(createButton());

  expect(publishTournament).toHaveBeenCalledWith(user, "t1");
  expect(router.replace).toHaveBeenCalledWith("/events");
});

it("shows why the tournament can't be published yet", async () => {
  jest.mocked(getTournament).mockResolvedValue(tournament([division]));
  jest
    .mocked(publishTournament)
    .mockRejectedValue(new ApiError(400, "Not ready to publish. Add a location."));
  await open();

  await userEvent.press(createButton());

  expect(await screen.findByText("Not ready to publish. Add a location.")).toBeOnTheScreen();
  expect(router.replace).not.toHaveBeenCalled();
});

// Both Save draft buttons (top and bottom) refuse to leave an unsaved division.
it.each([0, 1])(
  "won't leave while a division is still open (Save draft button %i)",
  async (which) => {
    await open();
    await press("Add division");

    await userEvent.press(screen.getAllByRole("button", { name: "Save draft" })[which]);

    expect(screen.getByText("Save or cancel the division you're editing first.")).toBeOnTheScreen();
    expect(router.replace).not.toHaveBeenCalled();
  },
);

it("goes back to the setup step", async () => {
  await open();

  await press("Back");

  expect(router.replace).toHaveBeenCalledWith("/tournaments/t1/setup");
});

it("asks before closing the screen while a division is still open", async () => {
  await open();
  await press("Add division");

  await tryToLeave();
  expect(screen.getByText("The division you're editing won't be saved.")).toBeOnTheScreen();
  await press("Leave");

  expect(mockNavigation.dispatch).toHaveBeenCalledWith({ type: "GO_BACK" });
  expect(addDivision).not.toHaveBeenCalled();
});

it("lets the organizer leave freely when no division is open", async () => {
  await open();

  await tryToLeave();

  expect(mockNavigation.dispatch).toHaveBeenCalled();
  expect(screen.queryByText("Leave without saving?")).not.toBeOnTheScreen();
});
