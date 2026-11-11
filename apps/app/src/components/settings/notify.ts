// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Alert, Platform } from "react-native";

// Shows a simple message. On the web, Alert has no buttons, so use the browser's alert.
export const notify = (title: string, message: string) => {
  if (Platform.OS === "web") window.alert(`${title}\n\n${message}`);
  else Alert.alert(title, message);
};
