// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { apiErrorMessage, removeMyProfilePhoto, uploadMyProfilePhoto } from "@/lib/api";
import type { Session } from "@/lib/session";

const maxPhotoBytes = 5 * 1024 * 1024;
const photoTypes = ["image/jpeg", "image/png", "image/webp"];

type PickedPhoto = { uri: string; mimeType: string | null } | { error: string } | null;

// Opens the photo library. Returns the chosen photo, an error message when the
// photo is too big or the wrong type, or null when the person cancels.
const pickPhoto = async (): Promise<PickedPhoto> => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  });
  if (result.canceled) return null;

  const asset = result.assets[0];
  if (asset.fileSize && asset.fileSize > maxPhotoBytes)
    return { error: "Choose a photo smaller than 5 MB." };
  if (asset.mimeType && !photoTypes.includes(asset.mimeType))
    return { error: "Use a JPEG, PNG, or WebP image." };
  return { uri: asset.uri, mimeType: asset.mimeType ?? null };
};

// Choosing, replacing and removing the profile photo.
export function useProfilePhoto({ user, setAccount }: Session) {
  const [actionsVisible, setActionsVisible] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const choose = async () => {
    if (!user || saving) return;
    setActionsVisible(false);
    setError("");
    setSaving(true);
    try {
      const photo = await pickPhoto();
      if (!photo) return;
      if ("error" in photo) return setError(photo.error);
      setAccount(await uploadMyProfilePhoto(user, photo));
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!user || saving) return;
    setError("");
    setSaving(true);
    try {
      setAccount(await removeMyProfilePhoto(user));
      setActionsVisible(false);
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  };

  return { actionsVisible, setActionsVisible, error, saving, choose, remove };
}
