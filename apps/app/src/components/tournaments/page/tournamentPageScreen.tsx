// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import type { Href } from "expo-router";
import { useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getTournamentPage, type MyTeam, type TournamentPage } from "@/lib/tournaments";
import { useSession } from "@/lib/session";
import { tournamentCopy } from "@/translations/tournaments.en";
import { BottomBar } from "./bottomBar";
import { DivisionsSection, RegisteredTeams } from "./divisionsSection";
import { InfoCard } from "./infoCard";
import { BackButton, goBack, PageStatus, useLoadPage } from "./loadPage";
import { withMyTeam } from "./pageModel";
import { pageStyles } from "./pageStyles";
import { SignUpSheet } from "./signUpSheet";

const copy = tournamentCopy.page;

// Search when the page was opened directly, as from a link on the web.
const back = () => goBack("/search" as Href);

function PageContent({
  page,
  onSignedUp,
  onRefresh,
}: {
  page: TournamentPage;
  onSignedUp: (team: MyTeam) => void;
  onRefresh: () => void;
}) {
  const [signingUp, setSigningUp] = useState(false);
  return (
    <>
      <ScrollView contentContainerStyle={pageStyles.content}>
        <BackButton onPress={back} />
        <Text style={pageStyles.title} accessibilityRole="header">
          {page.name}
        </Text>
        <Text style={pageStyles.by}>{copy.by(page.organizerName)}</Text>
        <InfoCard page={page} />
        {page.description ? (
          <>
            <Text style={pageStyles.sectionTitle} accessibilityRole="header">
              {copy.about}
            </Text>
            <View style={pageStyles.card}>
              {/* Shown exactly as typed: line breaks, indentation and emojis. */}
              <Text style={pageStyles.about}>{page.description}</Text>
            </View>
          </>
        ) : null}
        <DivisionsSection page={page} />
        {page.isOrganizer && <RegisteredTeams />}
      </ScrollView>
      <BottomBar page={page} onSignUp={() => setSigningUp(true)} />
      {signingUp && (
        <SignUpSheet
          page={page}
          onClose={() => setSigningUp(false)}
          onOutdated={onRefresh}
          onSignedUp={(team) => {
            setSigningUp(false);
            onSignedUp(team);
          }}
        />
      )}
    </>
  );
}

// Loads the page, with retry. A missing tournament can't be retried.
function useTournamentPage(id: string) {
  const { user } = useSession();
  const { loaded, setLoaded, retry } = useLoadPage(id, getTournamentPage);
  const latestRefresh = useRef(0);

  // Fetches the page again behind what is on screen, for the server's current
  // team counts. If that fails, the page stays as it was. Only the latest
  // request counts, so an older answer can't hide a team signed up since.
  const refresh = () => {
    if (!user) return;
    const request = ++latestRefresh.current;
    getTournamentPage(user, id).then(
      (page) =>
        request === latestRefresh.current &&
        setLoaded((current) => (current.kind === "ready" ? { kind: "ready", page } : current)),
      () => undefined,
    );
  };
  // Shows the team the server just confirmed straight away, then refreshes the
  // counts, which may include other teams that signed up meanwhile.
  const signedUp = (team: MyTeam) => {
    setLoaded((current) =>
      current.kind === "ready" ? { kind: "ready", page: withMyTeam(current.page, team) } : current,
    );
    refresh();
  };
  return { loaded, retry, refresh, signedUp };
}

// A tournament's page (#301): players see the details and can sign up; its
// organizer also sees the teams (#285).
export function TournamentPageScreen({ id }: { id: string }) {
  const { loaded, retry, refresh, signedUp } = useTournamentPage(id);
  if (loaded.kind !== "ready") return <PageStatus loaded={loaded} retry={retry} onBack={back} />;
  return (
    <SafeAreaView edges={["top"]} style={pageStyles.screen}>
      <PageContent page={loaded.page} onSignedUp={signedUp} onRefresh={refresh} />
    </SafeAreaView>
  );
}
