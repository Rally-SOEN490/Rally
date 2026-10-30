// Copyright (c) 2026 Rally. All rights reserved.

import { render, screen } from "@testing-library/react-native";
import type { User } from "firebase/auth";
import Home from "@/app/(tabs)/home";
import { useSession } from "@/lib/session";
import { fakeSession } from "../fake-session";

jest.mock("@/lib/session", () => ({ useSession: jest.fn() }));

const user = { email: "sam@example.com", emailVerified: true } as User;
const account = {
  id: "1",
  displayName: "Sam Lee",
  lookingForTeam: false,
  createdAt: "2026-10-17T12:00:00.000Z",
  badges: [],
};

beforeEach(() => {
  jest.mocked(useSession).mockReturnValue(fakeSession({ user, account }));
});

it("greets the user with the name saved in Rally's database", async () => {
  await render(<Home />);

  expect(screen.getByText("Welcome back,")).toBeOnTheScreen();
  expect(screen.getByText("Sam Lee")).toBeOnTheScreen();
  const memberSince = new Date(account.createdAt).toLocaleDateString();
  expect(screen.getByText(`Member since ${memberSince}`)).toBeOnTheScreen();
});

it("shows the page sections", async () => {
  await render(<Home />);

  expect(screen.getByText("Upcoming Match")).toBeOnTheScreen();
  expect(screen.getByText("Sponsored Tournaments")).toBeOnTheScreen();
  expect(screen.getByText("Team Recruiting Near You")).toBeOnTheScreen();
  expect(screen.getByText("Latest Announcements")).toBeOnTheScreen();
});

it("leaves out the member line if the account isn't there", async () => {
  jest.mocked(useSession).mockReturnValue(fakeSession({ user, account: undefined }));
  await render(<Home />);

  expect(screen.queryByText(/Member since/)).not.toBeOnTheScreen();
});
