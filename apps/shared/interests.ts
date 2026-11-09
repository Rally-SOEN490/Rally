// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

export const interestCatalog = {
  formats: [
    { key: "indoor-6s", label: "Indoor 6s", visible: true },
    { key: "beach-2s", label: "Beach 2s", visible: true },
    { key: "9-man", label: "9-man", visible: true },
    { key: "indoor-4s", label: "Indoor 4s", visible: true },
    { key: "beach-4s", label: "Beach 4s", visible: true },
    { key: "grass-4s", label: "Grass 4s", visible: true },
  ],
  positions: [
    { key: "libero", label: "Libero", visible: true },
    { key: "outside", label: "Outside", visible: true },
    { key: "setter", label: "Setter", visible: true },
    { key: "middle", label: "Middle", visible: true },
    { key: "opposite", label: "Opposite", visible: true },
    { key: "power", label: "Power", visible: true },
  ],
  clubs: [
    { key: "ckvc", label: "CKVC", visible: true },
    { key: "raijin", label: "RAIJIN", visible: true },
  ],
  other: [
    { key: "co-ed", label: "Co-ed", visible: true },
    { key: "tournaments", label: "Tournaments", visible: true },
    { key: "weeknight-leagues", label: "Weeknight leagues", visible: true },
    { key: "open-gym", label: "Open gym", visible: true },
    { key: "sub-spare", label: "Sub / spare", visible: true },
  ],
} as const;

export type InterestCategory = keyof typeof interestCatalog;
export type InterestKey = (typeof interestCatalog)[InterestCategory][number]["key"];

export const interestCategories = Object.keys(interestCatalog) as InterestCategory[];

export const visibleInterestOptions = (category: InterestCategory) =>
  interestCatalog[category].filter((option) => option.visible);

export const interestKeys = (category: InterestCategory) =>
  interestCatalog[category].map(({ key }) => key);
