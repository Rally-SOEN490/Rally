import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "@/lib/firebase";

const displayName =
  auth.currentUser?.displayName ||
  auth.currentUser?.email?.split("@")[0]?.replace(/[._-]/g, " ") ||
  "Chau";

const navItems = [
  { label: "Home", icon: "⌂", active: false },
  { label: "Events", icon: "◫", active: false },
  { label: "Search", icon: "⌕", active: true },
  { label: "Notifications", icon: "◌", active: false },
  { label: "You", icon: "◔", active: false },
];

const sponsoredTournaments = [
  {
    title: "Con Khi Volleyball Tournament",
    subtitle: "Vanier College • 9:00 AM - 16:00 PM",
    label: "Indoor 6s",
    level: "Mixed C+",
    spots: "8 of 16 spots left",
    button: "Register",
  },
];

const recruitingCards = [
  {
    name: "Falcons Co-ed 6s",
    description: "Needs: Setter, Libero",
    tag: "team",
  },
  {
    name: "Riptide Rec League",
    description: "Needs: Outside Hitter",
    tag: "team",
  },
];

const announcements = [
  {
    title: "Fall Classic bracket released",
    subtitle: "Pool play groups are now live — check your team’s schedule",
    time: "2h ago",
  },
];

export default function Home() {
  const user = auth.currentUser;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.headerText}>Home</Text>
          <Pressable
            onPress={() =>
              signOut(auth).then(() => router.replace("/login")).catch(() => {})
            }
          >
            <Text style={styles.headerAction}>Log out</Text>
          </Pressable>
        </View>

        <Text style={styles.userText}>Logged in as {user?.email}</Text>

        <View style={styles.heroCard}>
          <View style={styles.heroPattern} />
          <Text style={styles.eyebrow}>RALLY</Text>
          <Text style={styles.heroTitle}>Welcome back, {displayName}</Text>
        </View>

        <View style={styles.upcomingCard}>
          <Text style={styles.upcomingLabel}>UPCOMING MATCH</Text>
          <Text style={styles.upcomingTitle}>Sunbirds vs Falcons</Text>
          <View style={styles.matchMetaRow}>
            <Text style={styles.matchMeta}>Sat, Oct 10 • 2:00 PM</Text>
            <Text style={styles.matchMeta}>•</Text>
            <Text style={styles.matchMeta}>Loyola Gym</Text>
          </View>
          <Pressable style={styles.matchButton} onPress={() => router.push("/profile")}>
            <Text style={styles.matchButtonText}>View Match Details</Text>
            <Text style={styles.matchButtonArrow}>→</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Sponsored Tournaments</Text>
          <Text style={styles.seeAll}>See all</Text>
        </View>

        {sponsoredTournaments.map((tour, index) => (
          <View key={`${tour.title}-${index}`} style={styles.sponsorCard}>
            <View style={styles.cardTopRow}>
              <View style={styles.dateBadge}>
                <Text style={styles.dateBadgeText}>SAT</Text>
                <Text style={styles.dateBadgeTextBold}>17</Text>
              </View>
              <View style={styles.tournamentTextWrap}>
                <Text style={styles.sponsorTitle}>{tour.title}</Text>
                <Text style={styles.sponsorSubtitle}>{tour.subtitle}</Text>
                <View style={styles.tagRow}>
                  <Text style={styles.tag}>{tour.label}</Text>
                  <Text style={styles.tagMuted}>{tour.level}</Text>
                </View>
              </View>
            </View>

            <View style={styles.spotsRow}>
              <Text style={styles.spotsText}>{tour.spots}</Text>
              <Pressable style={styles.registerButton}>
                <Text style={styles.registerButtonText}>{tour.button}</Text>
              </Pressable>
            </View>
          </View>
        ))}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Team Recruiting Near You</Text>
          <Text style={styles.seeAll}>See all</Text>
        </View>

        <View style={styles.recruitRow}>
          {recruitingCards.map((card, index) => (
            <Pressable key={`${card.name}-${index}`} style={styles.recruitCard}>
              <View style={styles.recruitIconWrap}>{index === 0 ? "🏐" : "🟢"}</View>
              <Text style={styles.recruitName}>{card.name}</Text>
              <Text style={styles.recruitDescription}>{card.description}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Latest Announcements</Text>
        </View>

        {announcements.map((item, index) => (
          <View key={`${item.title}-${index}`} style={styles.announcementCard}>
            <View style={styles.announcementIcon}>🏐</View>
            <View style={styles.announcementTextWrap}>
              <Text style={styles.announcementTitle}>{item.title}</Text>
              <Text style={styles.announcementSubtitle}>{item.subtitle}</Text>
            </View>
            <Text style={styles.announcementTime}>{item.time}</Text>
          </View>
        ))}

        <View style={styles.bottomTabBar}>
          {navItems.map((item) => {
            const isYou = item.label === "You";
            return (
              <Pressable
                key={item.label}
                style={styles.tabItem}
                onPress={() => {
                  if (isYou) router.push("/profile");
                }}
              >
                <Text style={isYou || item.label === "Search" ? styles.tabIconActive : styles.tabIcon}>{item.icon}</Text>
                <Text style={isYou || item.label === "Search" ? styles.tabLabelActive : styles.tabLabel}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f2f0ee",
  },
  container: {
    paddingHorizontal: 18,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 14,
  },
  headerText: {
    fontSize: 15,
    color: "#213933",
    fontWeight: "600",
  },
  headerActions: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  headerAction: {
    fontSize: 12,
    color: "#1d2d2a",
    fontWeight: "700",
  },
  userText: {
    fontSize: 14,
    color: "#213933",
    marginBottom: 14,
  },
  heroCard: {
    backgroundColor: "#1d4f43",
    borderRadius: 18,
    padding: 18,
    minHeight: 145,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  heroPattern: {
    position: "absolute",
    right: -38,
    bottom: -30,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.12)",
  },
  eyebrow: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  heroTitle: {
    color: "#f6f3ef",
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "800",
    maxWidth: 220,
  },
  upcomingCard: {
    backgroundColor: "#1d4f43",
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
  },
  upcomingLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  upcomingTitle: {
    color: "#f8f5f2",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 8,
    marginBottom: 6,
  },
  matchMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  matchMeta: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
  },
  matchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    paddingVertical: 12,
  },
  matchButtonText: {
    color: "#f4efe9",
    fontSize: 15,
    fontWeight: "700",
  },
  matchButtonArrow: {
    color: "#f4efe9",
    fontSize: 18,
    fontWeight: "800",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#1d2d2a",
    fontSize: 20,
    fontWeight: "800",
  },
  seeAll: {
    color: "#5b6964",
    fontSize: 13,
    fontWeight: "700",
  },
  sponsorCard: {
    backgroundColor: "#f5f2ee",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#dcd5ce",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  dateBadge: {
    backgroundColor: "#1d4f43",
    borderRadius: 10,
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  dateBadgeText: {
    color: "#f0f5f3",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  dateBadgeTextBold: {
    color: "#f0f5f3",
    fontSize: 20,
    fontWeight: "800",
  },
  tournamentTextWrap: {
    flex: 1,
  },
  sponsorTitle: {
    color: "#1d2d2a",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 22,
  },
  sponsorSubtitle: {
    color: "#5a6662",
    fontSize: 12,
    marginTop: 4,
  },
  tagRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: "#e8e2dc",
    color: "#25463e",
    borderRadius: 999,
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: "hidden",
  },
  tagMuted: {
    color: "#4f5854",
    fontSize: 10,
    fontWeight: "700",
  },
  spotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  spotsText: {
    color: "#5e6663",
    fontSize: 12,
    fontWeight: "600",
  },
  registerButton: {
    backgroundColor: "#1d4f43",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  registerButtonText: {
    color: "#f8f5f2",
    fontSize: 13,
    fontWeight: "700",
  },
  recruitRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  recruitCard: {
    flex: 1,
    backgroundColor: "#f5f2ee",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#dcd5ce",
  },
  recruitIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e6e1d8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  recruitName: {
    color: "#1d2d2a",
    fontSize: 18,
    fontWeight: "800",
  },
  recruitDescription: {
    color: "#5a6662",
    fontSize: 11,
    marginTop: 6,
    lineHeight: 16,
  },
  announcementCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f2ee",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#dcd5ce",
    marginBottom: 12,
  },
  announcementIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#e6e1d8",
    textAlign: "center",
    lineHeight: 28,
    marginRight: 10,
  },
  announcementTextWrap: {
    flex: 1,
  },
  announcementTitle: {
    color: "#1d2d2a",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 22,
  },
  announcementSubtitle: {
    color: "#5c6764",
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  announcementTime: {
    color: "#5a6662",
    fontSize: 11,
    marginLeft: 8,
  },
  bottomTabBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f4f1ef",
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#d9d2cc",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
  },
  tabIcon: {
    fontSize: 18,
    color: "#5f6964",
  },
  tabIconActive: {
    fontSize: 18,
    color: "#1d2d2a",
    fontWeight: "800",
  },
  tabLabel: {
    fontSize: 10,
    color: "#5f6964",
    marginTop: 2,
  },
  tabLabelActive: {
    fontSize: 10,
    color: "#1d2d2a",
    fontWeight: "800",
    marginTop: 2,
  },
});
