// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { render, screen, userEvent } from "@testing-library/react-native";
import { renderRouter } from "expo-router/testing-library";
import { useState } from "react";
import { Text } from "react-native";
import {
  AuthScreen,
  Button,
  Checkbox,
  Field,
  Footer,
  SocialLogin,
} from "@/components/auth";

describe("AuthScreen", () => {
  it("shows the title, greeting and subtitle", async () => {
    await render(
      <AuthScreen greeting="Welcome back" title="Log in" subtitle="Nice to see you">
        <Text>Form goes here</Text>
      </AuthScreen>,
    );
    expect(screen.getByText("Welcome back")).toBeOnTheScreen();
    expect(screen.getByText("Log in")).toBeOnTheScreen();
    expect(screen.getByText("Nice to see you")).toBeOnTheScreen();
    expect(screen.getByText("Form goes here")).toBeOnTheScreen();
  });

  it("leaves out the greeting and subtitle when not given", async () => {
    await render(
      <AuthScreen title="Log in">
        <Text>Form goes here</Text>
      </AuthScreen>,
    );
    expect(screen.queryByText("Welcome back")).not.toBeOnTheScreen();
    expect(screen.queryByText("Nice to see you")).not.toBeOnTheScreen();
  });
});

describe("Field", () => {
  it("passes typed text to onChangeText and shows the right-hand element", async () => {
    const onChangeText = jest.fn();
    await render(
      <Field
        icon="mail"
        placeholder="E-mail address"
        onChangeText={onChangeText}
        right={<Text>Forgot?</Text>}
      />,
    );
    await userEvent.type(screen.getByPlaceholderText("E-mail address"), "hi");
    expect(onChangeText).toHaveBeenLastCalledWith("hi");
    expect(screen.getByText("Forgot?")).toBeOnTheScreen();
  });
});

describe("Button", () => {
  it("calls onPress when pressed", async () => {
    const onPress = jest.fn();
    await render(<Button title="Log in" onPress={onPress} />);
    await userEvent.press(screen.getByRole("button", { name: "Log in" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe("Checkbox", () => {
  const AgeCheckbox = () => {
    const [checked, setChecked] = useState(false);
    return <Checkbox checked={checked} onChange={setChecked} label="I am 14 or older" />;
  };

  it("toggles between ticked and unticked when pressed", async () => {
    await render(<AgeCheckbox />);
    const checkbox = screen.getByRole("checkbox", { name: "I am 14 or older" });
    expect(checkbox).not.toBeChecked();

    await userEvent.press(checkbox);
    expect(checkbox).toBeChecked();

    await userEvent.press(checkbox);
    expect(checkbox).not.toBeChecked();
  });
});

describe("SocialLogin", () => {
  it("shows the Google option", async () => {
    await render(<SocialLogin />);
    expect(screen.getByText("or continue with")).toBeOnTheScreen();
    expect(screen.getByText("G")).toBeOnTheScreen();
  });
});

describe("Footer", () => {
  it("links to another screen", async () => {
    await renderRouter(
      {
        index: () => <Footer text="New to Rally?" label="Sign up" href="/sign-up" />,
        "sign-up": () => <Text>Sign up screen</Text>,
      },
      { initialUrl: "/" },
    );
    expect(screen.getByText("New to Rally?", { exact: false })).toBeOnTheScreen();

    await userEvent.press(screen.getByText("Sign up"));
    expect(await screen.findByText("Sign up screen")).toBeOnTheScreen();
  });
});
