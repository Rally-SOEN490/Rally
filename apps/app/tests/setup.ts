// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Modal, ScrollView } from "react-native";

// React Native exports these through lazy getters. Resolve the preset's mocks
// during setup so their cold Babel transforms do not consume the first render's
// test timeout on CI. Keep the real preset implementations and test timeouts.
void [Modal, ScrollView];

// The screens show messages with the browser's alert(), which doesn't exist in tests.
globalThis.alert = jest.fn();
