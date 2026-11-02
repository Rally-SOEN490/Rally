// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

// Remembers that the account was just deleted, so Sign up can say so after
// Settings logs the person out and moves them there. It's kept here rather
// than in the URL so it isn't lost if a guard in _layout.tsx redirects first.
let justDeleted = false;

export const markAccountDeleted = () => {
  justDeleted = true;
};

export const wasAccountJustDeleted = () => justDeleted;

export const clearAccountDeleted = () => {
  justDeleted = false;
};
