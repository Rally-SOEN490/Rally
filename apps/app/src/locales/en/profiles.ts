// Copyright (c) 2026 Rally contributors
// SPDX-License-Identifier: MIT

// Keep feature copy outside screens so it can join the app's future i18next setup.
export const profileText = {
  privacyTitle: "Profile privacy",
  privacyIntro:
    "Choose which parts of your profile other signed-in players can see.",
  visibilityLabel: "Let players view my profile",
  visibilityDetail:
    "When enabled, signed-in players can see your name and the sections you choose below.",
  privateNotice:
    "After saving with viewing off, other players can’t open your profile.",
  sectionsTitle: "Shared sections",
  sectionsDetail:
    "These choices apply when your profile is visible. Empty sections stay empty until you add details to your profile.",
  sections: {
    showPhoto: "Profile photo",
    showBio: "Bio",
    showStatus: "Status message",
    showInterests: "Interests",
    showSocialLinks: "Social links",
    showBadges: "Awards",
    showMemberSince: "Member since",
  },
  playerTitle: "Player profile",
  preview: "Preview shared profile",
  managePrivacy: "Manage profile privacy",
  unavailableTitle: "Profile unavailable",
  unavailable:
    "This player may have made their profile private, or the profile no longer exists.",
  noDetails: "This player hasn’t shared additional details.",
  bioTitle: "About",
  statusTitle: "Status",
  interestsTitle: "Interested in",
  socialsTitle: "Connect",
  memberSince: "Member since",
  facebook: "Facebook",
  instagram: "Instagram",
  awardsTitle: "Awards",
  scrollAwards: "Scrollable awards",
  closeBadge: "Close badge details",
  close: "Close",
  noAwards: "No awards to show yet.",
  openSocialFailed: "We couldn’t open this link. Please try again.",
  badgeLabel: (name: string) => `${name} badge`,
  badgeImageLabel: (name: string) => `${name} badge image`,
  badgeTier: (tier: string) => `${tier} tier`,
  loading: "Loading…",
  save: "Save preferences",
  saving: "Saving…",
  saved: "Your privacy preferences have been saved.",
  retry: "Try again",
  back: "Back to my profile",
  settingsLink: "Profile privacy",
  settingsDetail: "Choose what players can see",
};
