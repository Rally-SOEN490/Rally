// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

import { Link } from "expo-router";

// Reuse on roster, search and free-agent entries when those features exist.
export function PlayerProfileLink({
  id,
  label,
}: {
  id: string;
  label: string;
}) {
  return (
    <Link
      href={{ pathname: "/players/[id]", params: { id } }}
      style={{
        color: "#1d5c4d",
        fontSize: 15,
        fontWeight: "600",
        paddingVertical: 10,
      }}
    >
      {label}
    </Link>
  );
}
