// Copyright (c) 2026 Rally. All rights reserved.

import { render, screen, userEvent, waitFor } from "@testing-library/react-native";
import { sendEmailVerification, signOut, type User } from "firebase/auth";
import VerifyEmail from "@/app/verify-email";
import { auth } from "@/lib/firebase";
import { useSession } from "@/lib/session";
import { fakeSession } from "../fake-session";

jest.mock("firebase/auth", () => ({
  sendEmailVerification: jest.fn(),
  signOut: jest.fn(),
}));
jest.mock("@/lib/firebase", () => ({ auth: { currentUser: null } }));
jest.mock("@/lib/session", () => ({ useSession: jest.fn() }));

const user = { email: "sam@example.com", emailVerified: false } as User;
const refresh = jest.fn();

const renderVerifyEmail = (signedInUser: User | null = user) => {
  jest.mocked(useSession).mockReturnValue(fakeSession({ user: signedInUser, refresh }));
  return render(<VerifyEmail />);
};

beforeEach(() => {
  Object.assign(auth, { currentUser: user });
  refresh.mockResolvedValue(undefined);
});

it("tells the user where the link was sent", async () => {
  await renderVerifyEmail();
  expect(
    screen.getByText("We sent a link to sam@example.com. Click it, then come back here."),
  ).toBeOnTheScreen();
});

describe("I've verified my email", () => {
  const pressCheck = () =>
    userEvent.press(screen.getByRole("button", { name: "I've verified my email" }));

  it("says so when the link hasn't been clicked yet", async () => {
    await renderVerifyEmail();
    await pressCheck();

    expect(refresh).toHaveBeenCalled();
    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith(
        "Your email isn't verified yet. Click the link in the email we sent you.",
      ),
    );
  });

  it("shows no message once the email is verified", async () => {
    refresh.mockImplementation(async () => {
      Object.assign(auth, { currentUser: { ...user, emailVerified: true } });
    });
    await renderVerifyEmail();
    await pressCheck();

    expect(refresh).toHaveBeenCalled();
    expect(alert).not.toHaveBeenCalled();
  });

  it("shows a friendly message when Firebase can't be reached", async () => {
    refresh.mockRejectedValue({ code: "auth/network-request-failed" });
    await renderVerifyEmail();
    await pressCheck();

    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith(
        "Can't reach the server. Check your internet connection and try again.",
      ),
    );
  });
});

describe("Resend email", () => {
  const pressResend = () => userEvent.press(screen.getByRole("button", { name: "Resend email" }));

  it("sends a new verification email", async () => {
    jest.mocked(sendEmailVerification).mockResolvedValue();
    await renderVerifyEmail();
    await pressResend();

    expect(sendEmailVerification).toHaveBeenCalledWith(user);
    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith("We sent you a new verification email."),
    );
  });

  it("shows a friendly message when too many emails were sent", async () => {
    jest.mocked(sendEmailVerification).mockRejectedValue({ code: "auth/too-many-requests" });
    await renderVerifyEmail();
    await pressResend();

    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith(
        "Too many attempts. Please wait a few minutes and try again.",
      ),
    );
  });

  it("does nothing if the user has just been signed out", async () => {
    await renderVerifyEmail(null);
    await pressResend();

    expect(sendEmailVerification).not.toHaveBeenCalled();
  });
});

it("logs the user out", async () => {
  jest.mocked(signOut).mockResolvedValue();
  await renderVerifyEmail();
  await userEvent.press(screen.getByText("Log out"));

  expect(signOut).toHaveBeenCalledWith(auth);
});
