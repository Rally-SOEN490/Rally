// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { render, screen, userEvent, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import type { User } from "firebase/auth";
import Profile from "@/app/profile";
import { removeMyProfilePhoto, uploadMyProfilePhoto } from "@/lib/api";
import { useSession } from "@/lib/session";
import { fakeSession } from "../fake-session";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), replace: jest.fn() } }));
jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: null }),
}));
jest.mock("@/lib/session", () => ({ useSession: jest.fn() }));
jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  removeMyProfilePhoto: jest.fn(),
  uploadMyProfilePhoto: jest.fn(),
}));

const user = { email: "sam@example.com", displayName: "Old Firebase name" } as User;
const account = {
  id: "1",
  displayName: "Sam Lee",
  profilePhotoUrl: null,
  createdAt: "2026-10-17T12:00:00.000Z",
  badges: [
    {
      key: "champion",
      name: "Champion",
      tier: "Gold",
      description: "Placeholder championship badge",
      imageUrl: null,
      image: "badge-gold-placeholder",
      receivedCount: 25,
      awardedAt: "2026-10-17T12:00:00.000Z",
    },
    {
      key: "winner",
      name: "Winner",
      tier: "Gold",
      description: "Placeholder first-place badge",
      imageUrl: null,
      image: "badge-gold-placeholder",
      receivedCount: 22,
      awardedAt: "2026-10-17T12:00:00.000Z",
    },
    {
      key: "podium",
      name: "Podium",
      tier: "Gold",
      description: "Placeholder podium badge",
      imageUrl: null,
      image: "badge-gold-placeholder",
      receivedCount: 20,
      awardedAt: "2026-10-17T12:00:00.000Z",
    },
    {
      key: "competitor",
      name: "Competitor",
      tier: "Bronze",
      description: "Placeholder participation badge",
      imageUrl: null,
      image: "badge-gold-placeholder",
      receivedCount: 17,
      awardedAt: "2026-10-17T12:00:00.000Z",
    },
  ],
};

beforeEach(() => {
  jest.mocked(useSession).mockReturnValue(fakeSession({ user, account }));
  jest.mocked(removeMyProfilePhoto).mockResolvedValue({ ...account, profilePhotoUrl: null });
  jest.mocked(uploadMyProfilePhoto).mockResolvedValue(account);
});

it("shows the name saved in Rally's database, like Home does", async () => {
  await render(<Profile />);

  expect(screen.getByText("Sam Lee")).toBeOnTheScreen();
  expect(screen.queryByText("Old Firebase name")).not.toBeOnTheScreen();
});

it("opens settings from the gear button", async () => {
  await render(<Profile />);
  await userEvent.press(screen.getByRole("button", { name: "Open settings" }));

  expect(router.push).toHaveBeenCalledWith("/settings");
});

it("does not show bio or profile editing controls", async () => {
  await render(<Profile />);

  expect(screen.getByText("Outside hitter • Sunbirds")).toBeOnTheScreen();
  expect(screen.queryByText("Beach volleyball player")).not.toBeOnTheScreen();
  expect(screen.queryByRole("button", { name: "Edit profile" })).not.toBeOnTheScreen();
});

it("offers an inline profile photo picker", async () => {
  await render(<Profile />);

  expect(screen.getByRole("button", { name: "Change profile photo" })).toBeOnTheScreen();
});

it("uploads a selected profile photo immediately", async () => {
  const ImagePicker = require("expo-image-picker");
  const photoAccount = { ...account, profilePhotoUrl: null };
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({
    canceled: false,
    assets: [{ uri: "blob:avatar", mimeType: "image/png", fileSize: 128 }],
  });
  jest.mocked(uploadMyProfilePhoto).mockResolvedValue(photoAccount);
  const setAccount = jest.fn();
  jest.mocked(useSession).mockReturnValue(fakeSession({ user, account, setAccount }));
  await render(<Profile />);

  await userEvent.press(screen.getByRole("button", { name: "Change profile photo" }));
  expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(expect.objectContaining({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
  }));

  expect(uploadMyProfilePhoto).toHaveBeenCalledWith(user, { uri: "blob:avatar", mimeType: "image/png" });
  expect(setAccount).toHaveBeenCalledWith(photoAccount);
});

it("rejects a selected photo larger than 5 MB", async () => {
  const ImagePicker = require("expo-image-picker");
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({
    canceled: false,
    assets: [{ uri: "blob:large", mimeType: "image/png", fileSize: 5 * 1024 * 1024 + 1 }],
  });
  await render(<Profile />);
  await userEvent.press(screen.getByRole("button", { name: "Change profile photo" }));

  expect(screen.getByText("Choose a photo smaller than 5 MB.")).toBeOnTheScreen();
});

it("rejects unsupported selected photo types", async () => {
  const ImagePicker = require("expo-image-picker");
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({
    canceled: false,
    assets: [{ uri: "blob:gif", mimeType: "image/gif", fileSize: 128 }],
  });
  await render(<Profile />);
  await userEvent.press(screen.getByRole("button", { name: "Change profile photo" }));

  expect(screen.getByText("Use a JPEG, PNG, or WebP image.")).toBeOnTheScreen();
});

it("shows an upload error", async () => {
  const ImagePicker = require("expo-image-picker");
  jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({
    canceled: false,
    assets: [{ uri: "blob:avatar", mimeType: "image/png", fileSize: 128 }],
  });
  jest.mocked(uploadMyProfilePhoto).mockRejectedValueOnce(new Error("Upload failed"));
  await render(<Profile />);
  await userEvent.press(screen.getByRole("button", { name: "Change profile photo" }));

  expect(await screen.findByText("Something went wrong. Please try again.")).toBeOnTheScreen();
});

it("offers update and remove actions for an existing profile photo", async () => {
  const photoAccount = { ...account, profilePhotoUrl: "https://signed.example/avatar.png" };
  const setAccount = jest.fn();
  jest.mocked(useSession).mockReturnValue(fakeSession({ user, account: photoAccount, setAccount }));
  jest.mocked(removeMyProfilePhoto).mockResolvedValue({ ...photoAccount, profilePhotoUrl: null });
  await render(<Profile />);

  await userEvent.press(screen.getByRole("button", { name: "Profile photo options" }));
  expect(screen.getByRole("button", { name: "Update photo" })).toBeOnTheScreen();
  await userEvent.press(screen.getByRole("button", { name: "Remove photo" }));

  await waitFor(() => expect(removeMyProfilePhoto).toHaveBeenCalledWith(user));
  expect(setAccount).toHaveBeenCalledWith({ ...photoAccount, profilePhotoUrl: null });
  expect(screen.queryByRole("button", { name: "Update photo" })).not.toBeOnTheScreen();
});

it("opens the photo picker from the update action", async () => {
  const ImagePicker = require("expo-image-picker");
  const photoAccount = { ...account, profilePhotoUrl: "https://signed.example/avatar.png" };
  jest.mocked(useSession).mockReturnValue(fakeSession({ user, account: photoAccount }));
  await render(<Profile />);

  await userEvent.press(screen.getByRole("button", { name: "Profile photo options" }));
  await userEvent.press(screen.getByRole("button", { name: "Update photo" }));

  expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
});

it("keeps the photo actions available and shows an error when removal fails", async () => {
  const photoAccount = { ...account, profilePhotoUrl: "https://signed.example/avatar.png" };
  jest.mocked(useSession).mockReturnValue(fakeSession({ user, account: photoAccount }));
  jest.mocked(removeMyProfilePhoto).mockRejectedValueOnce(new Error("Remove failed"));
  await render(<Profile />);

  await userEvent.press(screen.getByRole("button", { name: "Profile photo options" }));
  await userEvent.press(screen.getByRole("button", { name: "Remove photo" }));

  expect(await screen.findByText("Something went wrong. Please try again.")).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Update photo" })).toBeOnTheScreen();
});

it("shows badges saved on the Rally account", async () => {
  await render(<Profile />);

  expect(screen.getByLabelText("Champion badge")).toBeOnTheScreen();
  expect(screen.getByLabelText("Winner badge")).toBeOnTheScreen();
  expect(screen.getByLabelText("Podium badge")).toBeOnTheScreen();
  expect(screen.getByLabelText("Competitor badge")).toBeOnTheScreen();
  expect(screen.getByText("Champion")).toBeOnTheScreen();
  expect(screen.getByText("Winner")).toBeOnTheScreen();
  expect(screen.getByText("Podium")).toBeOnTheScreen();
  expect(screen.getByText("Competitor")).toBeOnTheScreen();
});

it("places badges in a horizontal scroll area", async () => {
  await render(<Profile />);

  expect(screen.getByLabelText("Scrollable awards")).toBeOnTheScreen();
});

it("uses the badge tier color for each image border", async () => {
  await render(<Profile />);

  expect(screen.getByLabelText("Champion badge image").props.style).toEqual(
    expect.arrayContaining([expect.objectContaining({ borderColor: "#d4a72c" })]),
  );
  expect(screen.getByLabelText("Podium badge image").props.style).toEqual(
    expect.arrayContaining([expect.objectContaining({ borderColor: "#d4a72c" })]),
  );
  expect(screen.getByLabelText("Competitor badge image").props.style).toEqual(
    expect.arrayContaining([expect.objectContaining({ borderColor: "#8c5a3c" })]),
  );
});

it("shows stars around gold badges only", async () => {
  await render(<Profile />);

  expect(screen.getAllByText("✦")).toHaveLength(12);
});

it("shows Gold styling for badges with more than twenty receipts", async () => {
  await render(<Profile />);

  expect(screen.getByLabelText("Champion badge image").props.style).toEqual(
    expect.arrayContaining([expect.objectContaining({ borderColor: "#d4a72c" })]),
  );
  expect(screen.getByLabelText("Winner badge image").props.style).toEqual(
    expect.arrayContaining([expect.objectContaining({ borderColor: "#d4a72c" })]),
  );
  expect(screen.getByLabelText("Podium badge image").props.style).toEqual(
    expect.arrayContaining([expect.objectContaining({ borderColor: "#d4a72c" })]),
  );
});

it("shows badge details when a badge is pressed", async () => {
  await render(<Profile />);
  await userEvent.press(screen.getByRole("button", { name: "Champion badge" }));

  expect(screen.getByText("Placeholder championship badge")).toBeOnTheScreen();
  expect(screen.getByText(/gold tier/i)).toBeOnTheScreen();
  expect(screen.getByRole("button", { name: "Close badge details" })).toBeOnTheScreen();

  await userEvent.press(screen.getByRole("button", { name: "Close badge details" }));
  expect(screen.queryByText("Placeholder championship badge")).not.toBeOnTheScreen();
});

it("goes back Home from the Home tab", async () => {
  await render(<Profile />);
  await userEvent.press(screen.getByRole("button", { name: "Home" }));

  expect(router.replace).toHaveBeenCalledWith("/home");
});

it("ignores the tabs that aren't built yet", async () => {
  await render(<Profile />);
  await userEvent.press(screen.getByRole("button", { name: "Events" }));

  expect(router.replace).not.toHaveBeenCalled();
  expect(router.push).not.toHaveBeenCalled();
});
