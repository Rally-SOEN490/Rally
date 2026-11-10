// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { apiErrorMessage, updateMyAccount, type ProfileChanges } from "@/lib/api";
import type { Session } from "@/lib/session";
import { notify } from "./notify";
import { Section } from "./rows";
import { styles } from "./styles";

type SocialNetwork = {
  name: string;
  field: "instagramUrl" | "facebookUrl";
  // The update that saves this link, or removes it when given null.
  changes: (url: string | null) => ProfileChanges;
  pattern: RegExp;
  domain: string;
  icon: "logo-instagram" | "logo-facebook";
  iconColor: string;
};

const instagram: SocialNetwork = {
  name: "Instagram",
  field: "instagramUrl",
  changes: (url) => ({ instagramUrl: url }),
  pattern: /^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._-]+\/?(?:[?#].*)?$/,
  domain: "instagram.com",
  icon: "logo-instagram",
  iconColor: "#c13584",
};

const facebook: SocialNetwork = {
  name: "Facebook",
  field: "facebookUrl",
  changes: (url) => ({ facebookUrl: url }),
  pattern: /^https:\/\/(www\.)?facebook\.com\/[A-Za-z0-9._-]+\/?(?:[?#].*)?$/,
  domain: "facebook.com",
  icon: "logo-facebook",
  iconColor: "#1877f2",
};

// The typed link for one network, and saving it. An empty link removes it.
function useSocialLink(network: SocialNetwork, { user, account, setAccount }: Session) {
  const [url, setUrl] = useState(account?.[network.field] ?? "");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user || saving) return;
    const value = url.trim();
    if (value && !network.pattern.test(value)) {
      notify(
        `Invalid ${network.name} link`,
        `Use a link like https://${network.domain}/yourusername.`,
      );
      return;
    }

    setSaving(true);
    try {
      setAccount(await updateMyAccount(user, network.changes(value || null)));
      notify(
        "Social media saved",
        value
          ? `Your ${network.name} link is now shown on your profile.`
          : `Your ${network.name} link was removed.`,
      );
    } catch (error) {
      notify(`Unable to save ${network.name}`, apiErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  return { url, setUrl, saving, save };
}

function SocialLinkInput({
  network,
  session,
  spaced,
}: {
  network: SocialNetwork;
  session: Session;
  spaced?: boolean;
}) {
  const { url, setUrl, saving, save } = useSocialLink(network, session);
  return (
    <View style={[styles.socialInputRow, spaced && styles.socialInputRowSpaced]}>
      <Ionicons name={network.icon} size={20} color={network.iconColor} />
      <TextInput
        accessibilityLabel={`${network.name} link`}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="url"
        onChangeText={setUrl}
        placeholder={`https://www.${network.domain}/yourusername`}
        placeholderTextColor="#9aa39d"
        style={styles.socialInput}
        value={url}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={saving ? `Saving ${network.name} link` : `Save ${network.name} link`}
        disabled={saving}
        onPress={save}
        style={[styles.socialSaveButton, saving && styles.disabled]}
      >
        <Text style={styles.socialSaveText}>{saving ? "Saving…" : "Save link"}</Text>
      </Pressable>
    </View>
  );
}

// Optional Instagram and Facebook links shown on the public profile.
export function SocialMediaSection({ session }: { session: Session }) {
  return (
    <Section title="Social media">
      <Text style={styles.note}>Optional links shown on your public profile.</Text>
      <SocialLinkInput network={instagram} session={session} />
      <SocialLinkInput network={facebook} session={session} spaced />
    </Section>
  );
}
