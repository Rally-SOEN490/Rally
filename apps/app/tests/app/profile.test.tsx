// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { act, fireEvent, render, screen, userEvent, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import type { User } from "firebase/auth";
import { useState } from "react";
import Profile from "@/app/profile";
import { ApiError, updateMyAccount, type RallyUser } from "@/lib/api";
import { removeMyProfilePhoto, uploadMyProfilePhoto } from "@/lib/api";
import { useSession } from "@/lib/session";
import { fakeSession } from "../fake-session";

jest.mock("expo-router", () => ({ router: { push: jest.fn(), replace: jest.fn() } }));
jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: null }),
}));
jest.mock("expo-linking", () => ({ openURL: jest.fn() }));
jest.mock("@/lib/session", () => ({ useSession: jest.fn() }));
jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  removeMyProfilePhoto: jest.fn(),
  updateMyAccount: jest.fn(),
  uploadMyProfilePhoto: jest.fn(),
}));

const user = { email: "sam@example.com", displayName: "Old Firebase name" } as User;
const account = {
  id: "1",
  displayName: "Sam Lee",
  profilePhotoUrl: null,
  lookingForTeam: false,
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
    {
      key: "defender",
      name: "Defender",
      tier: "Bronze",
      description: "Placeholder defensive effort medal",
      imageUrl: null,
      image: "badge-gold-placeholder",
      receivedCount: 16,
      awardedAt: "2026-10-17T12:00:00.000Z",
    },
  ],
};

beforeEach(() => {
  jest.mocked(useSession).mockReturnValue(fakeSession({ user, account }));
  jest.mocked(removeMyProfilePhoto).mockResolvedValue({ ...account, profilePhotoUrl: null });
  jest.mocked(uploadMyProfilePhoto).mockResolvedValue(account);
  jest.mocked(updateMyAccount).mockResolvedValue(account);
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

it("opens settings when Facebook is not connected", async () => {
  await render(<Profile />);
  await userEvent.press(screen.getByRole("button", { name: "Facebook (not connected)" }));

  expect(router.push).toHaveBeenCalledWith("/settings");
});

it("opens a connected Facebook profile", async () => {
  const { openURL } = jest.requireMock("expo-linking") as { openURL: jest.Mock };
  const facebookUrl = "https://facebook.com/sam";
  jest.mocked(useSession).mockReturnValue(
    fakeSession({ user, account: { ...account, facebookUrl } }),
  );
  openURL.mockResolvedValue(undefined);

  await render(<Profile />);
  await userEvent.press(screen.getByRole("link", { name: "Facebook profile" }));

  expect(openURL).toHaveBeenCalledWith(facebookUrl);
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

it("caps the awards section at four badges without horizontal scrolling", async () => {
  await render(<Profile />);

  expect(screen.getByLabelText("Awards")).toBeOnTheScreen();
  expect(screen.queryByLabelText("Scrollable awards")).not.toBeOnTheScreen();
  expect(screen.getAllByRole("button", { name: /badge$/ })).toHaveLength(4);
  expect(screen.queryByLabelText("Defender badge")).not.toBeOnTheScreen();
});

it("opens the awards page from View more", async () => {
  await render(<Profile />);
  await userEvent.press(screen.getByRole("button", { name: "View more awards" }));

  expect(router.push).toHaveBeenCalledWith("/awards");
});

it("shows progress for each badge", async () => {
  await render(<Profile />);

  expect(screen.getByLabelText("Champion progress")).toBeOnTheScreen();
  expect(screen.getByText("25/30")).toBeOnTheScreen();
  expect(screen.getByLabelText("Competitor progress")).toBeOnTheScreen();
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

describe("Profile thought", () => {
  const showAccount = (initial: RallyUser) =>
    jest.mocked(useSession).mockImplementation(function useFakeSession() {
      const [shown, setShown] = useState(initial);
      return fakeSession({ user, account: shown, setAccount: setShown });
    });

  it("opens the composer and rejects an empty message", async () => {
    showAccount(account);
    await render(<Profile />);

    await userEvent.press(screen.getByRole("button", { name: "Add a thought" }));
    expect(screen.getByText("Share a thought")).toBeOnTheScreen();
    expect(screen.getByText("0/180")).toBeOnTheScreen();

    await userEvent.press(screen.getByRole("button", { name: "Share thought" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Write a thought before sharing.");
    expect(updateMyAccount).not.toHaveBeenCalled();
  });

  it("closes the composer and opens profile photo selection", async () => {
    showAccount(account);
    const ImagePicker = require("expo-image-picker");
    await render(<Profile />);

    await userEvent.press(screen.getByRole("button", { name: "Add a thought" }));
    await userEvent.press(screen.getByRole("button", { name: "Close thought editor" }));
    expect(screen.queryByText("Share a thought")).not.toBeOnTheScreen();

    await userEvent.press(screen.getByRole("button", { name: "Change profile photo" }));
    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalled();
  });

  it("saves a message and shows it on the profile", async () => {
    showAccount(account);
    const saved = { ...account, thoughtText: "Ready for the next rally." };
    jest.mocked(updateMyAccount).mockResolvedValueOnce(saved);
    await render(<Profile />);

    await userEvent.press(screen.getByRole("button", { name: "Add a thought" }));
    fireEvent.changeText(screen.getByLabelText("Thought"), "  Ready for the next rally.  ");
    await userEvent.press(screen.getByRole("button", { name: "Share thought" }));

    await waitFor(() => expect(screen.getByText("Ready for the next rally.")).toBeOnTheScreen());
    expect(updateMyAccount).toHaveBeenCalledWith(user, {
      thoughtText: "Ready for the next rally.",
    });
    expect(screen.getByRole("button", { name: "Edit thought" })).toBeOnTheScreen();
  });

  it("keeps Enter as a newline in the thought editor", async () => {
    showAccount(account);
    const saved = { ...account, thoughtText: "First line.\nSecond line." };
    jest.mocked(updateMyAccount).mockResolvedValueOnce(saved);
    await render(<Profile />);

    await userEvent.press(screen.getByRole("button", { name: "Add a thought" }));
    const input = screen.getByLabelText("Thought");
    expect(input.props.submitBehavior).toBe("newline");

    fireEvent.changeText(input, "First line.\nSecond line.");
    await userEvent.press(screen.getByRole("button", { name: "Share thought" }));

    await waitFor(() =>
      expect(updateMyAccount).toHaveBeenCalledWith(user, {
        thoughtText: "First line.\nSecond line.",
      }),
    );
  });

  it("shows a server error when saving fails", async () => {
    showAccount(account);
    jest.mocked(updateMyAccount).mockRejectedValueOnce(
      new ApiError(0, "Can't reach the Rally server."),
    );
    await render(<Profile />);

    await userEvent.press(screen.getByRole("button", { name: "Add a thought" }));
    fireEvent.changeText(screen.getByLabelText("Thought"), "A thought worth sharing.");
    await userEvent.press(screen.getByRole("button", { name: "Share thought" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Can't reach the Rally server.");
    expect(screen.getByText("Share a thought")).toBeOnTheScreen();
  });

  it("deletes an existing message", async () => {
    showAccount({ ...account, thoughtText: "Old message" });
    jest.mocked(updateMyAccount).mockResolvedValueOnce({ ...account, thoughtText: null });
    await render(<Profile />);

    await userEvent.press(screen.getByRole("button", { name: "Edit thought" }));
    await userEvent.press(screen.getByRole("button", { name: "Delete thought" }));

    await waitFor(() => expect(screen.queryByText("Old message")).not.toBeOnTheScreen());
    expect(updateMyAccount).toHaveBeenCalledWith(user, { thoughtText: null });
    expect(screen.getByRole("button", { name: "Add a thought" })).toBeOnTheScreen();
  });

  it("shows an error when deleting a message fails", async () => {
    showAccount({ ...account, thoughtText: "Old message" });
    jest.mocked(updateMyAccount).mockRejectedValueOnce(
      new ApiError(0, "Can't reach the Rally server."),
    );
    await render(<Profile />);

    await userEvent.press(screen.getByRole("button", { name: "Edit thought" }));
    await userEvent.press(screen.getByRole("button", { name: "Delete thought" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Can't reach the Rally server.");
    expect(screen.getByText("Edit your thought")).toBeOnTheScreen();
  });
});

describe("Looking for a team", () => {
  // Like the real session, setAccount re-renders the screen.
  const showAccount = (initial: RallyUser) =>
    jest.mocked(useSession).mockImplementation(function useFakeSession() {
      const [shown, setShown] = useState(initial);
      return fakeSession({ user, account: shown, setAccount: setShown });
    });

  const toggle = () => screen.getByRole("switch", { name: "Looking for a team" });
  const badge = () => screen.queryByTestId("looking-for-team-badge");
  // Resolves once saving has finished.
  const flip = (value: boolean) => fireEvent(toggle(), "valueChange", value);

  const holdSave = () => {
    let finish!: (saved: RallyUser) => void;
    jest
      .mocked(updateMyAccount)
      .mockReturnValueOnce(new Promise<RallyUser>((resolve) => (finish = resolve)));
    return finish;
  };

  it("is off, with no badge, when it was saved off", async () => {
    showAccount(account);
    await render(<Profile />);

    expect(toggle().props.value).toBe(false);
    expect(badge()).not.toBeOnTheScreen();
  });

  it("is on, with a badge, when it was saved on", async () => {
    showAccount({ ...account, lookingForTeam: true });
    await render(<Profile />);

    expect(toggle().props.value).toBe(true);
    expect(badge()).toBeOnTheScreen();
  });

  it("shows it's saving, then shows the badge once the server confirms", async () => {
    showAccount(account);
    const finishSaving = holdSave();
    await render(<Profile />);

    const flipped = flip(true);

    await waitFor(() => expect(screen.getByLabelText("Saving")).toBeOnTheScreen());
    expect(updateMyAccount).toHaveBeenCalledWith(user, { lookingForTeam: true });
    expect(toggle().props.value).toBe(true);
    expect(toggle()).toBeDisabled();
    expect(toggle()).toBeBusy();
    expect(badge()).not.toBeOnTheScreen();

    await act(async () => {
      finishSaving({ ...account, lookingForTeam: true });
      await flipped;
    });

    await waitFor(() => expect(badge()).toBeOnTheScreen());
    expect(toggle().props.value).toBe(true);
    expect(toggle()).toBeEnabled();
    expect(screen.queryByLabelText("Saving")).not.toBeOnTheScreen();
  });

  it("hides the badge when turned off", async () => {
    showAccount({ ...account, lookingForTeam: true });
    jest.mocked(updateMyAccount).mockResolvedValueOnce(account);
    await render(<Profile />);

    await flip(false);

    await waitFor(() => expect(badge()).not.toBeOnTheScreen());
    expect(updateMyAccount).toHaveBeenCalledWith(user, { lookingForTeam: false });
    expect(toggle().props.value).toBe(false);
  });

  it("goes back and explains when saving fails, and can try again", async () => {
    showAccount(account);
    jest
      .mocked(updateMyAccount)
      .mockRejectedValueOnce(new ApiError(0, "Can't reach the Rally server."))
      .mockResolvedValueOnce({ ...account, lookingForTeam: true });
    await render(<Profile />);

    await flip(true);

    expect(await screen.findByRole("alert")).toHaveTextContent("Can't reach the Rally server.");
    expect(toggle().props.value).toBe(false);
    expect(toggle()).toBeEnabled();
    expect(badge()).not.toBeOnTheScreen();

    await flip(true);

    await waitFor(() => expect(badge()).toBeOnTheScreen());
    expect(toggle().props.value).toBe(true);
    expect(screen.queryByRole("alert")).not.toBeOnTheScreen();
  });
});

describe("Profile interests", () => {
  const showAccount = (initial: RallyUser) =>
    jest.mocked(useSession).mockImplementation(function useFakeSession() {
      const [shown, setShown] = useState(initial);
      return fakeSession({ user, account: shown, setAccount: setShown });
    });

  it("shows saved formats and positions as selected", async () => {
    showAccount({
      ...account,
      interests: {
        formats: ["indoor-6s"],
        positions: ["setter"],
      },
    });
    await render(<Profile />);

    expect(screen.getByRole("button", { name: "Indoor 6s selected" }).props.accessibilityState)
      .toEqual(expect.objectContaining({ selected: true }));
    expect(screen.getByRole("button", { name: "Setter selected" }).props.accessibilityState)
      .toEqual(expect.objectContaining({ selected: true }));
    expect(screen.getByRole("button", { name: "Beach 2s" }).props.accessibilityState)
      .toEqual(expect.objectContaining({ selected: false }));
  });

  it("saves selected and deselected interests", async () => {
    showAccount({ ...account, interests: { formats: [], positions: [] } });
    jest.mocked(updateMyAccount)
      .mockResolvedValueOnce({
        ...account,
        interests: { formats: ["beach-2s"], positions: [] },
      })
      .mockResolvedValueOnce({
        ...account,
        interests: { formats: [], positions: [] },
      });
    await render(<Profile />);

    await userEvent.press(screen.getByRole("button", { name: "Beach 2s" }));
    await waitFor(() =>
      expect(updateMyAccount).toHaveBeenCalledWith(user, {
        interests: { formats: ["beach-2s"], positions: [] },
      }),
    );
    expect(screen.getByRole("button", { name: "Beach 2s selected" })).toBeOnTheScreen();

    await userEvent.press(screen.getByRole("button", { name: "Beach 2s selected" }));
    await waitFor(() =>
      expect(updateMyAccount).toHaveBeenLastCalledWith(user, {
        interests: { formats: [], positions: [] },
      }),
    );
    expect(screen.getByRole("button", { name: "Beach 2s" })).toBeOnTheScreen();
  });

  it("restores the previous selection and shows an error when saving fails", async () => {
    showAccount({ ...account, interests: { formats: [], positions: [] } });
    jest.mocked(updateMyAccount).mockRejectedValueOnce(
      new ApiError(0, "Can't reach the Rally server."),
    );
    await render(<Profile />);

    await userEvent.press(screen.getByRole("button", { name: "Libero" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Can't reach the Rally server.");
    expect(screen.getByRole("button", { name: "Libero" })).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Libero" }).props.accessibilityState)
      .toEqual(expect.objectContaining({ selected: false }));
  });
});
