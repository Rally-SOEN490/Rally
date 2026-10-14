import { StyleSheet } from "react-native";

const green = "#2F5D46";
export const yellow = "#F2C230";

export const s = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, paddingTop: 85 },
  center: { alignItems: "center", justifyContent: "center" },
  logo: { width: 60, height: 60, borderRadius: 18, backgroundColor: "#1E4A37", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", alignSelf: "center", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  hero: { color: "#fff", fontSize: 34, fontWeight: "700", textAlign: "center" },
  rally: { color: yellow, fontStyle: "italic", textDecorationLine: "underline", marginBottom: 38 },
  card: { backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 20, padding: 16, gap: 12 },
  muted: { color: "#777", fontSize: 12, textAlign: "center" },
  title: { color: "#222", fontSize: 24, fontWeight: "600", textAlign: "center" },
  field: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.05)", borderRadius: 10, paddingHorizontal: 12, gap: 10 },
  input: { flex: 1, paddingVertical: 12, color: "#222" },
  button: { backgroundColor: green, borderRadius: 10, padding: 12, alignItems: "center" },
  buttonText: { color: yellow, fontWeight: "600" },
  google: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", alignSelf: "center" },
});
