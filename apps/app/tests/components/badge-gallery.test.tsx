// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import {
  fireEvent,
  render,
  screen,
  userEvent,
} from "@testing-library/react-native";
import { BadgeGallery } from "@/components/profile/BadgeGallery";
const badge = {
  key: "champion",
  name: "Champion",
  tier: "Gold",
  description: "A well-earned badge",
  imageUrl: null,
  image: "badge-gold-placeholder",
  receivedCount: 21,
  awardedAt: "2026-10-01",
};
it("closes award details using Android back and backdrop presses", async () => {
  await render(<BadgeGallery badges={[badge]} />);
  await userEvent.press(screen.getByRole("button", { name: "Champion badge" }));
  await fireEvent(screen.getByTestId("badge-modal"), "requestClose");
  expect(screen.queryByText("A well-earned badge")).not.toBeOnTheScreen();
  await userEvent.press(screen.getByRole("button", { name: "Champion badge" }));
  const stopPropagation = jest.fn();
  await fireEvent.press(screen.getByTestId("badge-details"), {
    stopPropagation,
  });
  expect(stopPropagation).toHaveBeenCalled();
  expect(screen.getByText("A well-earned badge")).toBeOnTheScreen();
  await fireEvent.press(screen.getByTestId("badge-backdrop"));
  expect(screen.queryByText("A well-earned badge")).not.toBeOnTheScreen();
});
it("handles bundled identifiers, unknown artwork and remote images", async () => {
  const { rerender } = await render(
    <BadgeGallery
      badges={[
        {
          ...badge,
          imageUrl: "badge-gold-placeholder",
          image: "unknown",
          tier: "unknown",
        },
      ]}
    />,
  );
  expect(
    screen.getByLabelText("Champion badge image").props.source,
  ).toBeTruthy();
  await rerender(
    <BadgeGallery
      badges={[{ ...badge, imageUrl: "https://images.example/badge.png" }]}
    />,
  );
  expect(screen.getByLabelText("Champion badge image").props.source).toEqual({
    uri: "https://images.example/badge.png",
  });
});
