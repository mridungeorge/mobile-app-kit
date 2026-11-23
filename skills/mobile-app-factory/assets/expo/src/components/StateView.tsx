import { ActivityIndicator, Text, View } from 'react-native';
import type { LoadState } from '../api';
import { useColors } from '../useColors';

/** The four store-review states, in one place so every screen renders them the same way. */
export function StateView({ state, onRetry }: { state: LoadState; onRetry?: () => void }) {
  const { colors } = useColors();
  if (state.status === 'loading') {
    return (
      <View accessibilityLabel="Loading" style={{ padding: 24 }}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }
  if (state.status === 'empty') {
    return (
      <View style={{ padding: 16 }}>
        <Text style={{ color: colors.text, fontSize: 17 }}>Nothing here yet</Text>
        <Text style={{ color: colors.textSecondary, marginTop: 4 }}>Add your first habit to get started.</Text>
      </View>
    );
  }
  if (state.status === 'error') {
    return (
      <View style={{ padding: 16 }}>
        <Text accessibilityRole="alert" style={{ color: colors.danger }}>{state.message}</Text>
        {onRetry ? <Text onPress={onRetry} style={{ color: colors.accent, marginTop: 8 }}>Try again</Text> : null}
      </View>
    );
  }
  if (state.status === 'offline') {
    return (
      <Text style={{ color: colors.textSecondary, paddingHorizontal: 16, paddingVertical: 8 }}>
        You are offline. Your saved habits are still here.
      </Text>
    );
  }
  return null;
}
