import { useCallback, useEffect, useState } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { FlatList, View } from 'react-native';
import { ListRow } from '../../src/components/ListRow';
import { StateView } from '../../src/components/StateView';
import { type LoadState, MockApi, toState } from '../../src/api';
import { cachedHabits, replaceHabits } from '../../src/repository';
import { useAuth } from '../../src/auth';
import { useColors } from '../../src/useColors';

export default function Home() {
  const { colors } = useColors();
  const { token, ready } = useAuth();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    if (ready && !token) router.replace('/sign-in');
  }, [ready, token]);

  const load = useCallback(async () => {
    setState({ status: 'loading' });
    const cached = await cachedHabits();
    try {
      const habits = await MockApi.habits();
      await replaceHabits(habits);
      setState(toState(habits, cached));
    } catch (error) {
      setState(toState([], cached, error as never));
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StateView state={state} onRetry={load} />
      <FlatList
        data={state.status === 'content' || state.status === 'offline' ? state.habits : []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ListRow
            title={item.title}
            subtitle={`${item.streak}-day streak`}
            colors={colors}
            onPress={() => router.push({ pathname: '/detail/[id]', params: { id: item.id } })}
          />
        )}
      />
    </View>
  );
}
