// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { render, screen, userEvent } from "@testing-library/react-native";
import { Platform } from "react-native";
import OrganizerReview from "@/app/organizer-review";
import { ApiError } from "@/lib/api";
import {
  decideApplication,
  getApplicationForReview,
  type ApplicationForReview,
} from "@/lib/organizer-applications";

jest.setTimeout(20_000);

jest.mock("@/lib/organizer-applications", () => ({
  ...jest.requireActual("@/lib/organizer-applications"),
  decideApplication: jest.fn(),
  getApplicationForReview: jest.fn(),
}));

const token = "T".repeat(43);

const application = (changes: Partial<ApplicationForReview> = {}): ApplicationForReview => ({
  applicantName: "Alice Tremblay",
  status: "PENDING",
  description: "Monthly 6v6 in Verdun",
  link: "https://instagram.com/verdunvolley",
  denyReason: null,
  createdAt: "2026-11-04T12:00:00.000Z",
  expiresAt: "2026-11-18T12:00:00.000Z",
  decidedAt: null,
  ...changes,
});

// The page reads the token from the address bar, as a browser opening the email link would.
const openLink = (hash = `#token=${token}`) => {
  jest.replaceProperty(Platform, "OS", "web");
  Object.defineProperty(window, "location", { value: { hash }, configurable: true });
  return render(<OrganizerReview />);
};
const press = (name: string) => userEvent.press(screen.getByRole("button", { name }));

beforeEach(() => {
  jest.mocked(getApplicationForReview).mockResolvedValue(application());
});

it("shows the request from the link, without logging in", async () => {
  await openLink();

  expect(await screen.findByText("Alice Tremblay")).toBeOnTheScreen();
  expect(screen.getByText("Monthly 6v6 in Verdun")).toBeOnTheScreen();
  expect(screen.getByText("https://instagram.com/verdunvolley")).toBeOnTheScreen();
  expect(getApplicationForReview).toHaveBeenCalledWith(token);
});

it("explains what to do when the link has no token", async () => {
  await openLink("");

  expect(screen.getByText(/needs the full link from the review email/)).toBeOnTheScreen();
  expect(getApplicationForReview).not.toHaveBeenCalled();
});

it("asks to open the link in a browser on a phone", async () => {
  jest.replaceProperty(Platform, "OS", "ios");
  await render(<OrganizerReview />);

  expect(screen.getByText(/in a web browser/)).toBeOnTheScreen();
});

it("asks for confirmation, then approves once the server confirms", async () => {
  jest.mocked(decideApplication).mockResolvedValue(application({ status: "APPROVED" }));
  await openLink();
  await screen.findByText("Alice Tremblay");

  await press("Approve");
  expect(screen.getByText("Approve Alice Tremblay?")).toBeOnTheScreen();
  expect(decideApplication).not.toHaveBeenCalled();

  await press("Approve");

  expect(await screen.findByText("Alice Tremblay is now an organizer.")).toBeOnTheScreen();
  expect(decideApplication).toHaveBeenCalledWith(token, "approve", null);
  expect(screen.queryByRole("button", { name: "Deny" })).not.toBeOnTheScreen();
});

it("denies with the reason the reviewer typed", async () => {
  jest
    .mocked(decideApplication)
    .mockResolvedValue(application({ status: "DENIED", denyReason: "Add past events." }));
  await openLink();
  await screen.findByText("Alice Tremblay");

  await press("Deny");
  await userEvent.type(screen.getByLabelText(/Reason \(optional\)/), "  Add past events. ");
  await press("Deny request");

  expect(await screen.findByText("Alice Tremblay's request was denied.")).toBeOnTheScreen();
  expect(screen.getByText("Reason given: Add past events.")).toBeOnTheScreen();
  expect(decideApplication).toHaveBeenCalledWith(token, "deny", "Add past events.");
});

it("keeps the reason when the decision can't be sent", async () => {
  jest
    .mocked(decideApplication)
    .mockRejectedValue(new ApiError(0, "Can't reach the Rally server."));
  await openLink();
  await screen.findByText("Alice Tremblay");

  await press("Deny");
  await userEvent.type(screen.getByLabelText(/Reason \(optional\)/), "Add past events.");
  await press("Deny request");

  expect(await screen.findByText("Can't reach the Rally server.")).toBeOnTheScreen();
  expect(screen.getByLabelText(/Reason \(optional\)/)).toHaveDisplayValue("Add past events.");
});

it("shows the first reviewer's decision when someone else decided first", async () => {
  jest
    .mocked(decideApplication)
    .mockRejectedValue(new ApiError(409, "This request was already approved."));
  await openLink();
  await screen.findByText("Alice Tremblay");
  jest.mocked(getApplicationForReview).mockResolvedValue(application({ status: "APPROVED" }));

  await press("Deny");
  await press("Deny request");

  expect(await screen.findByText("Alice Tremblay is now an organizer.")).toBeOnTheScreen();
  expect(screen.getByText("This request was already approved.")).toBeOnTheScreen();
  expect(screen.queryByRole("button", { name: "Approve" })).not.toBeOnTheScreen();
});

it("shows an expired request without the buttons", async () => {
  jest.mocked(getApplicationForReview).mockResolvedValue(application({ status: "EXPIRED" }));
  await openLink();

  expect(await screen.findByText(/expired before anyone decided/)).toBeOnTheScreen();
  expect(screen.queryByRole("button", { name: "Approve" })).not.toBeOnTheScreen();
});

it("explains an invalid link", async () => {
  jest
    .mocked(getApplicationForReview)
    .mockRejectedValue(new ApiError(404, "This review link isn't valid."));
  await openLink();

  expect(await screen.findByText("This review link isn't valid.")).toBeOnTheScreen();
});
