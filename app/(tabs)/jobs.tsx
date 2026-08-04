import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { api, type Job } from "../../src/lib/api";

export default function JobsScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await api.jobs();
      setJobs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={jobs}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
      ListHeaderComponent={
        error ? <Text style={styles.error}>{error}</Text> : null
      }
      ListEmptyComponent={
        !error ? <Text style={styles.muted}>Sin vacantes públicas.</Text> : null
      }
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => void Linking.openURL(item.url)}
          accessibilityRole="link"
        >
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>
            {item.company}
            {item.location ? ` · ${item.location}` : ""}
            {item.remote ? " · Remote" : ""}
          </Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  title: { fontSize: 16, fontWeight: "600", color: "#0f172a" },
  meta: { marginTop: 4, fontSize: 13, color: "#64748b" },
  error: { color: "#b91c1c", marginBottom: 8 },
  muted: { color: "#64748b", textAlign: "center", marginTop: 24 },
});
