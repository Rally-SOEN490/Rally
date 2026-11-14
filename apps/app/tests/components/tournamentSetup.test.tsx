// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { act, fireEvent, render, screen, userEvent } from "@testing-library/react-native";
import { Platform } from "react-native";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import type { User } from "firebase/auth";
import { SetupScreen } from "@/components/tournaments/setupScreen";
import { ApiError } from "@/lib/api";
import {
  createTournament,
  getTournament,
  updateTournament,
  type OrganizerTournament,
} from "@/lib/organizer-tournaments";
import { useSession } from "@/lib/session";
import { fakeSession } from "../fake-session";

jest.setTimeout(20_000);

const mockNavigation = { dispatch: jest.fn() };
jest.mock("expo-router", () => ({
  router: { back: jest.fn(), canGoBack: jest.fn(() => true), replace: jest.fn() },
  useNavigation: () => mockNavigation,
}));
// Records what the screen asked the navigator. `tryToLeave` then does what the
// navigator does when the back arrow, Android's back button or an iOS swipe
// tries to close the screen: calls back if leaving is blocked, else leaves.
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
  createTournament: jest.fn(),
  getTournament: jest.fn(),
  updateTournament: jest.fn(),
}));
// Stands in for the phone's date picker; tests "pick" by calling its onChange.
jest.mock("@react-native-community/datetimepicker", () => {
  const { View } = jest.requireActual("react-native");
  return {
    __esModule: true,
    default: (props: { testID: string; onChange: unknown }) => (
      <View testID={props.testID} onChange={props.onChange} />
    ),
    DateTimePickerAndroid: { open: jest.fn() },
  };
});

const user = { email: "org@example.com" } as User;
const saved = { id: "t1", name: "Verdun Winter Cup" } as OrganizerTournament;

beforeEach(() => {
  jest.mocked(useSession).mockReturnValue(fakeSession({ user }));
  jest.mocked(createTournament).mockResolvedValue(saved);
  jest.mocked(updateTournament).mockResolvedValue(saved);
});

const type = (label: string, text: string) => userEvent.type(screen.getByLabelText(label), text);
const press = (name: string) => userEvent.press(screen.getByRole("button", { name }));
// Opens a date or time field and picks a value in the phone's picker.
// On iOS the picker opens in a sheet; the field only changes on "Done".
const pick = async (label: string, value: Date) => {
  await press(label);
  await fireEvent(screen.getByTestId(`${label} picker`), "onChange", { type: "set" }, value);
  await press("Done");
};

it("needs a name before saving a draft", async () => {
  await render(<SetupScreen />);

  await press("Save draft");

  expect(screen.getByText("Give the tournament a name.")).toBeOnTheScreen();
  expect(createTournament).not.toHaveBeenCalled();
});

it("saves a draft with only a name, then returns to Events", async () => {
  await render(<SetupScreen />);
  await type("Tournament name", "  Verdun Winter Cup ");

  await press("Save draft");

  expect(createTournament).toHaveBeenCalledWith(user, {
    name: "Verdun Winter Cup",
    location: null,
    courts: null,
    description: null,
    startsAt: null,
    endsAt: null,
    registrationOpensAt: null,
    registrationClosesAt: null,
  });
  expect(router.replace).toHaveBeenCalledWith("/events");
});

it("saves every field in Montreal time, then goes to Divisions", async () => {
  await render(<SetupScreen />);
  await type("Tournament name", "Verdun Winter Cup");
  await type("Location", "Verdun Auditorium");
  await press("More courts");
  await press("More courts");
  await pick("Starts date", new Date(2027, 10, 15, 12));
  await pick("Starts time", new Date(2027, 0, 1, 9, 0));
  await type("Description", "🏐 Line one\n  indented");

  await press("Divisions");

  expect(createTournament).toHaveBeenCalledWith(
    user,
    expect.objectContaining({
      location: "Verdun Auditorium",
      courts: 2,
      startsAt: "2027-11-15T09:00",
      description: "🏐 Line one\n  indented",
    }),
  );
  expect(router.replace).toHaveBeenCalledWith("/tournaments/t1/divisions");
});

it("asks for both a date and a time", async () => {
  await render(<SetupScreen />);
  await type("Tournament name", "Cup");
  await pick("Ends date", new Date(2027, 10, 15, 12));

  await press("Save draft");

  expect(screen.getByText('Pick both a date and a time for "Ends", or neither.')).toBeOnTheScreen();
  expect(createTournament).not.toHaveBeenCalled();
});

it("catches an end before the start before sending anything", async () => {
  await render(<SetupScreen />);
  await type("Tournament name", "Cup");
  await pick("Starts date", new Date(2027, 10, 15, 12));
  await pick("Starts time", new Date(2027, 0, 1, 9, 0));
  await pick("Ends date", new Date(2027, 10, 15, 12));
  await pick("Ends time", new Date(2027, 0, 1, 8, 0));

  await press("Save draft");

  expect(screen.getByText("The end must be after the start.")).toBeOnTheScreen();
  expect(createTournament).not.toHaveBeenCalled();
});

it("keeps what was typed when saving fails", async () => {
  jest.mocked(createTournament).mockRejectedValue(new ApiError(0, "Can't reach the Rally server."));
  await render(<SetupScreen />);
  await type("Tournament name", "Verdun Winter Cup");

  await press("Divisions");

  expect(await screen.findByText("Can't reach the Rally server.")).toBeOnTheScreen();
  expect(screen.getByLabelText("Tournament name")).toHaveDisplayValue("Verdun Winter Cup");
  expect(router.replace).not.toHaveBeenCalled();
});

it("reopens a draft and saves changes over it", async () => {
  jest.mocked(getTournament).mockResolvedValue({
    ...saved,
    location: "Verdun",
    courts: 3,
    description: null,
    startsAt: "2027-11-15T09:00",
    endsAt: null,
    registrationOpensAt: null,
    registrationClosesAt: null,
  } as OrganizerTournament);
  await render(<SetupScreen id="t1" />);

  expect(await screen.findByDisplayValue("Verdun Winter Cup")).toBeOnTheScreen();
  expect(screen.getByText("3 courts")).toBeOnTheScreen();
  expect(screen.getByText("Nov 15, 2027")).toBeOnTheScreen();
  await press("Fewer courts");
  await press("Save draft");

  expect(updateTournament).toHaveBeenCalledWith(user, "t1", expect.objectContaining({ courts: 2 }));
  expect(createTournament).not.toHaveBeenCalled();
});

it("offers to try again when a draft can't be loaded", async () => {
  jest
    .mocked(getTournament)
    .mockRejectedValueOnce(new ApiError(404, "Tournament not found."))
    .mockResolvedValueOnce(saved);
  await render(<SetupScreen id="t1" />);
  expect(await screen.findByText("Tournament not found.")).toBeOnTheScreen();

  await press("Try again");

  expect(await screen.findByDisplayValue("Verdun Winter Cup")).toBeOnTheScreen();
});

// ---------- Leaving without saving ----------

it("lets the organizer leave freely when nothing changed", async () => {
  await render(<SetupScreen />);

  await press("Back");
  await tryToLeave();

  expect(router.back).toHaveBeenCalled();
  expect(mockNavigation.dispatch).toHaveBeenCalledWith({ type: "GO_BACK" });
  expect(screen.queryByText("Leave without saving?")).not.toBeOnTheScreen();
});

// The back arrow, Android's back button and the iOS swipe all reach the navigator
// the same way, so one test covers all three.
it("asks before closing the screen with unsaved changes, and can stay", async () => {
  await render(<SetupScreen />);
  await type("Tournament name", "Verdun Winter Cup");

  await tryToLeave();
  expect(screen.getByText("Leave without saving?")).toBeOnTheScreen();
  expect(screen.getByText("Your changes on this page won't be saved.")).toBeOnTheScreen();
  await press("Keep editing");

  expect(mockNavigation.dispatch).not.toHaveBeenCalled();
  expect(screen.getByLabelText("Tournament name")).toHaveDisplayValue("Verdun Winter Cup");
});

it("leaves without saving when the organizer confirms", async () => {
  await render(<SetupScreen />);
  await type("Tournament name", "Verdun Winter Cup");

  await tryToLeave({ type: "POP" });
  await press("Leave");

  expect(mockNavigation.dispatch).toHaveBeenCalledWith({ type: "POP" });
  expect(createTournament).not.toHaveBeenCalled();
});

it("leaves without asking right after saving", async () => {
  await render(<SetupScreen />);
  await type("Tournament name", "Verdun Winter Cup");

  await press("Save draft");
  await tryToLeave({ type: "REPLACE" });

  expect(router.replace).toHaveBeenCalledWith("/events");
  expect(mockNavigation.dispatch).toHaveBeenCalledWith({ type: "REPLACE" });
  expect(screen.queryByText("Leave without saving?")).not.toBeOnTheScreen();
});

it("asks again after saving if something changes", async () => {
  await render(<SetupScreen />);
  await type("Tournament name", "Cup");
  await press("Save draft");
  await tryToLeave();
  mockNavigation.dispatch.mockClear();

  await type("Location", "Verdun");
  await tryToLeave();

  expect(screen.getByText("Leave without saving?")).toBeOnTheScreen();
  expect(mockNavigation.dispatch).not.toHaveBeenCalled();
});

// ---------- Registration and the start ----------

it("explains when registration opens after the tournament starts", async () => {
  await render(<SetupScreen />);
  await type("Tournament name", "Cup");
  await pick("Starts date", new Date(2027, 10, 15, 12));
  await pick("Starts time", new Date(2027, 0, 1, 9, 0));
  await pick("Opens date", new Date(2027, 10, 16, 12));
  await pick("Opens time", new Date(2027, 0, 1, 9, 0));

  await press("Save draft");

  expect(
    screen.getByText("Registration must open before or when the tournament starts."),
  ).toBeOnTheScreen();
  expect(createTournament).not.toHaveBeenCalled();
});

it("lets registration close at the moment the tournament starts", async () => {
  await render(<SetupScreen />);
  await type("Tournament name", "Cup");
  for (const moment of ["Starts", "Closes"]) {
    await pick(`${moment} date`, new Date(2027, 10, 15, 12));
    await pick(`${moment} time`, new Date(2027, 0, 1, 9, 0));
  }

  await press("Save draft");

  expect(createTournament).toHaveBeenCalledWith(
    user,
    expect.objectContaining({
      startsAt: "2027-11-15T09:00",
      registrationClosesAt: "2027-11-15T09:00",
    }),
  );
});

// ---------- The iPhone picker sheet ----------

it("only changes the field when the organizer taps Done", async () => {
  await render(<SetupScreen />);
  await press("Starts time");
  await fireEvent(
    screen.getByTestId("Starts time picker"),
    "onChange",
    { type: "set" },
    new Date(2027, 0, 1, 9, 30),
  );

  expect(screen.getByRole("button", { name: "Starts time" })).toHaveAccessibilityValue({
    text: "Pick a time",
  });
  await press("Done");

  expect(screen.queryByTestId("Starts time picker")).not.toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Starts time" })).toHaveAccessibilityValue({
    text: "9:30 AM",
  });
});

it.each([
  ["Cancel", () => press("Cancel")],
  ["a tap outside", () => fireEvent.press(screen.getByTestId("Starts time picker backdrop"))],
])("keeps the old value after %s", async (_, close) => {
  await render(<SetupScreen />);
  await pick("Starts time", new Date(2027, 0, 1, 9, 0));
  await press("Starts time");
  await fireEvent(
    screen.getByTestId("Starts time picker"),
    "onChange",
    { type: "set" },
    new Date(2027, 0, 1, 18, 0),
  );

  await close();

  expect(screen.queryByTestId("Starts time picker")).not.toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Starts time" })).toHaveAccessibilityValue({
    text: "9:00 AM",
  });
});

it("takes the time the wheel shows when Done is tapped without scrolling", async () => {
  await render(<SetupScreen />);

  await press("Ends time");
  await press("Done");

  expect(screen.getByRole("button", { name: "Ends time" }).props.accessibilityValue.text).toMatch(
    /^\d{1,2}:\d{2} (AM|PM)$/,
  );
});

// ---------- Clearing optional dates (RALLY-230 / #317) ----------
const savedDates = {
  startsAt: "2027-11-15T09:00",
  endsAt: "2027-11-15T19:00",
  registrationOpensAt: "2027-10-20T12:00",
  registrationClosesAt: "2027-11-09T23:59",
};
const datedDraft = { ...saved, ...savedDates, location: null, courts: null, description: null };
const clearCases = (
  [
    ["startsAt", "Starts"],
    ["endsAt", "Ends"],
    ["registrationOpensAt", "Opens"],
    ["registrationClosesAt", "Closes"],
  ] as const
).map(([field, label]) => ({ field, label }));

it.each(clearCases)(
  "clears $label via its row control and saves the pair as null",
  async ({ field, label }) => {
    jest.mocked(getTournament).mockResolvedValue(datedDraft);
    await render(<SetupScreen id="t1" />);
    await screen.findByDisplayValue("Verdun Winter Cup");
    await press(`Clear ${label.toLowerCase()} date and time`);
    expect(screen.getByRole("button", { name: `${label} date` })).toHaveAccessibilityValue({
      text: "Pick a date",
    });
    expect(screen.getByRole("button", { name: `${label} time` })).toHaveAccessibilityValue({
      text: "Pick a time",
    });
    expect(
      screen.queryByRole("button", { name: `Clear ${label.toLowerCase()} date and time` }),
    ).not.toBeOnTheScreen();
    expect(mockPreventRemove.blocked).toBe(true);
    await press("Save draft");
    expect(updateTournament).toHaveBeenCalledWith(
      user,
      "t1",
      expect.objectContaining({ ...savedDates, [field]: null }),
    );
  },
);

it("can select a date and time again after clearing, and keeps the clear on a failed save", async () => {
  jest.mocked(getTournament).mockResolvedValue(datedDraft);
  jest.mocked(updateTournament).mockRejectedValueOnce(new ApiError(503, "Please try again."));
  await render(<SetupScreen id="t1" />);
  await screen.findByDisplayValue("Verdun Winter Cup");
  await press("Clear starts date and time");
  await press("Save draft");
  expect(screen.getByText("Please try again.")).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Starts date" })).toHaveAccessibilityValue({
    text: "Pick a date",
  });
  await pick("Starts date", new Date(2027, 10, 15, 12));
  await pick("Starts time", new Date(2027, 0, 1, 10));
  await press("Save draft");
  expect(updateTournament).toHaveBeenLastCalledWith(
    user,
    "t1",
    expect.objectContaining({ ...savedDates, startsAt: "2027-11-15T10:00" }),
  );
});

it("clears on Android without opening the picker and still opens the picker normally", async () => {
  const platform = jest.replaceProperty(Platform, "OS", "android");
  try {
    jest.mocked(getTournament).mockResolvedValue(datedDraft);
    await render(<SetupScreen id="t1" />);
    await screen.findByDisplayValue("Verdun Winter Cup");
    await press("Clear starts date and time");
    expect(DateTimePickerAndroid.open).not.toHaveBeenCalled();
    await press("Starts date");
    expect(DateTimePickerAndroid.open).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "date" }),
    );
  } finally {
    platform.restore();
  }
});
