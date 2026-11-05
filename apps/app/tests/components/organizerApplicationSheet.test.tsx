// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { fireEvent, render, screen, userEvent } from "@testing-library/react-native";
import type { User } from "firebase/auth";
import { OrganizerApplicationSheet } from "@/components/organizer/applicationSheet";
import { ApiError } from "@/lib/api";
import {
  applyToBeOrganizer,
  getMyOrganizerApplication,
  type OrganizerApplication,
} from "@/lib/organizer-applications";
import { useSession } from "@/lib/session";
import { fakeSession } from "../fake-session";

jest.setTimeout(20_000);

jest.mock("@/lib/session", () => ({ useSession: jest.fn() }));
jest.mock("@/lib/organizer-applications", () => ({
  ...jest.requireActual("@/lib/organizer-applications"),
  applyToBeOrganizer: jest.fn(),
  getMyOrganizerApplication: jest.fn(),
}));

const user = { email: "sam@example.com" } as User;
const reloadAccount = jest.fn();
const onClose = jest.fn();

const application = (changes: Partial<OrganizerApplication> = {}): OrganizerApplication => ({
  id: "app-1",
  status: "PENDING",
  description: "Monthly 6v6 in Verdun",
  link: "https://instagram.com/verdunvolley",
  denyReason: null,
  createdAt: "2026-11-04T12:00:00.000Z",
  expiresAt: "2026-11-18T12:00:00.000Z",
  decidedAt: null,
  ...changes,
});

beforeEach(() => {
  jest.mocked(useSession).mockReturnValue(fakeSession({ user, reloadAccount }));
  jest.mocked(getMyOrganizerApplication).mockResolvedValue(null);
});

const openSheet = () => render(<OrganizerApplicationSheet visible onClose={onClose} />);
const describeEvents = (text: string) =>
  userEvent.type(screen.getByLabelText("What do you organize?"), text);
const typeLink = (text: string) =>
  userEvent.type(
    screen.getByLabelText("Link to past events or your community page (optional)"),
    text,
  );
const send = () => userEvent.press(screen.getByRole("button", { name: "Send request" }));

it("shows nothing while closed", async () => {
  await render(<OrganizerApplicationSheet visible={false} onClose={onClose} />);

  expect(screen.queryByText("Become an organizer")).not.toBeOnTheScreen();
  expect(getMyOrganizerApplication).not.toHaveBeenCalled();
});

it("shows the form to a player who never applied", async () => {
  await openSheet();

  expect(await screen.findByLabelText("What do you organize?")).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Send request" })).toBeDisabled();
});

it("says the request was sent only once the server confirms it", async () => {
  let confirm!: (value: OrganizerApplication) => void;
  jest.mocked(applyToBeOrganizer).mockReturnValue(new Promise((resolve) => (confirm = resolve)));
  await openSheet();
  await describeEvents("  Monthly 6v6 in Verdun ");
  await typeLink("instagram.com/verdunvolley");

  await send();
  expect(screen.getByRole("button", { name: "Sending…" })).toBeDisabled();
  expect(screen.queryByText("Request sent")).not.toBeOnTheScreen();

  confirm(application());
  expect(await screen.findByText("Request sent")).toBeOnTheScreen();
  expect(applyToBeOrganizer).toHaveBeenCalledWith(user, {
    description: "Monthly 6v6 in Verdun",
    link: "https://instagram.com/verdunvolley",
  });
});

it("keeps what the player typed when sending fails", async () => {
  jest
    .mocked(applyToBeOrganizer)
    .mockRejectedValue(new ApiError(0, "Can't reach the Rally server."));
  await openSheet();
  await describeEvents("Beach 2s on Sundays");

  await send();

  expect(await screen.findByText("Can't reach the Rally server.")).toBeOnTheScreen();
  expect(screen.getByLabelText("What do you organize?")).toHaveDisplayValue("Beach 2s on Sundays");
  expect(screen.queryByText("Request sent")).not.toBeOnTheScreen();
});

it("asks for a real web address before sending", async () => {
  await openSheet();
  await describeEvents("Beach 2s");
  await typeLink("my club");

  await send();

  expect(screen.getByText("Enter a web address, like instagram.com/yourclub.")).toBeOnTheScreen();
  expect(applyToBeOrganizer).not.toHaveBeenCalled();
});

it("shows a pending request with what was sent", async () => {
  jest.mocked(getMyOrganizerApplication).mockResolvedValue(application());
  await openSheet();

  expect(await screen.findByText("Request sent")).toBeOnTheScreen();
  expect(screen.getByText("Monthly 6v6 in Verdun")).toBeOnTheScreen();
  expect(screen.queryByLabelText("What do you organize?")).not.toBeOnTheScreen();
});

it("shows why a request was denied and starts a new one from it", async () => {
  jest
    .mocked(getMyOrganizerApplication)
    .mockResolvedValue(application({ status: "DENIED", denyReason: "Add past events." }));
  await openSheet();

  expect(await screen.findByText("Your request was denied")).toBeOnTheScreen();
  expect(screen.getByText("Reason: Add past events.")).toBeOnTheScreen();

  await userEvent.press(screen.getByRole("button", { name: "Send a new request" }));
  expect(screen.getByLabelText("What do you organize?")).toHaveDisplayValue(
    "Monthly 6v6 in Verdun",
  );
});

it("lets the player send an expired request again", async () => {
  jest.mocked(getMyOrganizerApplication).mockResolvedValue(application({ status: "EXPIRED" }));
  await openSheet();

  expect(await screen.findByText("Your request expired")).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Send a new request" })).toBeOnTheScreen();
});

it("reloads the account after an approval, so organizer tools appear", async () => {
  jest.mocked(getMyOrganizerApplication).mockResolvedValue(application({ status: "APPROVED" }));
  await openSheet();
  expect(await screen.findByText("You're an organizer")).toBeOnTheScreen();

  await userEvent.press(screen.getByRole("button", { name: "Done" }));

  expect(reloadAccount).toHaveBeenCalled();
  expect(onClose).toHaveBeenCalled();
});

it("doesn't reload the account when closing without an approval", async () => {
  await openSheet();
  await screen.findByLabelText("What do you organize?");

  await userEvent.press(screen.getByRole("button", { name: "Close" }));

  expect(onClose).toHaveBeenCalled();
  expect(reloadAccount).not.toHaveBeenCalled();
});

it("offers to try again when the request can't be loaded", async () => {
  jest
    .mocked(getMyOrganizerApplication)
    .mockRejectedValueOnce(new ApiError(0, "Can't reach the Rally server."));
  await openSheet();
  expect(await screen.findByText("Can't reach the Rally server.")).toBeOnTheScreen();

  await userEvent.press(screen.getByRole("button", { name: "Try again" }));

  expect(await screen.findByLabelText("What do you organize?")).toBeOnTheScreen();
});

// Regression: the sheet used to sit inside the backdrop, so on the web a click
// anywhere in it (even in a text box) reached the backdrop and closed it.
it("stays open while the player clicks and types inside it", async () => {
  await openSheet();
  await describeEvents("Beach 2s on Sundays");
  fireEvent.press(screen.getByTestId("organizer-sheet"));
  fireEvent.press(screen.getByLabelText("What do you organize?"));

  expect(onClose).not.toHaveBeenCalled();
  expect(screen.getByLabelText("What do you organize?")).toHaveDisplayValue("Beach 2s on Sundays");
});

it("closes when the player taps outside it", async () => {
  await openSheet();
  await screen.findByLabelText("What do you organize?");

  fireEvent.press(screen.getByTestId("organizer-sheet-backdrop"));

  expect(onClose).toHaveBeenCalled();
});
