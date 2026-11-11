// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { OrganizerApplicationSheet } from "@/components/organizer/applicationSheet";
import {
  deleteAccount,
  logOut,
  saveEmail,
  saveName,
  savePassword,
} from "@/components/settings/accountActions";
import { AccountDialogModal, type DialogHandlers } from "@/components/settings/accountDialogs";
import { PreferenceSections } from "@/components/settings/preferenceSections";
import { OrganizerRow, Row, Section } from "@/components/settings/rows";
import { SocialMediaSection } from "@/components/settings/socialMediaSection";
import { GREEN, RED, styles } from "@/components/settings/styles";
import { type Dialog, useDialogForm } from "@/components/settings/useDialogForm";
import { useSession } from "@/lib/session";

function BackButton() {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      // After a reload, Settings can be the only screen, with nothing to go back to.
      onPress={() => (router.canGoBack() ? router.back() : router.replace("/profile"))}
      style={styles.backButton}
    >
      <Ionicons name="chevron-back" size={22} color={GREEN} />
    </Pressable>
  );
}

function AccountSection({
  displayName,
  email,
  open,
}: {
  displayName: string;
  email: string;
  open: (dialog: Dialog) => void;
}) {
  return (
    <Section title="Account & login">
      <Row
        icon={<MaterialCommunityIcons name="account-edit-outline" size={22} color={GREEN} />}
        label="Name"
        value={displayName}
        onPress={() => open("name")}
      />
      <Row
        icon={<Ionicons name="mail" size={20} color={GREEN} />}
        label="E-mail"
        value={email}
        onPress={() => open("email")}
      />
      <Row
        icon={<Ionicons name="lock-closed" size={20} color={GREEN} />}
        label="Password"
        value="••••••••"
        onPress={() => open("password")}
        last
      />
    </Section>
  );
}

function SupportSection() {
  return (
    <Section title="Support">
      <Row
        icon={<Ionicons name="help-circle" size={22} color="#5a675f" />}
        label="Help & support"
        value="FAQ, contact us, report a problem"
        onPress={() => {}}
        last
      />
    </Section>
  );
}

// Log out and Delete account, at the bottom of the screen.
function AccountButtons({ open }: { open: (dialog: Dialog) => void }) {
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Log out"
        onPress={() => open("logout")}
        style={styles.logoutButton}
      >
        <Ionicons name="log-out-outline" size={20} color={GREEN} />
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Delete account"
        onPress={() => open("delete")}
        style={styles.deleteButton}
      >
        <Ionicons name="trash" size={20} color={RED} />
        <Text style={styles.deleteText}>Delete account</Text>
      </Pressable>
    </>
  );
}

export default function Settings() {
  const session = useSession();
  const { user, account, setAccount } = session;
  const displayName = account?.displayName ?? user?.displayName ?? "";
  const form = useDialogForm(displayName);
  const [organizerSheetOpen, setOrganizerSheetOpen] = useState(false);
  const handlers: DialogHandlers = {
    saveName: () => void saveName(form, displayName, setAccount),
    saveEmail: () => void saveEmail(form),
    savePassword: () => void savePassword(form),
    logOut: () => void logOut(form),
    deleteAccount: () => void deleteAccount(form),
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <BackButton />
        <Text style={styles.heading}>Settings</Text>
        <AccountSection displayName={displayName} email={user?.email ?? ""} open={form.open} />
        <SocialMediaSection session={session} />
        <PreferenceSections session={session} />
        <SupportSection />
        <View style={[styles.card, styles.standaloneCard]}>
          <OrganizerRow account={account} onPress={() => setOrganizerSheetOpen(true)} />
        </View>
        <AccountButtons open={form.open} />
      </ScrollView>

      <AccountDialogModal form={form} handlers={handlers} />
      <OrganizerApplicationSheet
        visible={organizerSheetOpen}
        onClose={() => setOrganizerSheetOpen(false)}
      />
    </SafeAreaView>
  );
}
