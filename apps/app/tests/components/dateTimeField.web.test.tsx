// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { act, create } from "react-test-renderer";
import { DateTimeField } from "@/components/tournaments/dateTimeField.web";

// The web version renders the browser's own <input type="date"> or "time".
const renderInput = async (props: Partial<Parameters<typeof DateTimeField>[0]> = {}) => {
  const onChange = jest.fn();
  let renderer!: ReturnType<typeof create>;
  await act(async () => {
    renderer = create(
      <DateTimeField
        mode="date"
        value={null}
        onChange={onChange}
        accessibilityLabel="Starts date"
        {...props}
      />,
    );
  });
  return { input: renderer.root.findByType("input"), onChange };
};

it("uses the browser's date input with its label", async () => {
  const { input } = await renderInput({ value: "2027-11-15" });

  expect(input.props).toMatchObject({
    type: "date",
    value: "2027-11-15",
    "aria-label": "Starts date",
  });
});

it("uses the browser's time input for times, empty when not set", async () => {
  const { input } = await renderInput({ mode: "time" });

  expect(input.props).toMatchObject({ type: "time", value: "" });
});

it.each([
  ["date", "2027-11-15", "2027-12-15"],
  ["time", "09:00", "10:30"],
] as const)(
  "ignores an incomplete browser %s edit and accepts the completed value",
  async (mode, initial, completed) => {
    const { input, onChange } = await renderInput({ mode, value: initial });

    input.props.onChange({ target: { value: "" } });
    expect(onChange).not.toHaveBeenCalled();

    input.props.onChange({ target: { value: completed } });
    expect(onChange.mock.calls).toEqual([[completed]]);
  },
);
