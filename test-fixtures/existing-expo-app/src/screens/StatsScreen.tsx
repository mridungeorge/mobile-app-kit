import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { endpoints, request } from "../api";

type Streak = { id: string; days: number };

export function StatsScreen() {
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    request(endpoints.habits)
      .then(setStreaks)
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <View style={styles.container}>
      <Text accessibilityRole="header">Your streaks</Text>
      {error ? <Text>{error}</Text> : streaks.map((s) => <Text key={s.id}>{s.days} days</Text>)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 }
});
