// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { render, screen, userEvent, fireEvent, waitFor } from "@testing-library/react-native";
import type { User } from "firebase/auth";
import { ProfileMessage } from "@/components/profile/ProfileMessage";
import { getProfileMessage, saveProfileMessage } from "@/lib/profile-message";
import { ApiError } from "@/lib/api";
jest.mock("@/lib/profile-message", () => ({ getProfileMessage: jest.fn(), saveProfileMessage: jest.fn() }));
const user = { uid: "alice" } as User;
beforeEach(() => {
  jest.mocked(getProfileMessage).mockResolvedValue({ message: "Weekend volleyball" });
  jest.mocked(saveProfileMessage).mockImplementation(async (_user, message) => ({ message: message.trim() }));
});
it("loads and saves an edited message, and restores it when reopened", async () => {
  const view = await render(<ProfileMessage user={user} />);
  expect(await screen.findByText("Weekend volleyball")).toBeOnTheScreen();
  await userEvent.press(screen.getByRole("button", { name: "Edit message" }));
  await fireEvent.changeText(screen.getByLabelText("Profile message"), "  See you Sunday 🏐  ");
  await userEvent.press(screen.getByRole("button", { name: "Save message" }));
  expect(await screen.findByText("Message saved.")).toBeOnTheScreen();
  expect(saveProfileMessage).toHaveBeenCalledWith(user, "  See you Sunday 🏐  ");
  expect(screen.getByText("See you Sunday 🏐")).toBeOnTheScreen();
  await view.unmount();
  jest.mocked(getProfileMessage).mockResolvedValue({ message: "See you Sunday 🏐" });
  await render(<ProfileMessage user={user} />);
  expect(await screen.findByText("See you Sunday 🏐")).toBeOnTheScreen();
});
it("preserves the draft after a failed save and allows retry", async () => {
  jest.mocked(saveProfileMessage).mockRejectedValueOnce(new ApiError(0, "Offline"));
  await render(<ProfileMessage user={user} />);
  await userEvent.press(await screen.findByRole("button", { name: "Edit message" }));
  await fireEvent.changeText(screen.getByLabelText("Profile message"), "Keep my draft");
  await userEvent.press(screen.getByRole("button", { name: "Save message" }));
  expect(await screen.findByText("Offline")).toBeOnTheScreen();
  expect(screen.getByDisplayValue("Keep my draft")).toBeOnTheScreen();
  await userEvent.press(screen.getByRole("button", { name: "Save message" }));
  expect(await screen.findByText("Message saved.")).toBeOnTheScreen();
});
it("cancel preserves the saved message and clearing it removes it", async () => {
  await render(<ProfileMessage user={user} />);
  await userEvent.press(await screen.findByRole("button", { name: "Edit message" }));
  await fireEvent.changeText(screen.getByLabelText("Profile message"), "Discard this");
  await userEvent.press(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.getByText("Weekend volleyball")).toBeOnTheScreen();
  expect(saveProfileMessage).not.toHaveBeenCalled();
  await userEvent.press(screen.getByRole("button", { name: "Edit message" }));
  await fireEvent.changeText(screen.getByLabelText("Profile message"), "");
  await userEvent.press(screen.getByRole("button", { name: "Save message" }));
  expect(await screen.findByText("Message removed.")).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Add a message" })).toBeOnTheScreen();
});
it("counts emoji as one character and prevents oversized saves", async () => {
  await render(<ProfileMessage user={user} />);
  await userEvent.press(await screen.findByRole("button", { name: "Edit message" }));
  await fireEvent.changeText(screen.getByLabelText("Profile message"), "🏐".repeat(280));
  expect(screen.getByText("280/280")).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Save message" })).toBeEnabled();
  await fireEvent.changeText(screen.getByLabelText("Profile message"), "x".repeat(281));
  expect(screen.getByRole("button", { name: "Save message" })).toBeDisabled();
});
it("retries a failed initial load", async () => {
  jest.mocked(getProfileMessage).mockRejectedValueOnce(new ApiError(503, "Try later"));
  await render(<ProfileMessage user={user} />);
  await userEvent.press(await screen.findByRole("button", { name: "Try again" }));
  expect(await screen.findByText("Weekend volleyball")).toBeOnTheScreen();
});
it("does not leak a previous account's pending load into the next keyed editor", async () => {
  let resolve!: (value: { message: string }) => void;
  jest.mocked(getProfileMessage).mockReturnValueOnce(new Promise((done) => { resolve = done; }));
  const view = await render(<ProfileMessage key="alice" user={user} />);
  await view.rerender(<ProfileMessage key="bob" user={{ uid: "bob" } as User} />);
  expect(await screen.findByText("Weekend volleyball")).toBeOnTheScreen();
  resolve({ message: "Alice secret draft" });
  await waitFor(() => expect(screen.queryByText("Alice secret draft")).not.toBeOnTheScreen());
});
