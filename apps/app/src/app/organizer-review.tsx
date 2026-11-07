// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ReviewActions } from "@/components/organizer/reviewActions";
import { ReviewDetails } from "@/components/organizer/reviewDetails";
import { GREEN, styles } from "@/components/organizer/styles";
import { useApplicationReview } from "@/components/organizer/useApplicationReview";
import { reviewTokenFromHash } from "@/lib/organizer-applications";
import { organizerCopy } from "@/translations/organizer.en";

const copy = organizerCopy.review;

// The address as the page first loaded, read before the router could change it.
const hashAtStart = typeof window !== "undefined" ? (window.location?.hash ?? "") : "";

// The page a reviewer opens from the "become an organizer" email. It needs no
// login: the token after "#" in the link is the permission. Browsers never send
// that part to a server, so the token stays out of server logs.
export default function OrganizerReview() {
  const [token] = useState(() =>
    reviewTokenFromHash((typeof window !== "undefined" && window.location?.hash) || hashAtStart),
  );
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView contentContainerStyle={styles.pageContent}>
        <View style={styles.pageCard}>
          <Text style={styles.brand}>RALLY</Text>
          <Text style={styles.title} accessibilityRole="header">
            {copy.pageTitle}
          </Text>
          {Platform.OS !== "web" ? (
            <Text style={styles.body}>{copy.openInBrowser}</Text>
          ) : token ? (
            <Review token={token} />
          ) : (
            <Text style={styles.body}>{copy.noToken}</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Review({ token }: { token: string }) {
  const review = useApplicationReview(token);
  const { loaded } = review;
  if (loaded.kind === "loading")
    return (
      <View style={styles.center}>
        <ActivityIndicator color={GREEN} />
        <Text style={styles.muted}>{copy.loading}</Text>
      </View>
    );
  if (loaded.kind === "failed")
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{loaded.message}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={review.reload}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryButtonText}>{copy.retry}</Text>
        </Pressable>
      </View>
    );
  const { application } = loaded;
  return (
    <View>
      <ReviewDetails application={application} />
      {application.status === "PENDING" ? (
        <ReviewActions review={review} name={application.applicantName} />
      ) : (
        !!review.error && <Text style={styles.error}>{review.error}</Text>
      )}
    </View>
  );
}
