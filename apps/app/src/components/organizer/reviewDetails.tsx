// Copyright (c) 2026 Rally. All rights reserved.
// AI contribution: 50% or more AI-generated

import { Linking, Text, View } from "react-native";
import type { ApplicationForReview } from "@/lib/organizer-applications";
import { organizerCopy } from "@/translations/organizer.en";
import { styles } from "./styles";

const copy = organizerCopy.review;

// What the applicant sent, and where the request stands.
export function ReviewDetails({ application }: { application: ApplicationForReview }) {
  return (
    <View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{copy.status[application.status]}</Text>
      </View>
      <Text style={styles.label}>{copy.applicant}</Text>
      <Text style={styles.title}>{application.applicantName}</Text>
      <Text style={styles.muted}>{copy.submitted(application.createdAt)}</Text>
      <Text style={styles.label}>{copy.whatTheyOrganize}</Text>
      <View style={styles.quote}>
        <Text style={styles.body}>{application.description}</Text>
      </View>
      <Text style={styles.label}>{copy.link}</Text>
      {application.link ? (
        <Text
          accessibilityRole="link"
          style={styles.link}
          onPress={() => Linking.openURL(application.link!)}
        >
          {application.link}
        </Text>
      ) : (
        <Text style={styles.muted}>{copy.noLink}</Text>
      )}
      <ReviewOutcome application={application} />
    </View>
  );
}

function ReviewOutcome({ application }: { application: ApplicationForReview }) {
  const { status, applicantName, denyReason, expiresAt } = application;
  if (status === "PENDING") return <Text style={styles.body}>{copy.expires(expiresAt)}</Text>;
  const result =
    status === "APPROVED"
      ? copy.approvedResult(applicantName)
      : status === "DENIED"
        ? copy.deniedResult(applicantName)
        : copy.expiredResult;
  return (
    <View style={styles.statusCard} accessibilityLiveRegion="polite">
      <Text style={styles.statusTitle}>{result}</Text>
      {status === "DENIED" && !!denyReason && (
        <Text style={styles.body}>{copy.reasonShown(denyReason)}</Text>
      )}
    </View>
  );
}
